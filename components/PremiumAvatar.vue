<template>
  <div class="avatar-container" :class="{'avatar-festive': festive, 'is-processed': state?.isProcessed}">
    
    <div v-if="state?.isProcessed" class="avatar-bg fade-in"></div>
    
    <img 
      v-if="state?.originalSrc" 
      :src="state.originalSrc" 
      class="avatar-img original" 
      :class="{'fade-out': state?.isProcessed}"
      alt="Fotografía original del colaborador" 
    />
    
    <img 
      v-if="state?.isProcessed" 
      :src="state.processedSrc" 
      class="avatar-img processed fade-in" 
      alt="Fotografía procesada transparente" 
    />
    
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
  border-radius: 28px;
  padding: 4px;
  background: linear-gradient(135deg, #FFFFFF, #FFF0F5);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.05), 
    inset 0 2px 4px rgba(255, 255, 255, 1);
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.avatar-container.avatar-festive {
  background: linear-gradient(135deg, #FFD700, #FF8C00, #FF1493);
  box-shadow: 
    0 8px 25px rgba(212, 175, 55, 0.3), 
    inset 0 2px 6px rgba(255, 255, 255, 0.9);
}

.avatar-bg {
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 228, 225, 0.8) 0%, rgba(224, 255, 255, 0.6) 100%);
  background-image: radial-gradient(rgba(255, 255, 255, 0.6) 2px, transparent 2px);
  background-size: 12px 12px;
  z-index: 0;
  box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.03);
}

.avatar-container.avatar-festive .avatar-bg {
  background: linear-gradient(135deg, #FFFBEB 0%, #FFF5D1 100%);
  background-image: radial-gradient(rgba(212, 175, 55, 0.2) 2px, transparent 2px);
}

.avatar-img {
  position: absolute;
  top: 4px; left: 4px;
  width: calc(100% - 8px); 
  height: calc(100% - 8px);
  border-radius: 24px;
  z-index: 1;
}

.original {
  object-fit: cover;
  transition: opacity 0.4s ease;
}

.original.fade-out {
  opacity: 0;
  pointer-events: none;
}

.processed {
  object-fit: contain;
  transform: scale(1.18) translateY(-2px);
  transition: opacity 0.5s ease;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.avatar-skeleton {
  position: absolute;
  top: 4px; left: 4px;
  width: calc(100% - 8px); 
  height: calc(100% - 8px);
  border-radius: 24px;
  background: #E2E8F0;
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
  top: -14px;
  right: -10px;
  font-size: 1.6rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  animation: float-crown 2s infinite alternate ease-in-out;
  z-index: 2;
}

@keyframes float-crown {
  0% { transform: translateY(0) rotate(12deg); }
  100% { transform: translateY(-6px) rotate(-8deg); }
}
</style>