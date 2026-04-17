<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th class="w-avatar">Perfil</th>
          <th>Colaborador</th>
          <th>Sede</th>
          <th>Nacimiento</th>
          <th>Correo Electrónico</th>
          <th class="text-center">Gestión</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.id" :class="{'today-bday-row': isToday(item.birthday)}">
          <td class="w-avatar">
            <div class="avatar-wrapper" :class="{'glow': isToday(item.birthday)}">
              <img :src="item.picture || '/main.png'" class="avatar" alt="Avatar" />
            </div>
          </td>
          <td>
            <div class="name-cell">
              <span class="full-name">{{ item.name }} {{ item.apellidoPaterno || '' }} {{ item.apellidoMaterno || '' }}</span>
              <Star 
                :class="['icon-btn star-icon', item.high_rank ? 'star-active' : 'star-inactive']" 
                @click="emit('update', item.id, { high_rank: !item.high_rank })"
                title="Marcar como destacado"
              />
            </div>
            <span v-if="isToday(item.birthday)" class="badge-bday">¡Hoy es su cumpleaños!</span>
          </td>
          <td>
            <span class="badge-plantel">{{ item.plantel?.name || item.plantel || 'Sin sede' }}</span>
          </td>
          <td>
            <div class="edit-cell">
              <span class="date-text">{{ formatDate(item.birthday) }}</span>
              <input type="date" class="inline-input" :value="item.birthday" @change="e => emit('update', item.id, { birthday: e.target.value })" />
            </div>
          </td>
          <td>
            <input type="email" class="inline-input full" :value="item.email" @blur="e => e.target.value !== item.email && emit('update', item.id, { email: e.target.value })" placeholder="Agregar correo institucional" />
          </td>
          <td>
            <div class="actions-group">
              <button :class="['action-btn', item.event_id ? 'btn-active-cal' : 'btn-ghost']" @click="emit('calendar', item)" title="Sincronizar Calendario">
                <Calendar class="icon-sm" />
              </button>
              <label class="action-btn btn-ghost upload-label" title="Subir felicitación a Drive">
                <UploadCloud class="icon-sm" />
                <input type="file" hidden @change="e => handleUpload(item, e)" />
              </label>
              <button class="action-btn btn-danger-ghost" @click="emit('delete', item.id)" title="Desvincular">
                <Trash class="icon-sm" />
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="data.length === 0">
          <td colspan="6" class="empty-state">
            <div class="empty-content">
              <span class="empty-icon">🔍</span>
              <p>No se encontraron colaboradores con estos filtros.</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { Star, Calendar, Trash, UploadCloud } from 'lucide-vue-next'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const props = defineProps({ data: Array })
const emit = defineEmits(['update', 'delete', 'calendar'])

const formatDate = (d) => d ? dayjs(d).format('DD MMM YYYY') : 'Fecha no registrada'
const isToday = (d) => d && dayjs(d).format('MM-DD') === dayjs().format('MM-DD')

const handleUpload = async (item, event) => {
  const file = event.target.files[0]
  if (!file) return
  try {
    const { uploadUrl } = await $fetch('/api/drive/upload-url', {
      method: 'POST',
      body: { fileName: `${item.name}-Felicitacion.pdf`, mimeType: file.type, fileSize: file.size }
    })
    await fetch(uploadUrl, { method: 'PUT', body: file })
    alert('Archivo subido al repositorio institucional de Google Drive de manera exitosa.')
  } catch (e) {
    alert('Ocurrió un error al intentar subir el archivo. Verifica los permisos de la cuenta.')
  }
}
</script>

<style scoped>
.table-container { 
  overflow-x: auto; 
  background: var(--surface-color); 
  border-radius: var(--radius-lg); 
  box-shadow: var(--shadow-subtle); 
  border: 1px solid var(--border-color);
}

.data-table { 
  width: 100%; 
  border-collapse: separate; 
  border-spacing: 0;
  text-align: left; 
}

.data-table th { 
  background: #F1F5F9; 
  font-weight: 600; 
  color: var(--text-secondary); 
  text-transform: uppercase; 
  font-size: 0.75rem; 
  letter-spacing: 0.05em;
  padding: 16px; 
  border-bottom: 2px solid var(--border-color); 
}

.data-table td { 
  padding: 16px; 
  border-bottom: 1px solid var(--border-color); 
  vertical-align: middle; 
  transition: background 0.2s ease;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td { 
  background: #F8FAFC; 
}

.w-avatar { width: 70px; text-align: center; }
.text-center { text-align: center; }

.avatar-wrapper {
  width: 48px; height: 48px;
  border-radius: 50%;
  padding: 2px;
  background: var(--border-color);
  display: inline-block;
}

.avatar-wrapper.glow {
  background: linear-gradient(135deg, var(--secondary-gold), var(--accent-amber));
  box-shadow: var(--shadow-glow);
}

.avatar { 
  width: 100%; height: 100%; 
  border-radius: 50%; 
  object-fit: cover; 
  border: 2px solid white;
}

.name-cell { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.full-name {
  font-weight: 600;
  color: var(--primary-navy);
  font-size: 0.95rem;
}

.badge-bday {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.7rem;
  background: #FEF3C7;
  color: #D97706;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.today-bday-row td { 
  background: rgba(254, 243, 199, 0.3) !important; 
}

.badge-plantel {
  background: #E2E8F0;
  color: #475569;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.icon-btn { 
  cursor: pointer; 
  transition: 0.2s; 
}

.star-icon { width: 18px; height: 18px; }
.star-active { color: var(--secondary-gold); fill: var(--secondary-gold); filter: drop-shadow(0 2px 4px rgba(212,175,55,0.4)); }
.star-inactive { color: #CBD5E1; }
.star-inactive:hover { color: #94A3B8; }

.edit-cell { display: flex; flex-direction: column; gap: 4px; }
.date-text { font-size: 0.9rem; color: var(--text-primary); }

.inline-input { 
  border: 1px solid transparent; 
  background: transparent; 
  padding: 6px; 
  border-radius: 6px; 
  width: 140px; 
  color: var(--text-secondary);
  font-size: 0.85rem;
}
.inline-input:focus, .inline-input:hover { 
  border-color: var(--border-color); 
  background: white; 
  color: var(--text-primary);
}
.inline-input.full { width: 100%; min-width: 180px; }

.actions-group {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn { 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  width: 36px; height: 36px; 
  border-radius: 8px; 
  padding: 0; 
  background: transparent;
}
.icon-sm { width: 18px; height: 18px; }

.btn-ghost { color: var(--text-secondary); border: 1px solid var(--border-color); }
.btn-ghost:hover { background: #F1F5F9; color: var(--primary-navy); }

.btn-active-cal { background: #EEF2FF; color: #4F46E5; border: 1px solid #C7D2FE; }
.btn-active-cal:hover { background: #E0E7FF; }

.btn-danger-ghost { color: #EF4444; border: 1px solid #FECACA; }
.btn-danger-ghost:hover { background: #FEF2F2; }

.upload-label { cursor: pointer; margin: 0; }

.empty-state {
  text-align: center;
  padding: 64px 0 !important;
}
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
}
.empty-icon { font-size: 2.5rem; opacity: 0.5; }
</style>