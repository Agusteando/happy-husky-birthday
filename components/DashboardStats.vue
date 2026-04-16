<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{{ stats.total }}</div>
      <div class="stat-label">Colaboradores Totales</div>
    </div>
    <div class="stat-card success-card">
      <div class="stat-value">{{ stats.withEmail }}</div>
      <div class="stat-label">Con Correo Electrónico ({{ stats.withEmailPct }}%)</div>
    </div>
    <div class="stat-card danger-card">
      <div class="stat-value">{{ stats.incomplete }}</div>
      <div class="stat-label">Sin Correo Electrónico ({{ stats.incompletePct }}%)</div>
    </div>
    <div class="stat-card accent-card">
      <div class="stat-value">{{ stats.avgAge }} <span class="text-sm">años</span></div>
      <div class="stat-label">Edad Promedio General</div>
    </div>
    <div class="stat-card festive-card">
      <div class="stat-value">{{ stats.todayBdays }}</div>
      <div class="stat-label">Cumpleaños Hoy</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ stats: Object })
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
.stat-card {
  background: var(--surface-color); padding: 24px; border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 4px solid var(--primary-color);
  text-align: center; display: flex; flex-direction: column; justify-content: center;
}
.stat-value { font-size: 2.5rem; font-weight: 700; color: var(--text-primary); }
.stat-label { color: var(--text-secondary); font-size: 0.9rem; margin-top: 8px; }
.success-card { border-top-color: var(--success); }
.success-card .stat-value { color: var(--success); }
.danger-card { border-top-color: var(--danger); }
.danger-card .stat-value { color: var(--danger); }
.accent-card { border-top-color: var(--secondary-color); }
.festive-card { background: linear-gradient(135deg, #fff 0%, #fff9e6 100%); border-top-color: #f59e0b; }
.festive-card .stat-value { color: #d97706; }
.text-sm { font-size: 1rem; color: var(--text-secondary); }
</style>