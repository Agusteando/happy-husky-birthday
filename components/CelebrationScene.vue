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
let activeFlames = []
let activeCandleLights = []
const activeUnwatchers = []
let confettiMesh = null
const confettiCount = 500
const dummy = new THREE.Object3D()

let balloons = []
let floatingStars = []

// User Interaction State
let targetAngle = 0
let currentAngle = 0
let isDragging = false
let previousX = 0

const { processAvatar } = usePremiumAvatar()
const clock = new THREE.Clock()

const initScene = () => {
  if (!canvasContainer.value) return

  activeUnwatchers.forEach(unwatch => unwatch())
  activeUnwatchers.length = 0
  activeFlames = []
  activeCandleLights = []
  balloons = []
  floatingStars = []

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
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1

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

  // Festive stage carpet
  const carpetGeo = new THREE.CircleGeometry(5.8, 64)
  const carpetMat = new THREE.MeshStandardMaterial({ color: '#FFF0F5', roughness: 0.95 })
  const carpet = new THREE.Mesh(carpetGeo, carpetMat)
  carpet.rotation.x = -Math.PI / 2
  carpet.position.set(0, 0.005, 2)
  carpet.receiveShadow = true
  scene.add(carpet)

  // === ENHANCED LIGHTING ===
  const ambientLight = new THREE.AmbientLight('#FFF5E6', 1.5)
  scene.add(ambientLight)

  const mainSpot = new THREE.SpotLight('#FFF8E7', 200)
  mainSpot.position.set(2, 14, 6)
  mainSpot.angle = Math.PI / 4
  mainSpot.penumbra = 0.7
  mainSpot.castShadow = true
  mainSpot.shadow.bias = -0.0005
  mainSpot.target.position.set(0, 0, 3)
  scene.add(mainSpot)
  scene.add(mainSpot.target)

  const sideSpot = new THREE.SpotLight('#FFE4B5', 90)
  sideSpot.position.set(-8, 10, 4)
  sideSpot.angle = Math.PI / 5
  sideSpot.penumbra = 0.9
  scene.add(sideSpot)

  const fillLight = new THREE.PointLight('#B0E0FF', 60, 25)
  fillLight.position.set(-6, 5, -2)
  scene.add(fillLight)

  const rimLight = new THREE.PointLight('#FFE4E1', 50, 20)
  rimLight.position.set(8, 6, -4)
  scene.add(rimLight)

  // ==========================================
  // BEAUTIFUL 3-TIER BIRTHDAY CAKE
  // ==========================================
  const cakeGroup = new THREE.Group()

  const plateGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.07, 48)
  const plateMat = new THREE.MeshStandardMaterial({ color: '#C8C8C8', roughness: 0.08, metalness: 0.9 })
  const plate = new THREE.Mesh(plateGeo, plateMat)
  plate.position.y = 0.035
  plate.castShadow = true
  plate.receiveShadow = true
  cakeGroup.add(plate)

  const t1Geo = new THREE.CylinderGeometry(1.40, 1.40, 0.70, 44)
  const t1Mat = new THREE.MeshStandardMaterial({ color: '#7B3F28', roughness: 0.65 })
  const t1 = new THREE.Mesh(t1Geo, t1Mat)
  t1.position.y = 0.42
  t1.castShadow = true
  t1.receiveShadow = true
  cakeGroup.add(t1)

  const ct1Geo = new THREE.CylinderGeometry(1.42, 1.42, 0.09, 44)
  const ct1Mat = new THREE.MeshStandardMaterial({ color: '#FFFAF0', roughness: 0.28 })
  const ct1 = new THREE.Mesh(ct1Geo, ct1Mat)
  ct1.position.y = 0.815
  cakeGroup.add(ct1)

  for (let i = 0; i < 15; i++) {
    const a = (i / 15) * Math.PI * 2 + (Math.random() - 0.5) * 0.2
    const r = 1.39
    const dripH = 0.08 + Math.random() * 0.13
    const dripGeo = new THREE.CapsuleGeometry(0.054, dripH, 4, 8)
    const dripMat = new THREE.MeshStandardMaterial({ color: '#FFFAF0', roughness: 0.28 })
    const drip = new THREE.Mesh(dripGeo, dripMat)
    drip.position.set(Math.cos(a) * r, 0.74 - dripH * 0.3 - Math.random() * 0.04, Math.sin(a) * r)
    cakeGroup.add(drip)
  }

  const t2Geo = new THREE.CylinderGeometry(0.97, 0.97, 0.58, 44)
  const t2Mat = new THREE.MeshStandardMaterial({ color: '#FFF8CC', roughness: 0.60 })
  const t2 = new THREE.Mesh(t2Geo, t2Mat)
  t2.position.y = 1.155
  t2.castShadow = true
  t2.receiveShadow = true
  cakeGroup.add(t2)

  const ct2Geo = new THREE.CylinderGeometry(0.99, 0.99, 0.09, 44)
  const ct2Mat = new THREE.MeshStandardMaterial({ color: '#FFB6C1', roughness: 0.24 })
  const ct2 = new THREE.Mesh(ct2Geo, ct2Mat)
  ct2.position.y = 1.49
  cakeGroup.add(ct2)

  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + (Math.random() - 0.5) * 0.2
    const r = 0.97
    const dripH = 0.07 + Math.random() * 0.10
    const dripGeo = new THREE.CapsuleGeometry(0.045, dripH, 4, 8)
    const dripMat = new THREE.MeshStandardMaterial({ color: '#FFB6C1', roughness: 0.24 })
    const drip = new THREE.Mesh(dripGeo, dripMat)
    drip.position.set(Math.cos(a) * r, 1.42 - dripH * 0.3 - Math.random() * 0.04, Math.sin(a) * r)
    cakeGroup.add(drip)
  }

  const t3Geo = new THREE.CylinderGeometry(0.63, 0.63, 0.47, 44)
  const t3Mat = new THREE.MeshStandardMaterial({ color: '#FFB6C1', roughness: 0.55 })
  const t3 = new THREE.Mesh(t3Geo, t3Mat)
  t3.position.y = 1.77
  t3.castShadow = true
  t3.receiveShadow = true
  cakeGroup.add(t3)

  const domeGeo = new THREE.SphereGeometry(0.65, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.52)
  const domeMat = new THREE.MeshStandardMaterial({ color: '#FFFAF0', roughness: 0.18 })
  const dome = new THREE.Mesh(domeGeo, domeMat)
  dome.position.y = 2.005
  cakeGroup.add(dome)

  const strawGeo = new THREE.SphereGeometry(0.12, 12, 12)
  const strawMat = new THREE.MeshStandardMaterial({ color: '#E82020', roughness: 0.38 })
  const straw = new THREE.Mesh(strawGeo, strawMat)
  straw.scale.set(1, 1.3, 1)
  straw.position.y = 2.26
  cakeGroup.add(straw)

  const leafGeo = new THREE.ConeGeometry(0.1, 0.11, 6)
  const leafMat = new THREE.MeshStandardMaterial({ color: '#228B22', roughness: 0.85 })
  const leaf = new THREE.Mesh(leafGeo, leafMat)
  leaf.position.y = 2.35
  cakeGroup.add(leaf)

  const sprGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.09, 6)
  const sprMesh = new THREE.InstancedMesh(sprGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), 65)
  const sprColors = ['#FF6B9D','#FFB347','#87CEEB','#98FB98','#DDA0DD','#FF8C00','#00CED1','#FFD700']
  const sprCol = new THREE.Color()
  for (let i = 0; i < 65; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * 0.5
    dummy.position.set(Math.cos(a) * r, 2.09, Math.sin(a) * r)
    dummy.rotation.set(Math.random() * 0.55, Math.random() * Math.PI * 2, Math.random() * 0.55)
    dummy.updateMatrix()
    sprMesh.setMatrixAt(i, dummy.matrix)
    sprCol.set(sprColors[i % sprColors.length])
    sprMesh.setColorAt(i, sprCol)
  }
  sprMesh.instanceMatrix.needsUpdate = true
  if (sprMesh.instanceColor) sprMesh.instanceColor.needsUpdate = true
  cakeGroup.add(sprMesh)

  const candleColours = ['#FF6B9D','#87CEEB','#98FB98','#FFB347','#DDA0DD','#FF8C8C']
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2
    const cr = 0.34
    const cx = Math.cos(ang) * cr
    const cz = Math.sin(ang) * cr
    const baseY = 2.13

    const candleGeo = new THREE.CylinderGeometry(0.043, 0.043, 0.44, 12)
    const candleMat = new THREE.MeshStandardMaterial({ color: candleColours[i], roughness: 0.48 })
    const candle = new THREE.Mesh(candleGeo, candleMat)
    candle.position.set(cx, baseY + 0.23, cz)
    candle.castShadow = true
    cakeGroup.add(candle)

    const waxGeo = new THREE.SphereGeometry(0.04, 6, 6)
    const waxMat = new THREE.MeshStandardMaterial({ color: '#FFFFF0', roughness: 0.35 })
    const wax = new THREE.Mesh(waxGeo, waxMat)
    wax.scale.set(1, 0.52, 1)
    wax.position.set(cx + 0.025, baseY + 0.4, cz)
    cakeGroup.add(wax)

    const wickGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.06, 6)
    const wickMat = new THREE.MeshBasicMaterial({ color: '#2D1A0E' })
    const wick = new THREE.Mesh(wickGeo, wickMat)
    wick.position.set(cx, baseY + 0.475, cz)
    cakeGroup.add(wick)

    const flameGeo = new THREE.ConeGeometry(0.053, 0.175, 12)
    const flameMat = new THREE.MeshBasicMaterial({ color: '#FF8C00' })
    const flame = new THREE.Mesh(flameGeo, flameMat)
    flame.position.set(cx, baseY + 0.545, cz)
    cakeGroup.add(flame)
    activeFlames.push(flame)

    const innerGeo = new THREE.ConeGeometry(0.026, 0.095, 8)
    const innerMat = new THREE.MeshBasicMaterial({ color: '#FFE840' })
    const inner = new THREE.Mesh(innerGeo, innerMat)
    inner.position.set(cx, baseY + 0.53, cz)
    cakeGroup.add(inner)
    activeFlames.push(inner)

    const glow = new THREE.PointLight('#FF9940', 15, 3.8)
    glow.position.set(cx, baseY + 0.56, cz)
    cakeGroup.add(glow)
    activeCandleLights.push(glow)
  }

  cakeGroup.position.set(0, 0, 4.5)
  cakeGroup.scale.set(0.82, 0.82, 0.82)
  scene.add(cakeGroup)

  // ==========================================
  // FLOATING BALLOONS
  // ==========================================
  const balloonColours = ['#FF6B9D','#87CEEB','#FFD700','#98FB98','#DDA0DD','#FF8C00','#FF4444']
  const balloonPositions = [
    [-4.5, 5.5, 0.5],
    [ 4.5, 6.2, 0.8],
    [-3.2, 7.2,-1.5],
    [ 3.8, 5.2,-2.0],
    [-5.2, 6.8, 2.2],
    [ 0.5, 8.2,-0.8],
    [ 5.2, 7.6, 2.6]
  ]
  balloonPositions.forEach(([bx, by, bz], bi) => {
    const bGroup = new THREE.Group()

    const ballGeo = new THREE.SphereGeometry(0.39, 20, 16)
    const ballMat = new THREE.MeshStandardMaterial({ color: balloonColours[bi], roughness: 0.1 })
    const ball = new THREE.Mesh(ballGeo, ballMat)
    ball.scale.y = 1.22
    ball.castShadow = true
    bGroup.add(ball)

    const knotGeo = new THREE.SphereGeometry(0.055, 8, 8)
    const knotMat = new THREE.MeshStandardMaterial({ color: balloonColours[bi], roughness: 0.85 })
    const knot = new THREE.Mesh(knotGeo, knotMat)
    knot.position.y = -0.48
    bGroup.add(knot)

    const pts = []
    for (let j = 0; j <= 12; j++) {
      pts.push(new THREE.Vector3(Math.sin(j * 0.38) * 0.06, -0.5 - j * 0.2, 0))
    }
    const strGeo = new THREE.BufferGeometry().setFromPoints(pts)
    const strMat = new THREE.LineBasicMaterial({ color: '#AAAAAA', transparent: true, opacity: 0.65 })
    const str = new THREE.Line(strGeo, strMat)
    bGroup.add(str)

    bGroup.position.set(bx, by, bz)
    scene.add(bGroup)
    balloons.push({ group: bGroup, baseY: by, phase: Math.random() * Math.PI * 2, speed: 0.26 + Math.random() * 0.18 })
  })

  // ==========================================
  // FLOATING GOLD STARS
  // ==========================================
  const starPositionsList = [
    [-3.5, 7.5, 3.0],
    [ 3.5, 8.3, 2.5],
    [ 0.0, 9.6,-1.5],
    [-5.5, 8.9, 0.5],
    [ 5.0, 7.9,-0.5]
  ]
  const starGeo = new THREE.OctahedronGeometry(0.17, 0)
  const starMat = new THREE.MeshStandardMaterial({ color: '#FFD700', roughness: 0.12, metalness: 0.75 })
  starPositionsList.forEach(([sx, sy, sz]) => {
    const star = new THREE.Mesh(starGeo, starMat)
    star.position.set(sx, sy, sz)
    star.castShadow = true
    scene.add(star)
    floatingStars.push({ mesh: star, baseY: sy, phase: Math.random() * Math.PI * 2 })
  })

  // ==========================================
  // CONFETTI
  // ==========================================
  const confettiGeo = new THREE.PlaneGeometry(0.12, 0.12)
  confettiMesh = new THREE.InstancedMesh(confettiGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), confettiCount)
  const confettiColorList = [
    new THREE.Color('#D4AF37'), new THREE.Color('#ED8936'), new THREE.Color('#FFB6C1'),
    new THREE.Color('#87CEFA'), new THREE.Color('#98FB98'), new THREE.Color('#FF6B9D'),
    new THREE.Color('#DDA0DD'), new THREE.Color('#FF8C00')
  ]
  const confettiData = []
  for (let i = 0; i < confettiCount; i++) {
    const x = (Math.random() - 0.5) * 22
    const y = Math.random() * 14 + 2
    const z = (Math.random() - 0.5) * 12 - 2
    dummy.position.set(x, y, z)
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    dummy.updateMatrix()
    confettiMesh.setMatrixAt(i, dummy.matrix)
    confettiMesh.setColorAt(i, confettiColorList[i % confettiColorList.length])
    confettiData.push({ x, y, z, rx: Math.random() * 0.1, ry: Math.random() * 0.1, speed: Math.random() * 0.05 + 0.02 })
  }
  confettiMesh.instanceMatrix.needsUpdate = true
  if (confettiMesh.instanceColor) confettiMesh.instanceColor.needsUpdate = true
  scene.add(confettiMesh)

  // ==========================================
  // CHARACTERS / AVATAR PIPELINE
  // ==========================================
  const textureLoader = new THREE.TextureLoader()
  const hatColours = ['#FF6B9D', '#FFB347', '#87CEEB', '#98FB98', '#DDA0DD']

  const createCharacter = (faceUrl, index) => {
    const group = new THREE.Group()
    
    const targetScale = ref(faceUrl ? 0 : 1)
    group.scale.setScalar(targetScale.value)

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

    // Hats
    const hatH = 0.57
    const hatR = 0.22
    const hatBaseY = 0.38
    
    const hatGeo = new THREE.ConeGeometry(hatR, hatH, 16)
    const hatMat = new THREE.MeshStandardMaterial({ color: hatColours[index % hatColours.length], roughness: 0.42 })
    const hat = new THREE.Mesh(hatGeo, hatMat)
    hat.position.y = hatBaseY + hatH / 2
    headGroup.add(hat)

    const bandGeo = new THREE.TorusGeometry(hatR + 0.01, 0.019, 8, 24)
    const bandMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.65 })
    const band = new THREE.Mesh(bandGeo, bandMat)
    band.rotation.x = -Math.PI / 2
    band.position.y = hatBaseY
    headGroup.add(band)

    const stripeR = hatR * (1.0 - 0.43)
    const stripeGeo = new THREE.TorusGeometry(stripeR, 0.014, 6, 20)
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#FFD700', roughness: 0.28, metalness: 0.6 })
    const stripe = new THREE.Mesh(stripeGeo, stripeMat)
    stripe.rotation.x = -Math.PI / 2
    stripe.position.y = hatBaseY + hatH * 0.43
    headGroup.add(stripe)

    const pomGeo = new THREE.SphereGeometry(0.068, 12, 12)
    const pomMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.92 })
    const pom = new THREE.Mesh(pomGeo, pomMat)
    pom.position.y = hatBaseY + hatH + 0.065
    headGroup.add(pom)

    if (faceUrl) {
      const pipeline = processAvatar(faceUrl)

      // Strictly wait for the processing to finish before applying the mask
      // This ensures we never see an unmasked/stretched image.
      const unwatch = watch(() => pipeline.isProcessed, (processed) => {
        if (processed && pipeline.processedFaceSrc) {
          textureLoader.load(pipeline.processedFaceSrc, (newTex) => {
            newTex.colorSpace = THREE.SRGBColorSpace
            
            // Calculate perfect aspect ratio to completely avoid facial stretching
            const imgAspect = newTex.image.width / newTex.image.height
            const h = 1.1
            const w = h * imgAspect

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

            // Shell adjustment
            shellMesh.scale.set(w * 0.8, h * 0.8, w * 0.6)
            if (pipeline.meta && pipeline.meta.cropBox && pipeline.meta.faceBox) {
               const faceCenterY = (pipeline.meta.faceBox.yMin + pipeline.meta.faceBox.yMax) / 2
               const cropCenterY = (pipeline.meta.cropBox.yMin + pipeline.meta.cropBox.yMax) / 2
               const yOffset = cropCenterY - faceCenterY
               shellMesh.position.y = yOffset * 0.8
            }

            headMat.map = newTex
            headMat.needsUpdate = true

            // Trigger the character's arrival animation now that processing is done
            targetScale.value = 1
          })
        }
      }, { immediate: true })
      activeUnwatchers.push(unwatch)
    }

    const targetPos = new THREE.Vector3()
    if (index === 0) {
      targetPos.set(0, 0, 2.5)
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
      targetScale,
      isBirthdayPerson: index === 0,
      timeOffset: Math.random() * 100
    }
  }

  const facesToUse = props.faces.length > 0 ? props.faces : Array(5).fill(null)
  facesToUse.slice(0, 5).forEach((face, i) => {
    characters.push(createCharacter(face, i))
  })

  // ==========================================
  // POINTER INTERACTIONS
  // ==========================================
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
    targetAngle = Math.max(-Math.PI / 1.5, Math.min(Math.PI / 1.5, targetAngle))
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

  // ==========================================
  // ANIMATION LOOP
  // ==========================================
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    if (!isDragging) {
      targetAngle += Math.sin(t * 0.5) * 0.0008
    }
    currentAngle += (targetAngle - currentAngle) * 0.08
    camera.position.x = Math.sin(currentAngle) * 16
    camera.position.z = Math.cos(currentAngle) * 16
    camera.lookAt(0, 1.5, 0)

    activeFlames.forEach((flame, i) => {
      const f = 1 + Math.sin(t * 16 + i * 0.82) * 0.10 + Math.sin(t * 31 + i * 1.5) * 0.05
      flame.scale.set(f * 0.88, f, f * 0.88)
    })

    activeCandleLights.forEach((light, i) => {
      light.intensity = 13 + Math.sin(t * 23 + i * 2.1) * 5
    })

    if (confettiMesh) {
      for (let i = 0; i < confettiCount; i++) {
        const d = confettiData[i]
        d.y -= d.speed
        d.x += Math.sin(t + i) * 0.01
        if (d.y < 0) d.y = 14
        dummy.position.set(d.x, d.y, d.z)
        dummy.rotation.x += d.rx
        dummy.rotation.y += d.ry
        dummy.updateMatrix()
        confettiMesh.setMatrixAt(i, dummy.matrix)
      }
      confettiMesh.instanceMatrix.needsUpdate = true
    }

    balloons.forEach(b => {
      b.group.position.y = b.baseY + Math.sin(t * b.speed + b.phase) * 0.38
      b.group.rotation.z = Math.sin(t * b.speed * 0.65 + b.phase) * 0.065
    })

    floatingStars.forEach(s => {
      s.mesh.rotation.y += 0.022
      s.mesh.rotation.x += 0.011
      s.mesh.position.y = s.baseY + Math.sin(t * 0.76 + s.phase) * 0.26
    })

    characters.forEach((char) => {
      // Lerp character position
      char.mesh.position.lerp(char.targetPos, 0.03)
      char.headGroup.lookAt(camera.position)

      // Smoothly animate scale (arrive animation)
      if (Math.abs(char.mesh.scale.x - char.targetScale.value) > 0.001) {
        char.mesh.scale.lerp(new THREE.Vector3(char.targetScale.value, char.targetScale.value, char.targetScale.value), 0.08)
      }

      // Add gentle bobbing once fully arrived
      if (char.targetScale.value === 1) {
        if (char.isBirthdayPerson) {
          char.mesh.position.y = Math.abs(Math.sin(t * 4)) * 0.6
        } else {
          char.mesh.position.y = Math.abs(Math.sin(t * 6 + char.timeOffset)) * 0.1
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