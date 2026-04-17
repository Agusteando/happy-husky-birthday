<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon-bg">👥</div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Miembros del Equipo</div>
      </div>
    </div>
    <div class="stat-card success-card">
      <div class="stat-icon-bg">✉️</div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.withEmail }}</div>
        <div class="stat-label">Con Correo Electrónico ({{ stats.withEmailPct }}%)</div>
      </div>
    </div>
    <div class="stat-card danger-card">
      <div class="stat-icon-bg">⚠️</div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.incomplete }}</div>
        <div class="stat-label">Datos Incompletos ({{ stats.incompletePct }}%)</div>
      </div>
    </div>
    <div class="stat-card accent-card premium-metric">
      <div class="stat-icon-bg">⏳</div>
      <div class="stat-content">
        <div class="stat-value avg-age">{{ stats.avgAge }} <span class="text-sm">años</span></div>
        <div class="stat-label">Edad Promedio General</div>
      </div>
    </div>
    <div class="stat-card festive-card">
      <div class="festive-glow"></div>
      <div class="stat-icon-bg">🎉</div>
      <div class="stat-content">
        <div class="stat-value highlight">{{ stats.todayBdays }}</div>
        <div class="stat-label">Cumpleaños Hoy</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ stats: Object })
</script>

<style scoped>
.stats-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
  gap: 20px; 
  margin-bottom: 32px; 
}

.stat-card {
  background: var(--surface-color); 
  padding: 24px; 
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-subtle); 
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.stat-icon-bg {
  position: absolute;
  right: -10px;
  bottom: -20px;
  font-size: 6rem;
  opacity: 0.04;
  user-select: none;
}

.stat-content {
  position: relative;
  z-index: 1;
}

.stat-value { 
  font-size: 2.2rem; 
  font-weight: 800; 
  color: var(--primary-navy); 
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label { 
  color: var(--text-secondary); 
  font-size: 0.85rem; 
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.success-card .stat-value { color: var(--success); }
.danger-card .stat-value { color: var(--danger); }

.premium-metric {
  background: linear-gradient(145deg, #FFFFFF 0%, #FAFAFA 100%);
  border: 1px solid rgba(212, 175, 55, 0.3);
}
.avg-age {
  color: var(--secondary-gold);
  text-shadow: 0 2px 4px rgba(212, 175, 55, 0.1);
}
.text-sm { 
  font-size: 1.2rem; 
  font-weight: 600;
  color: var(--text-secondary); 
}

.festive-card { 
  background: linear-gradient(135deg, #1C2541 0%, #0B132B 100%); 
  border: none;
  color: white;
}

.festive-card .stat-label {
  color: #CBD5E1;
}

.festive-card .highlight { 
  color: var(--accent-amber); 
  text-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}

.festive-glow {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at center, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
  animation: pulse-glow 3s infinite alternate ease-in-out;
}

@keyframes pulse-glow {
  0% { opacity: 0.5; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1.1); }
}
</style>