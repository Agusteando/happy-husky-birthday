<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Fotografía</th>
          <th>Plantel</th>
          <th>Nombre Completo</th>
          <th>Nacimiento</th>
          <th>Email</th>
          <th>Calendar</th>
          <th>Drive</th>
          <th>Baja</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.id" :class="{'today-bday': isToday(item.birthday)}">
          <td>
            <img :src="item.picture || '/main.png'" class="avatar" />
          </td>
          <td>{{ item.plantel?.name || item.plantel }}</td>
          <td>
            <div class="name-cell">
              {{ item.name }} {{ item.apellidoPaterno }} {{ item.apellidoMaterno }}
              <Star 
                :class="['icon-btn', item.high_rank ? 'star-active' : 'star-inactive']" 
                @click="emit('update', item.id, { high_rank: !item.high_rank })"
              />
            </div>
          </td>
          <td>
            <div class="edit-cell">
              <span>{{ formatDate(item.birthday) }}</span>
              <input type="date" class="inline-input" :value="item.birthday" @change="e => emit('update', item.id, { birthday: e.target.value })" />
            </div>
          </td>
          <td>
            <input type="email" class="inline-input full" :value="item.email" @blur="e => e.target.value !== item.email && emit('update', item.id, { email: e.target.value })" placeholder="Sin correo" />
          </td>
          <td>
            <button :class="['action-btn', item.event_id ? 'btn-danger' : 'btn-success']" @click="emit('calendar', item)">
              <Calendar class="icon-sm" />
            </button>
          </td>
          <td>
            <label class="action-btn btn-secondary upload-label">
              <UploadCloud class="icon-sm" />
              <input type="file" hidden @change="e => handleUpload(item, e)" />
            </label>
          </td>
          <td>
            <button class="action-btn btn-danger" @click="emit('delete', item.id)">
              <Trash class="icon-sm" />
            </button>
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

const formatDate = (d) => d ? dayjs(d).format('DD MMM YYYY') : 'N/D'
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
    alert('Archivo subido a Google Drive exitosamente.')
  } catch (e) {
    alert('Error al subir el archivo.')
  }
}
</script>

<style scoped>
.table-container { overflow-x: auto; background: var(--surface-color); border-radius: var(--radius); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th, .data-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
.data-table th { background: var(--bg-color); font-weight: 600; color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; }
.data-table tr:hover { background: #f1f5f9; }
.today-bday { background: #fef3c7 !important; } /* Highlight row for today's birthday */
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color); }
.name-cell { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-weight: 500; }
.icon-btn { cursor: pointer; width: 20px; height: 20px; transition: 0.2s; }
.star-active { color: var(--secondary-color); fill: var(--secondary-color); }
.star-inactive { color: #cbd5e1; }
.edit-cell { display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; }
.inline-input { border: 1px solid transparent; background: transparent; padding: 4px; border-radius: 4px; width: 130px; font-family: inherit; }
.inline-input:focus, .inline-input:hover { border-color: var(--border-color); background: white; }
.inline-input.full { width: 100%; }
.action-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; color: white; padding: 0; }
.btn-success { background: var(--success); }
.btn-danger { background: var(--danger); }
.btn-secondary { background: var(--text-secondary); }
.icon-sm { width: 16px; height: 16px; }
.upload-label { cursor: pointer; margin: 0; }
</style>