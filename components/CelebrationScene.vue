<template>
  <div ref="canvasContainer" class="hero-canvas-container">
    <div class="hero-gradient-overlay"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({ faces: { type: Array, default: () => [] } })
const canvasContainer = ref(null)

let scene, camera, renderer, animationId
const characters = []

const initScene = () => {
  if (!canvasContainer.value) return

  // Clean up if re-initializing
  canvasContainer.value.innerHTML = '<div class="hero-gradient-overlay"></div>'

  scene = new THREE.Scene()
  // Soft, airy environment
  scene.background = new THREE.Color('#FAF9F6')
  scene.fog = new THREE.FogExp2('#FAF9F6', 0.04)

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / 400, 0.1, 100)
  camera.position.set(0, 3.5, 14)
  camera.lookAt(0, 1.5, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, 400)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)

  // Soft Studio Floor
  const floorGeo = new THREE.PlaneGeometry(50, 50)
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: '#FFFFFF',
    roughness: 0.9,
    metalness: 0.1
  })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Cinematic Soft Lighting
  const ambientLight = new THREE.AmbientLight('#ffffff', 1.2)
  scene.add(ambientLight)

  const spotLight = new THREE.SpotLight('#FFF8E7', 120)
  spotLight.position.set(2, 10, 4)
  spotLight.angle = Math.PI / 5
  spotLight.penumbra = 0.8
  spotLight.castShadow = true
  spotLight.shadow.bias = -0.0001
  scene.add(spotLight)
  
  const fillLight = new THREE.PointLight('#E2E8F0', 60, 20)
  fillLight.position.set(-6, 4, -2)
  scene.add(fillLight)

  const textureLoader = new THREE.TextureLoader()
  const loadTexture = (url) => {
    if (!url) return null
    return textureLoader.load(url, undefined, undefined, () => null)
  }

  const createCharacter = (faceUrl, index) => {
    const group = new THREE.Group()

    // Soft pastel bodies
    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.5, 4, 16)
    const colorOpts = ['#F6E05E', '#9AE6B4', '#FBD38D', '#E2E8F0', '#BEE3F8']
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorOpts[index % colorOpts.length], roughness: 0.8 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.85
    body.castShadow = true
    group.add(body)

    // Head
    const headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65)
    const materials = Array(6).fill(new THREE.MeshStandardMaterial({ color: '#FFEDD5', roughness: 0.6 }))
    
    if (faceUrl) {
      const faceTex = loadTexture(faceUrl)
      if (faceTex) {
        faceTex.colorSpace = THREE.SRGBColorSpace
        materials[4] = new THREE.MeshBasicMaterial({ map: faceTex })
      }
    }
    const head = new THREE.Mesh(headGeo, materials)
    head.position.y = 1.6
    head.castShadow = true
    group.add(head)

    // Festive elements
    if (index === 2 || index === 4) {
      const hatGeo = new THREE.ConeGeometry(0.35, 0.7, 16)
      const hatMat = new THREE.MeshStandardMaterial({ color: '#ED8936', roughness: 0.5 })
      const hat = new THREE.Mesh(hatGeo, hatMat)
      hat.position.y = 2.25
      hat.castShadow = true
      group.add(hat)
    }

    // Playful Narrative: Character 0 carries a gift
    if (index === 0) {
      const giftGroup = new THREE.Group()
      const giftGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4)
      const giftMat = new THREE.MeshStandardMaterial({ color: '#FC8181' })
      const gift = new THREE.Mesh(giftGeo, giftMat)
      gift.castShadow = true
      
      const ribbonGeo = new THREE.BoxGeometry(0.42, 0.06, 0.42)
      const ribbonMat = new THREE.MeshStandardMaterial({ color: '#FAF089' })
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat)
      gift.add(ribbon)
      
      giftGroup.add(gift)
      giftGroup.position.set(0, 0.9, 0.5)
      group.add(giftGroup)
    }

    // Positions (semi-circle facing forward)
    const angle = (index / 4) * Math.PI - (Math.PI / 2)
    const radius = 3.5
    group.position.x = Math.cos(angle) * radius
    group.position.z = Math.sin(angle) * radius - 2
    
    // Everyone looks towards a central focal point
    group.lookAt(0, group.position.y, 4)

    scene.add(group)
    return { 
      mesh: group, 
      baseX: group.position.x, 
      baseZ: group.position.z,
      timeOffset: Math.random() * 100 
    }
  }

  const facesToUse = props.faces.length > 0 ? props.faces : Array(5).fill('/main.png')
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
    
    characters.forEach((char, idx) => {
      // Gentle floating / breathing animation
      char.mesh.position.y = Math.sin(t * 2 + char.timeOffset) * 0.05
      
      // Character 0 (with gift) walks slightly forward and back
      if (idx === 0) {
        char.mesh.position.z = char.baseZ + Math.sin(t * 1.5) * 0.5
      } else {
        // Others subtly sway
        char.mesh.rotation.y = Math.sin(t + char.timeOffset) * 0.1
      }
    })

    // Cinematic subtle camera drift
    camera.position.x = Math.sin(t * 0.2) * 1.5
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