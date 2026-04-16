<template>
  <div ref="canvasContainer" class="cake-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const canvasContainer = ref(null)
let scene, camera, renderer, animationId

onMounted(() => {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  
  renderer.setSize(60, 60)
  canvasContainer.value.appendChild(renderer.domElement)

  // Cake base
  const geometry = new THREE.CylinderGeometry(2, 2, 1.5, 32)
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff }) // White frosting
  const cake = new THREE.Mesh(geometry, material)
  
  // Decorative ring
  const ringGeo = new THREE.TorusGeometry(2, 0.2, 16, 100)
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xd4af37 }) // Gold
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = -0.75
  cake.add(ring)

  // Candle
  const candleGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 16)
  const candleMat = new THREE.MeshStandardMaterial({ color: 0xef4444 })
  const candle = new THREE.Mesh(candleGeo, candleMat)
  candle.position.y = 1.25
  cake.add(candle)

  // Flame
  const flameGeo = new THREE.ConeGeometry(0.1, 0.3, 16)
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b })
  const flame = new THREE.Mesh(flameGeo, flameMat)
  flame.position.y = 1.8
  cake.add(flame)

  scene.add(cake)

  // Lighting
  const light = new THREE.PointLight(0xffffff, 1, 100)
  light.position.set(5, 5, 5)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0x404040, 2))

  camera.position.set(0, 3, 6)
  camera.lookAt(0, 0, 0)

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    cake.rotation.y += 0.01
    flame.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.1 // flickering
    renderer.render(scene, camera)
  }
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
})
</script>

<style scoped>
.cake-container { width: 60px; height: 60px; overflow: hidden; border-radius: 50%; background: rgba(255,255,255,0.1); }
</style>