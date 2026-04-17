<template>
  <div 
    ref="canvasContainer" 
    class="hero-canvas-container"
    :class="{'is-dragging': isDraggingUI}"
  >
    <div class="hero-gradient-overlay"></div>
    <div class="interaction-hint">Arrastre para explorar la celebración</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { usePremiumAvatar } from '~/composables/usePremiumAvatar'

const props = defineProps({ faces: { type: Array, default: () => [] } })
const canvasContainer = ref(null)
const isDraggingUI = ref(false)

let scene, camera, renderer, animationId
const characters = []
let activeCake = null
const activeUnwatchers = []
let confettiMesh = null
const confettiCount = 350
const dummy = new THREE.Object3D()

// User Interaction State
let targetAngle = 0
let currentAngle = 0
let isDragging = false
let previousX = 0

const { processAvatar } = usePremiumAvatar()

const initScene = () => {
  if (!canvasContainer.value) return

  activeUnwatchers.forEach(unwatch => unwatch())
  activeUnwatchers.length = 0

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#FAF9F6')
  scene.fog = new THREE.FogExp2('#FAF9F6', 0.04)

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / 400, 0.1, 100)
  camera.position.set(0, 4, 16)
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, 400)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  
  // Clean canvas container
  Array.from(canvasContainer.value.children).forEach(child => {
    if (child.tagName === 'CANVAS') child.remove()
  })
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

  // Centerpiece: Birthday Cake
  const cakeGroup = new THREE.Group()
  const baseGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 32)
  const baseMat = new THREE.MeshStandardMaterial({ color: '#FFF5E1', roughness: 0.3 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = 0.3
  base.castShadow = true
  base.receiveShadow = true
  cakeGroup.add(base)
  
  const icingGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.2, 32)
  const icingMat = new THREE.MeshStandardMaterial({ color: '#FFB6C1', roughness: 0.2 })
  const icing = new THREE.Mesh(icingGeo, icingMat)
  icing.position.y = 0.6
  icing.castShadow = true
  cakeGroup.add(icing)

  const candleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16)
  const candleMat = new THREE.MeshStandardMaterial({ color: '#87CEFA', roughness: 0.4 })
  const candle = new THREE.Mesh(candleGeo, candleMat)
  candle.position.set(0, 0.9, 0)
  candle.castShadow = true
  cakeGroup.add(candle)

  const flameGeo = new THREE.ConeGeometry(0.06, 0.18, 16)
  const flameMat = new THREE.MeshBasicMaterial({ color: '#FFA500' })
  const flame = new THREE.Mesh(flameGeo, flameMat)
  flame.position.set(0, 1.15, 0)
  cakeGroup.add(flame)

  cakeGroup.position.set(0, 0, 4.5) // Placed in front of the birthday person
  scene.add(cakeGroup)
  activeCake = flame

  // High-fidelity Confetti
  const confettiGeo = new THREE.PlaneGeometry(0.12, 0.12)
  const confettiMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  confettiMesh = new THREE.InstancedMesh(confettiGeo, confettiMat, confettiCount)
  
  const colors = [new THREE.Color('#D4AF37'), new THREE.Color('#ED8936'), new THREE.Color('#FFB6C1'), new THREE.Color('#87CEFA'), new THREE.Color('#98FB98')]
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
    
    confettiData.push({ x, y, z, rx: Math.random() * 0.1, ry: Math.random() * 0.1, speed: Math.random() * 0.05 + 0.02 })
  }
  scene.add(confettiMesh)

  const textureLoader = new THREE.TextureLoader()

  const createCharacter = (faceUrl, index) => {
    const group = new THREE.Group()
    const animState = { isSwapping: false, swapTime: 0 }

    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.5, 4, 16)
    const colorOpts = ['#FFF0F5', '#E0FFFF', '#FFF8DC', '#F0E68C', '#E6E6FA']
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorOpts[index % colorOpts.length], roughness: 0.8 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.85
    body.castShadow = true
    group.add(body)

    const headGroup = new THREE.Group()
    headGroup.position.y = 1.7
    group.add(headGroup)

    const shellGeo = new THREE.CapsuleGeometry(0.45, 0.3, 4, 16)
    const shellMat = new THREE.MeshStandardMaterial({ color: '#FDFBF7', roughness: 0.6 })
    const shellMesh = new THREE.Mesh(shellGeo, shellMat)
    shellMesh.position.z = -0.1
    shellMesh.castShadow = true
    headGroup.add(shellMesh)

    let headGeo = new THREE.PlaneGeometry(1.0, 1.0, 16, 16)
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, side: THREE.DoubleSide, transparent: true, alphaTest: 0.1, depthWrite: true, roughness: 0.6
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

      // Consumimos el rostro enfocado y circular (sin hombros)
      const unwatchTex = watch(() => pipeline.processedFaceSrc, (newSrc) => {
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

      const unwatchMeta = watch(() => pipeline.meta, (meta) => {
        if (meta && meta.cropBox) {
          const cw = meta.cropBox.xMax - meta.cropBox.xMin
          const ch = meta.cropBox.yMax - meta.cropBox.yMin
          const aspect = cw / ch

          const h = 1.1
          const w = h * aspect

          const newGeo = new THREE.PlaneGeometry(w, h, 16, 16)
          const pos = newGeo.attributes.position
          const curveDepth = w * 0.28 

          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i)
            const nx = x / (w / 2) 
            const z = (Math.cos(nx * Math.PI / 2) - 1) * curveDepth
            pos.setZ(i, z)
          }
          newGeo.computeVertexNormals()

          if (headMesh.geometry) headMesh.geometry.dispose()
          headMesh.geometry = newGeo

          shellMesh.scale.set(w * 0.8, h * 0.8, w * 0.6)

          if (meta.eyeBoxes && meta.eyeBoxes.leftEye && meta.eyeBoxes.rightEye) {
            const eyeDist = Math.abs(meta.eyeBoxes.rightEye.x - meta.eyeBoxes.leftEye.x)
            const eyeRatio = eyeDist / cw
            shellMesh.scale.x *= (1.0 + (eyeRatio - 0.25) * 1.5)

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

    const targetPos = new THREE.Vector3()
    if (index === 0) {
      targetPos.set(0, 0, 2.5) // The Birther behind the cake
    } else {
      const angle = ((index - 1) / 3) * Math.PI + Math.PI/4
      targetPos.set(Math.cos(angle) * 3.5, 0, Math.sin(angle) * 1.5 + 2.0)
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

  // Pointer Interactions
  const onPointerDown = (e) => {
    isDragging = true
    isDraggingUI.value = true
    previousX = e.clientX || e.touches?.[0].clientX
  }
  const onPointerMove = (e) => {
    if (!isDragging) return
    const x = e.clientX || e.touches?.[0].clientX
    const delta = x - previousX
    targetAngle -= delta * 0.008 
    targetAngle = Math.max(-Math.PI/1.5, Math.min(Math.PI/1.5, targetAngle))
    previousX = x
  }
  const onPointerUp = () => { 
    isDragging = false
    isDraggingUI.value = false 
  }

  canvasContainer.value.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)

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
    
    // Orbital camera blending
    if (!isDragging) {
      targetAngle += Math.sin(t * 0.5) * 0.0008
    }
    currentAngle += (targetAngle - currentAngle) * 0.08
    camera.position.x = Math.sin(currentAngle) * 16
    camera.position.z = Math.cos(currentAngle) * 16
    camera.lookAt(0, 1.5, 0)

    // Cake flicker
    if (activeCake) {
      activeCake.scale.set(1 + Math.sin(t*15)*0.1, 1 + Math.sin(t*25)*0.1, 1 + Math.sin(t*15)*0.1)
    }
    
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
      char.headGroup.lookAt(camera.position) // Faces always track camera orbit

      if (char.isBirthdayPerson) {
        char.mesh.position.y = Math.abs(Math.sin(t * 4)) * 0.6
      } else {
        char.mesh.position.y = Math.abs(Math.sin(t * 6 + char.timeOffset)) * 0.1
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

    renderer.render(scene, camera)
  }
  animate()
}

onMounted(() => setTimeout(initScene, 100))

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
  window.removeEventListener('pointermove', () => {})
  window.removeEventListener('pointerup', () => {})
  window.removeEventListener('pointercancel', () => {})
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
  cursor: grab;
}

.hero-canvas-container.is-dragging {
  cursor: grabbing;
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

.interaction-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  pointer-events: none;
  z-index: 2;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  animation: fadeInOut 4s forwards;
  opacity: 0;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, 10px); }
  15% { opacity: 1; transform: translate(-50%, 0); }
  80% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -10px); }
}
</style>