<template>
  <div class="cards-grid">
    <div v-for="item in data" :key="item.id" class="employee-card glass-panel" :class="{'birthday-glow': isToday(item.birthday)}">
      
      <div class="card-header">
        <!-- Replaced basic img with intelligent PremiumAvatar -->
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
        <h3 class="employee-name">{{ item.name }} {{ item.apellidoPaterno || '' }}</h3>
        <p class="employee-role">{{ item.plantel?.name || item.plantel || 'Sin sede' }}</p>

        <div class="editable-fields">
          <div class="field-group">
            <span class="field-icon">📅</span>
            <input type="date" class="ghost-input" :value="item.birthday" @change="e => emit('update', item.id, { birthday: e.target.value })" title="Modificar fecha de nacimiento" />
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
        <button class="action-btn btn-ghost" @click="emit('openStudio', item)" title="Crear diseño de felicitación">
          <Palette class="icon-sm" /> Estudio
        </button>
        <button class="action-btn btn-danger-subtle" @click="emit('delete', item.id)" title="Ocultar del directorio">
          <UserMinus class="icon-sm" />
        </button>
      </div>

    </div>

    <div v-if="data.length === 0" class="empty-state glass-panel">
      <div class="empty-icon">🎈</div>
      <h3>El directorio está vacío</h3>
      <p>No encontramos colaboradores con los filtros aplicados en esta sede.</p>
    </div>
  </div>
</template>

<script setup>
import { Star, Calendar, Palette, UserMinus } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const props = defineProps({ data: Array })
const emit = defineEmits(['update', 'delete', 'calendar', 'openStudio'])

const isToday = (d) => d && dayjs(d).format('MM-DD') === dayjs().format('MM-DD')
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.employee-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.birthday-glow {
  background: linear-gradient(to bottom right, #FFFFFF, #FFFBEB);
  border: 1px solid rgba(246, 224, 94, 0.6);
  box-shadow: var(--shadow-glow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.actions-top {
  display: flex;
  gap: 8px;
}

.icon-btn { cursor: pointer; transition: 0.2s; }
.star-icon { width: 24px; height: 24px; }
.star-active { color: var(--secondary-gold); fill: var(--secondary-gold); filter: drop-shadow(0 2px 8px rgba(212,175,55,0.5)); }
.star-inactive { color: #E2E8F0; }
.star-inactive:hover { color: #CBD5E1; }

.card-body {
  flex-grow: 1;
}

.employee-name {
  margin: 0 0 4px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-navy);
}

.employee-role {
  margin: 0 0 16px 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: #F1F5F9;
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
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

.btn-danger-subtle { flex: 0 0 40px; color: #F56565; border: 1px solid transparent; }
.btn-danger-subtle:hover { background: #FFF5F5; border-color: #FED7D7; }

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