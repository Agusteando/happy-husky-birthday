<template>
  <div class="cards-grid">
    <div v-for="item in data" :key="item.id" class="employee-card glass-panel" :class="{'birthday-glow': isToday(item.birthday)}">
      
      <button class="remove-x-btn" @click.stop="emit('remove', item)" title="Retirar colaborador de las celebraciones">
        <X class="icon-sm" />
      </button>

      <div class="card-header">
        <PremiumAvatar :src="item.picture" :festive="isToday(item.birthday)" />
        
        <div class="actions-top">
          <Star 
            :class="['icon-btn star-icon', item.high_rank ? 'star-active' : 'star-inactive']" 
            @click="emit('update', item.id, { high_rank: !item.high_rank })"
            title="Destacar colaborador"
          />
        </div>
      </div>

      <div class="card-body">
        <h3 class="employee-name">{{ item.name }}</h3>
        <p class="employee-role">{{ item.plantel?.label || item.plantel?.name || item.plantel || 'Sin sede asignada' }}</p>

        <div class="editable-fields">
          <div class="field-group">
            <span class="field-icon">📅</span>
            <input 
              type="text" 
              class="ghost-input" 
              :value="formatToDDMM(item.birthday)" 
              @change="e => handleBdayChange(item.id, e.target.value)" 
              placeholder="DD/MM" 
              title="Modificar fecha (Día/Mes)" 
            />
          </div>
          <div class="field-group">
            <span class="field-icon">✉️</span>
            <input type="email" class="ghost-input" :value="item.email" @blur="e => e.target.value !== item.email && emit('update', item.id, { email: e.target.value })" placeholder="Agregar correo" />
          </div>
        </div>
      </div>

      <div class="card-footer">
        <button :class="['action-btn', item.event_id ? 'btn-active-cal' : 'btn-ghost']" @click="emit('calendar', item)" title="Sincronizar con Google Calendar">
          <Calendar class="icon-sm" /> Calendar
        </button>
        <button class="action-btn btn-ghost" @click="emit('openStudio', item)" title="Diseñar felicitación">
          <Palette class="icon-sm" /> Diseñar
        </button>
      </div>

    </div>

    <div v-if="data.length === 0" class="empty-state glass-panel">
      <div class="empty-icon">🎈</div>
      <h3>No hay colaboradores</h3>
      <p>No se encontraron colaboradores en esta sede con los filtros aplicados.</p>
    </div>
  </div>
</template>

<script setup>
import { Star, Calendar, Palette, X } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const props = defineProps({ data: Array })
const emit = defineEmits(['update', 'remove', 'calendar', 'openStudio'])

const isToday = (d) => d && d === dayjs().format('MM-DD')

const formatToDDMM = (mmdd) => {
  if (!mmdd) return '';
  const parts = mmdd.split('-');
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
  return mmdd;
}

const handleBdayChange = (id, val) => {
  if (!val) return emit('update', id, { birthday: null });
  const parts = val.split('/');
  if (parts.length === 2) {
    let d = parts[0].padStart(2, '0');
    let m = parts[1].padStart(2, '0');
    emit('update', id, { birthday: `${m}-${d}` });
  }
}
</script>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding-bottom: 40px;
}

.employee-card {
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(to bottom right, #FFFFFF, #FCFBFA);
  border: 1px solid rgba(226, 232, 240, 0.6);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.employee-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px -10px rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.3);
}

.birthday-glow {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%);
  border: 1px solid rgba(212, 175, 55, 0.4);
}

.remove-x-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.employee-card:hover .remove-x-btn {
  opacity: 1;
  top: 12px;
  right: 12px;
}

.remove-x-btn:hover {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
  transform: scale(1.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.actions-top {
  display: flex;
  gap: 8px;
  padding-top: 8px;
}

.icon-btn { cursor: pointer; transition: 0.2s; }
.star-icon { width: 26px; height: 26px; }
.star-active { color: var(--secondary-gold); fill: var(--secondary-gold); filter: drop-shadow(0 2px 8px rgba(212,175,55,0.5)); }
.star-inactive { color: #E2E8F0; }
.star-inactive:hover { color: #CBD5E1; }

.card-body {
  flex-grow: 1;
}

.employee-name {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-navy);
  letter-spacing: -0.01em;
}

.employee-role {
  margin: 0 0 16px 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: #F1F5F9;
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.editable-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.field-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8FAFC;
  border-radius: 8px;
  padding: 4px 8px;
  border: 1px solid transparent;
  transition: 0.2s;
}

.field-group:focus-within, .field-group:hover {
  border-color: #E2E8F0;
  background: white;
}

.field-icon { font-size: 0.9rem; opacity: 0.7; }

.ghost-input {
  border: none;
  background: transparent;
  padding: 4px;
  width: 100%;
  color: var(--text-primary);
  font-size: 0.9rem;
  box-shadow: none !important;
}
.ghost-input:focus { outline: none; }

.card-footer {
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  padding: 8px 0;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  background: transparent;
}

.icon-sm { width: 16px; height: 16px; }

.btn-ghost { color: var(--text-secondary); border: 1px solid var(--border-color); }
.btn-ghost:hover { background: #F1F5F9; color: var(--primary-navy); }

.btn-active-cal { background: #EEF2FF; color: #4F46E5; border: 1px solid #C7D2FE; }
.btn-active-cal:hover { background: #E0E7FF; }

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.empty-icon { font-size: 3rem; animation: float-crown 3s infinite alternate; }
.empty-state h3 { margin: 0; color: var(--primary-navy); }
.empty-state p { color: var(--text-secondary); margin: 0; }
</style>