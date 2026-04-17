<template>
  <div class="avatar-container" :class="{'avatar-festive': festive}">
    <img v-if="src" :src="src" class="avatar-img fade-in" alt="Fotografía del colaborador" />
    <div v-else class="avatar-skeleton pulse-anim"></div>
    <div v-if="festive" class="birthday-crown">👑</div>
  </div>
</template>

<script setup>
const props = defineProps({
  src: { type: String, default: '' },
  festive: { type: Boolean, default: false }
})
</script>

<style scoped>
.avatar-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  padding: 4px;
  background: var(--border-color);
  position: relative;
  transition: all 0.3s ease;
}

.avatar-festive {
  background: linear-gradient(135deg, var(--secondary-gold), var(--accent-amber));
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
}

.avatar-skeleton {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #E2E8F0;
  border: 3px solid white;
}

.fade-in { animation: fadeIn 0.4s ease-out forwards; }
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
}

@keyframes float-crown {
  0% { transform: translateY(0) rotate(10deg); }
  100% { transform: translateY(-4px) rotate(-10deg); }
}
</style>