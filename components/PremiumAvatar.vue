<template>
  <div class="avatar-container" :class="{'avatar-festive': festive, 'is-processed': state?.isProcessed}">
    
    <!-- Branded soft gradient background visible underneath the transparent processed image -->
    <div v-if="state?.isProcessed" class="avatar-bg fade-in"></div>
    
    <!-- Primary fast-paint render (Fades out when processing finishes) -->
    <img 
      v-if="state?.originalSrc" 
      :src="state.originalSrc" 
      class="avatar-img original" 
      :class="{'fade-out': state?.isProcessed}"
      alt="Fotografía original del colaborador" 
    />
    
    <!-- Seamless morph to processed transparent render -->
    <img 
      v-if="state?.isProcessed" 
      :src="state.processedSrc" 
      class="avatar-img processed fade-in" 
      alt="Fotografía procesada transparente" 
    />
    
    <!-- Loading skeleton for entirely empty sources -->
    <div v-if="!state?.displaySrc" class="avatar-skeleton pulse-anim"></div>
    
    <div v-if="festive" class="birthday-crown">👑</div>
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
.avatar-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  padding: 0;
  background: var(--border-color);
  position: relative;
  transition: all 0.3s ease;
}

.avatar-festive {
  background: linear-gradient(135deg, var(--secondary-gold), var(--accent-amber));
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.avatar-bg {
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border-radius: 50%;
  background: radial-gradient(circle at center, #FFFFFF 0%, #F1F5F9 60%, #E2E8F0 100%);
  z-index: 0;
}

.avatar-img {
  position: absolute;
  top: 4px; left: 4px;
  width: calc(100% - 8px); 
  height: calc(100% - 8px);
  border-radius: 50%;
  z-index: 1;
}

.original {
  object-fit: cover;
  border: 3px solid white;
  box-sizing: border-box;
  transition: opacity 0.4s ease;
}

.original.fade-out {
  opacity: 0;
  pointer-events: none;
}

.processed {
  object-fit: contain;
  transform: scale(1.15); /* Slightly enlarge the centered transparent face to fill layout beautifully */
  transition: opacity 0.5s ease;
}

.avatar-skeleton {
  position: absolute;
  top: 4px; left: 4px;
  width: calc(100% - 8px); 
  height: calc(100% - 8px);
  border-radius: 50%;
  background: #E2E8F0;
  border: 3px solid white;
  box-sizing: border-box;
  z-index: 1;
}

.fade-in { animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.pulse-anim { animation: pulse 1.5s infinite ease-in-out; }
@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.9; }
  100% { opacity: 0.6; }
}

.birthday-crown {
  position: absolute;
  top: -12px;
  right: -8px;
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  animation: float-crown 2s infinite alternate ease-in-out;
  z-index: 2;
}

@keyframes float-crown {
  0% { transform: translateY(0) rotate(10deg); }
  100% { transform: translateY(-4px) rotate(-10deg); }
}
</style>