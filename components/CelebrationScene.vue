<template>
  <div ref="canvasContainer" class="hero-canvas-container">
    <div class="hero-gradient-overlay"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { usePremiumAvatar } from '~/composables/usePremiumAvatar'

const props = defineProps({ faces: { type: Array, default: () => [] } })
const canvasContainer = ref(null)

let scene, camera, renderer, animationId
const characters = []
const activeUnwatchers = []
let confettiMesh = null
const confettiCount = 350
const dummy = new THREE.Object3D()

const { processAvatar } = usePremiumAvatar()

const initScene = () => {
  if (!canvasContainer.value) return

  canvasContainer.value.innerHTML = '<div class="hero-gradient-overlay"></div>'
  
  activeUnwatchers.forEach(unwatch => unwatch())
  activeUnwatchers.length = 0

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#FAF9F6')
  scene.fog = new THREE.FogExp2('#FAF9F6', 0.05)

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / 400, 0.1, 100)
  camera.position.set(0, 4, 16)
  camera.lookAt(0, 1.5, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, 400)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)

  // Stage Floor
  const floorGeo = new THREE.PlaneGeometry(60, 60)
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: '#FFFFFF', roughness: 0.8, metalness: 0.1 
  })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Lighting
  const ambientLight = new THREE.AmbientLight('#ffffff', 1.4)
  scene.add(ambientLight)

  const spotLight = new THREE.SpotLight('#FFF8E7', 150)
  spotLight.position.set(2, 12, 6)
  spotLight.angle = Math.PI / 4
  spotLight.penumbra = 0.8
  spotLight.castShadow = true
  spotLight.shadow.bias = -0.0005
  scene.add(spotLight)

  const fillLight = new THREE.PointLight('#E2E8F0', 80, 20)
  fillLight.position.set(-6, 5, -2)
  scene.add(fillLight)

  // High-fidelity Confetti
  const confettiGeo = new THREE.PlaneGeometry(0.12, 0.12)
  const confettiMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  confettiMesh = new THREE.InstancedMesh(confettiGeo, confettiMat, confettiCount)
  
  const colors = [new THREE.Color('#D4AF37'), new THREE.Color('#ED8936'), new THREE.Color('#48BB78'), new THREE.Color('#4299E1'), new THREE.Color('#F56565')]
  const confettiData = []
  
  for(let i=0; i<confettiCount; i++) {
    const x = (Math.random() - 0.5) * 20
    const y = Math.random() * 12 + 2
    const z = (Math.random() - 0.5) * 10 - 2
    
    dummy.position.set(x, y, z)
    dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI)
    dummy.updateMatrix()
    confettiMesh.setMatrixAt(i, dummy.matrix)
    confettiMesh.setColorAt(i, colors[Math.floor(Math.random() * colors.length)])
    
    confettiData.push({
      x, y, z,
      rx: Math.random() * 0.1,
      ry: Math.random() * 0.1,
      speed: Math.random() * 0.05 + 0.02
    })
  }
  scene.add(confettiMesh)

  const textureLoader = new THREE.TextureLoader()

  const createCharacter = (faceUrl, index) => {
    const group = new THREE.Group()
    const animState = { isSwapping: false, swapTime: 0 }

    // Soft 3D bodies
    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.5, 4, 16)
    const colorOpts = ['#F6E05E', '#9AE6B4', '#FBD38D', '#E2E8F0', '#BEE3F8']
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorOpts[index % colorOpts.length], roughness: 0.8 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.85
    body.castShadow = true
    group.add(body)

    // Estructura Jerárquica del Cráneo Paramétrico
    const headGroup = new THREE.Group()
    headGroup.position.y = 1.7
    group.add(headGroup)

    // Shell Trasero (Cráneo base predeterminado, refinado más tarde)
    const shellGeo = new THREE.CapsuleGeometry(0.45, 0.3, 4, 16)
    const shellMat = new THREE.MeshStandardMaterial({ color: '#FDFBF7', roughness: 0.6 })
    const shellMesh = new THREE.Mesh(shellGeo, shellMat)
    shellMesh.position.z = -0.1
    shellMesh.castShadow = true
    headGroup.add(shellMesh)

    // Superficie Facial Inicial (Forma plana provisional)
    let headGeo = new THREE.PlaneGeometry(1.0, 1.0, 16, 16)
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: true, 
      roughness: 0.6
    })
    const headMesh = new THREE.Mesh(headGeo, headMat)
    headMesh.position.z = 0.25
    headMesh.castShadow = true
    headGroup.add(headMesh)

    if (faceUrl) {
      const pipeline = processAvatar(faceUrl)

      if (pipeline.displaySrc) {
        textureLoader.load(pipeline.displaySrc, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          headMat.map = tex
          headMat.needsUpdate = true
        })
      }

      const unwatchTex = watch(() => pipeline.processedSrc, (newSrc) => {
        if (newSrc && newSrc !== headMat.map?.image?.src) {
          textureLoader.load(newSrc, (newTex) => {
            newTex.colorSpace = THREE.SRGBColorSpace
            const oldTex = headMat.map
            headMat.map = newTex
            headMat.needsUpdate = true
            
            if (oldTex) oldTex.dispose()

            animState.isSwapping = true
            animState.swapTime = clock.getElapsedTime()
          })
        }
      })
      activeUnwatchers.push(unwatchTex)

      // Variación determinista paramétrica del rostro usando los puntos anatómicos mapeados por la Vision API
      const unwatchMeta = watch(() => pipeline.meta, (meta) => {
        if (meta && meta.cropBox) {
          const cw = meta.cropBox.xMax - meta.cropBox.xMin
          const ch = meta.cropBox.yMax - meta.cropBox.yMin
          const aspect = cw / ch

          const h = 1.1
          const w = h * aspect

          // Curvar la malla plana nativamente manipulando sus vértices a través del eje Z
          const newGeo = new THREE.PlaneGeometry(w, h, 16, 16)
          const pos = newGeo.attributes.position
          const curveDepth = w * 0.28 // Sensación de profundidad de la mejilla 

          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i)
            const nx = x / (w / 2) // Valor normalizado -1 a 1
            const z = (Math.cos(nx * Math.PI / 2) - 1) * curveDepth
            pos.setZ(i, z)
          }
          newGeo.computeVertexNormals()

          if (headMesh.geometry) headMesh.geometry.dispose()
          headMesh.geometry = newGeo

          // Escalar y desplazar orgánicamente la masa craneal conectada (el shell)
          shellMesh.scale.set(w * 0.8, h * 0.8, w * 0.6)

          if (meta.eyeBoxes && meta.eyeBoxes.leftEye && meta.eyeBoxes.rightEye) {
            // Ancho craneal correlacionado directamente con la distancia inter-ocular
            const eyeDist = Math.abs(meta.eyeBoxes.rightEye.x - meta.eyeBoxes.leftEye.x)
            const eyeRatio = eyeDist / cw
            shellMesh.scale.x *= (1.0 + (eyeRatio - 0.25) * 1.5)

            // Balance proporcional de frente y mentón
            if (meta.faceBox) {
              const faceCenterY = (meta.faceBox.yMin + meta.faceBox.yMax) / 2
              const cropCenterY = (meta.cropBox.yMin + meta.cropBox.yMax) / 2
              const yOffset = cropCenterY - faceCenterY
              shellMesh.position.y = yOffset * 0.8
            }
          }
        }
      }, { immediate: true })
      activeUnwatchers.push(unwatchMeta)
    }

    if (index === 1) {
      const giftGroup = new THREE.Group()
      
      const boxMat = new THREE.MeshStandardMaterial({ color: '#FC8181', roughness: 0.4 })
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), boxMat)
      box.castShadow = true
      giftGroup.add(box)
      
      const ribbonMat = new THREE.MeshStandardMaterial({ color: '#FAF089', metalness: 0.6, roughness: 0.2 })
      const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.52), ribbonMat)
      const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.05), ribbonMat)
      const r3 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.52), ribbonMat)
      giftGroup.add(r1, r2, r3)
      
      const bow = new THREE.Mesh(new THREE.TorusKnotGeometry(0.08, 0.02, 64, 8), ribbonMat)
      bow.position.y = 0.28
      giftGroup.add(bow)
      
      giftGroup.position.set(0, 0.8, 0.45)
      group.add(giftGroup)
    }

    const targetPos = new THREE.Vector3()
    if (index === 0) {
      targetPos.set(0, 0, 2.5)
    } else {
      const angle = ((index - 1) / 3) * Math.PI + Math.PI/4
      targetPos.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 1.5 + 2.5)
    }
    
    group.position.set(targetPos.x + (Math.random()-0.5)*10, 0, targetPos.z - 6)

    scene.add(group)
    return { 
      mesh: group, 
      headGroup,
      targetPos,
      isBirthdayPerson: index === 0,
      timeOffset: Math.random() * 100,
      animState
    }
  }

  const facesToUse = props.faces.length > 0 ? props.faces : Array(5).fill(null)
  facesToUse.slice(0, 5).forEach((face, i) => {
    characters.push(createCharacter(face, i))
  })

  const onWindowResize = () => {
    if (!camera || !renderer) return
    camera.aspect = window.innerWidth / 400
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, 400)
  }
  window.addEventListener('resize', onWindowResize)

  const clock = new THREE.Clock()

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    
    if (confettiMesh) {
      for(let i=0; i<confettiCount; i++) {
        const d = confettiData[i]
        d.y -= d.speed
        d.x += Math.sin(t + i) * 0.01
        if(d.y < 0) d.y = 12
        
        dummy.position.set(d.x, d.y, d.z)
        dummy.rotation.x += d.rx
        dummy.rotation.y += d.ry
        dummy.updateMatrix()
        confettiMesh.setMatrixAt(i, dummy.matrix)
      }
      confettiMesh.instanceMatrix.needsUpdate = true
    }

    characters.forEach((char) => {
      char.mesh.position.lerp(char.targetPos, 0.03)
      // Ajuste para orientar toda la agrupación craneal integralmente a cámara
      char.headGroup.lookAt(camera.position)

      if (char.isBirthdayPerson) {
        char.mesh.position.y = Math.abs(Math.sin(t * 4)) * 0.6
        char.mesh.rotation.y = Math.sin(t * 2) * 0.3
      } else {
        char.mesh.position.y = Math.abs(Math.sin(t * 6 + char.timeOffset)) * 0.1
        char.mesh.lookAt(0, char.mesh.position.y, 2.5)
      }

      if (char.animState.isSwapping) {
        const elapsed = t - char.animState.swapTime
        if (elapsed < 0.3) {
          const bounce = 1 + Math.sin(elapsed * Math.PI / 0.3) * 0.15
          char.headGroup.scale.set(bounce, bounce, bounce)
        } else {
          char.headGroup.scale.set(1, 1, 1)
          char.animState.isSwapping = false
        }
      }
    })

    camera.position.x = Math.sin(t * 0.15) * 2
    camera.lookAt(0, 1.5, 0)

    renderer.render(scene, camera)
  }
  animate()
}

onMounted(() => {
  setTimeout(initScene, 100)
})

watch(() => props.faces, () => {
  if (props.faces.length > 0) {
    if (animationId) cancelAnimationFrame(animationId)
    characters.length = 0
    initScene()
  }
}, { deep: true })

onBeforeUnmount(() => {
  activeUnwatchers.forEach(unwatch => unwatch())
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.hero-canvas-container {
  width: 100%;
  height: 400px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: hidden;
  background-color: var(--bg-color);
}

.hero-gradient-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(to bottom, rgba(250, 249, 246, 0) 0%, var(--bg-color) 100%);
  pointer-events: none;
  z-index: 1;
}
</style>