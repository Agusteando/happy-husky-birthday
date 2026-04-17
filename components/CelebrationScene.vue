<template>
  <div ref="canvasContainer" class="hero-canvas-container"></div>
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

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0B132B')
  scene.fog = new THREE.FogExp2('#0B132B', 0.05)

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / 300, 0.1, 100)
  camera.position.set(0, 4, 12)
  camera.lookAt(0, 1, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, 300)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)

  // Stage Floor
  const floorGeo = new THREE.PlaneGeometry(50, 50)
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: '#1C2541',
    roughness: 0.1,
    metalness: 0.5
  })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Lighting
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.6)
  scene.add(ambientLight)

  const spotLight = new THREE.SpotLight('#D4AF37', 150)
  spotLight.position.set(0, 8, 0)
  spotLight.angle = Math.PI / 6
  spotLight.penumbra = 0.5
  spotLight.castShadow = true
  scene.add(spotLight)
  
  const fillLight = new THREE.PointLight('#F59E0B', 50, 20)
  fillLight.position.set(-5, 3, 5)
  scene.add(fillLight)

  // Utilities
  const textureLoader = new THREE.TextureLoader()
  const loadTexture = (url) => {
    if (!url) return null
    return textureLoader.load(url, undefined, undefined, () => null) // silent catch
  }

  // Create Characters
  const createCharacter = (faceUrl, index) => {
    const group = new THREE.Group()

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.5, 4, 16)
    const colorOpts = ['#D4AF37', '#10B981', '#F59E0B', '#FFFFFF', '#64748B']
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorOpts[index % colorOpts.length], roughness: 0.7 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.8
    body.castShadow = true
    group.add(body)

    // Head
    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
    const materials = Array(6).fill(new THREE.MeshStandardMaterial({ color: '#FFE0BD', roughness: 0.4 }))
    
    if (faceUrl) {
      const faceTex = loadTexture(faceUrl)
      if (faceTex) {
        faceTex.colorSpace = THREE.SRGBColorSpace
        materials[4] = new THREE.MeshBasicMaterial({ map: faceTex })
      }
    }
    const head = new THREE.Mesh(headGeo, materials)
    head.position.y = 1.5
    head.castShadow = true
    group.add(head)

    // Hat (for indices 1 and 3)
    if (index === 1 || index === 3) {
      const hatGeo = new THREE.ConeGeometry(0.3, 0.6, 16)
      const hatMat = new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.3 })
      const hat = new THREE.Mesh(hatGeo, hatMat)
      hat.position.y = 2.0
      hat.castShadow = true
      group.add(hat)
    }

    // Gift (for index 0)
    if (index === 0) {
      const giftGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
      const giftMat = new THREE.MeshStandardMaterial({ color: '#EF4444' })
      const gift = new THREE.Mesh(giftGeo, giftMat)
      gift.position.set(0, 0.8, 0.4)
      gift.castShadow = true
      
      const ribbonGeo = new THREE.BoxGeometry(0.32, 0.05, 0.32)
      const ribbonMat = new THREE.MeshStandardMaterial({ color: '#D4AF37' })
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat)
      gift.add(ribbon)
      
      group.add(gift)
    }

    // Initial positioning in a circle
    const angle = (index / 5) * Math.PI * 2
    const radius = 2.5
    group.position.x = Math.cos(angle) * radius
    group.position.z = Math.sin(angle) * radius
    
    // Look center
    group.lookAt(0, group.position.y, 0)

    scene.add(group)
    return { mesh: group, angle, radius, speed: 0.005 + (Math.random() * 0.002) }
  }

  // Populate
  const facesToUse = props.faces.length === 5 ? props.faces : Array(5).fill(null)
  facesToUse.forEach((face, i) => {
    characters.push(createCharacter(face, i))
  })

  // Resize handler
  const onWindowResize = () => {
    if (!camera || !renderer) return
    camera.aspect = window.innerWidth / 300
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, 300)
  }
  window.addEventListener('resize', onWindowResize)

  // Animation Loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    characters.forEach((char) => {
      char.angle += char.speed
      // Bobbing motion for walking illusion
      char.mesh.position.y = Math.sin(char.angle * 10) * 0.1
      
      // Circling
      char.mesh.position.x = Math.cos(char.angle) * char.radius
      char.mesh.position.z = Math.sin(char.angle) * char.radius
      
      // Look forward along the tangent
      const nextX = Math.cos(char.angle + 0.1) * char.radius
      const nextZ = Math.sin(char.angle + 0.1) * char.radius
      char.mesh.lookAt(nextX, char.mesh.position.y, nextZ)
    })

    // Subtle camera pan
    camera.position.x = Math.sin(Date.now() * 0.0005) * 1
    camera.lookAt(0, 1, 0)

    renderer.render(scene, camera)
  }
  animate()
}

onMounted(() => {
  // Add a slight delay to ensure faces prop is populated if fetched async
  setTimeout(initScene, 300)
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.hero-canvas-container {
  width: 100%;
  height: 300px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: hidden;
  background-color: var(--primary-navy);
  box-shadow: inset 0 -20px 30px -10px rgba(248, 250, 252, 1);
}
</style>