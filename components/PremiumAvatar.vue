<template>
  <div class="avatar-hero-wrapper" :class="{'festive-mode': festive, 'is-processed': state?.isProcessed}">
    
    <!-- Anillo decorativo curvo trasero para dar un toque asimétrico premium -->
    <div v-if="state?.isProcessed" class="outer-swoosh-ring fade-in"></div>

    <div class="avatar-container">
      <!-- Fondos de degradado corporativo cálido -->
      <div v-if="state?.isProcessed" class="bg-gradient fade-in"></div>
      
      <!-- Puntos de celebración flotantes (Efecto Parallax) -->
      <div v-if="state?.isProcessed" class="dots-layer dots-fast fade-in"></div>
      <div v-if="state?.isProcessed" class="dots-layer dots-slow fade-in"></div>
      
      <!-- Fallback render instantáneo original -->
      <img 
        v-if="state?.originalSrc" 
        :src="state.originalSrc" 
        class="avatar-img original" 
        :class="{'fade-out': state?.isProcessed}"
        alt="Fotografía original del colaborador" 
      />
      
      <!-- Retrato extraído con Alpha, escalado para ser el protagonista -->
      <img 
        v-if="state?.isProcessed" 
        :src="state.processedSrc" 
        class="avatar-img processed fade-in" 
        alt="Fotografía procesada transparente" 
      />
      
      <!-- Sombra interior superpuesta para fusionar imperceptiblemente el corte inferior (cuello/hombros) con el fondo -->
      <div v-if="state?.isProcessed" class="image-blend-overlay fade-in"></div>

      <!-- Skeleton loader para tiempos de red -->
      <div v-if="!state?.displaySrc" class="avatar-skeleton pulse-anim"></div>
    </div>
    
    <!-- Decoración de cumpleaños -->
    <div v-if="festive" class="birthday-crown">👑</div>
    
    <!-- Detalle de contorno / Broche único de identidad HHB -->
    <div v-if="state?.isProcessed || state?.originalSrc" class="hhb-tab fade-in">
      <span>HHB</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePremiumAvatar } from '~/composables/usePremiumAvatar'

const props = defineProps({
  src: { type: String, default: '' },
  festive: { type: Boolean, default: false }
})

const { processAvatar } = usePremiumAvatar()
const state = ref(null)

const loadAvatar = () => {
  if (props.src) {
    state.value = processAvatar(props.src)
  } else {
    state.value = null
  }
}

onMounted(loadAvatar)
watch(() => props.src, loadAvatar)
</script>

<style scoped>
.avatar-hero-wrapper {
  position: relative;
  width: 110px;
  height: 110px;
  margin-bottom: 8px; /* Espacio para que el broche inferior respire */
  z-index: 1;
}

/* Anillo exterior asimétrico que da la curva distintiva */
.outer-swoosh-ring {
  position: absolute;
  top: -6px; left: -6px; right: -6px; bottom: -6px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-bottom-color: #BAE6FD;
  border-right-color: #BAE6FD;
  transform: rotate(-15deg);
  z-index: 0;
  opacity: 0.6;
}
.festive-mode .outer-swoosh-ring {
  border-bottom-color: var(--secondary-gold);
  border-right-color: var(--secondary-gold);
}

/* Contenedor circular principal */
.avatar-container {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #FFFFFF;
  position: relative;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  border: 4px solid #FFFFFF;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 2;
}

.festive-mode .avatar-container {
  box-shadow: 0 12px 35px rgba(212, 175, 55, 0.35);
}

/* Fondo suave y cálido */
.bg-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%);
  z-index: 0;
}
.festive-mode .bg-gradient {
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF08A 50%, #FDE047 100%);
}

/* Capas de Polka Dots animados */
.dots-layer {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
}
.dots-fast {
  background-image: radial-gradient(rgba(255, 255, 255, 0.9) 2px, transparent 2px);
  background-size: 20px 20px;
  animation: drift-up 12s linear infinite;
}
.dots-slow {
  background-image: radial-gradient(rgba(255, 255, 255, 0.5) 1.5px, transparent 1.5px);
  background-size: 12px 12px;
  animation: drift-diag 20s linear infinite;
}

@keyframes drift-up {
  0% { background-position: 0 0; }
  100% { background-position: 0 -40px; }
}
@keyframes drift-diag {
  0% { background-position: 0 0; }
  100% { background-position: -24px -24px; }
}

/* Imágenes */
.avatar-img {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  border-radius: 50%;
}

.original {
  object-fit: cover;
  transition: opacity 0.5s ease;
  z-index: 2;
}
.original.fade-out { opacity: 0; pointer-events: none; }

.processed {
  object-fit: contain;
  /* Ampliamos el rostro y lo centramos elegantemente, evitando que se vea diminuto */
  transform: scale(1.25) translateY(4px);
  /* Filtros de embellecimiento: profundidad (sombra), vitalidad (saturación) y nitidez (contraste) */
  filter: drop-shadow(0 10px 15px rgba(30, 58, 138, 0.15)) saturate(1.1) contrast(1.02);
  transition: opacity 0.6s ease;
  z-index: 3;
}
.festive-mode .processed {
  filter: drop-shadow(0 10px 15px rgba(133, 77, 14, 0.2)) saturate(1.15) contrast(1.05);
}

/* Capa de mezcla inferior para fundir hombros/cuello con el fondo gradualmente */
.image-blend-overlay {
  position: absolute; inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 -25px 35px -15px rgba(191, 219, 254, 0.9);
  pointer-events: none;
  z-index: 4;
}
.festive-mode .image-blend-overlay {
  box-shadow: inset 0 -25px 35px -15px rgba(253, 224, 71, 0.9);
}

/* Skeleton */
.avatar-skeleton {
  position: absolute; inset: 0; border-radius: 50%; background: #E2E8F0; z-index: 1;
}

/* Broche/Muesca de identidad HHB */
.hhb-tab {
  position: absolute;
  bottom: 2px;
  right: -8px;
  background: #FFFFFF;
  color: #3B82F6;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: 14px;
  box-shadow: 0 6px 12px rgba(0,0,0,0.12);
  border: 2px solid #EFF6FF;
  transform: rotate(-8deg);
  letter-spacing: 0.05em;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.festive-mode .hhb-tab {
  background: var(--secondary-gold);
  color: #FFFFFF;
  border-color: #FFFBEB;
  box-shadow: 0 6px 15px rgba(212, 175, 55, 0.4);
}

.birthday-crown {
  position: absolute;
  top: -18px;
  right: -10px;
  font-size: 2.2rem;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
  animation: float-crown 2s infinite alternate ease-in-out;
  z-index: 6;
}

@keyframes float-crown {
  0% { transform: translateY(0) rotate(15deg); }
  100% { transform: translateY(-8px) rotate(-5deg); }
}

.fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.pulse-anim { animation: pulse 1.5s infinite ease-in-out; }
@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.9; } 100% { opacity: 0.6; } }
</style>