<template>
  <div v-if="stats" class="elegant-stats-container">
    <div class="stat-pill">
      <span class="stat-icon">✨</span>
      <div class="stat-text">
        <strong>{{ stats.total }}</strong> Colaboradores en la sede
      </div>
    </div>
    
    <div class="stat-pill">
      <span class="stat-icon">🎂</span>
      <div class="stat-text">
        <strong>{{ stats.todayBdays }}</strong> Cumpleaños hoy
      </div>
    </div>

    <div class="stat-pill">
      <span class="stat-icon">🌟</span>
      <div class="stat-text">
        Edad promedio: <strong>{{ stats.avgAge }} años</strong>
      </div>
    </div>

    <div class="stat-pill subtle-pill">
      <span class="stat-icon">✉️</span>
      <div class="stat-text">
        Contactos actualizados: <strong>{{ stats.withEmailPct }}%</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ stats: Object })
</script>

<style scoped>
.elegant-stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
  position: relative;
  z-index: 10;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 12px 24px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease;
}

.stat-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.subtle-pill {
  opacity: 0.85;
  background: rgba(248, 250, 252, 0.9);
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.stat-text strong {
  color: var(--primary-navy);
  font-weight: 700;
  font-size: 1.05rem;
}
</style>