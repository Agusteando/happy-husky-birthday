<template>
  <div class="dashboard">
    <header class="header">
      <div class="logo-area">
        <img src="/main.png" alt="IECS Logo" class="logo-main" />
        <img src="/hhb.png" alt="Happy Husky Birthday" class="logo-hhb" />
      </div>
      <div class="header-right">
        <ThreeCake />
        <button class="logout-btn" @click="logout">Cerrar Sesión</button>
      </div>
    </header>

    <main class="main-content">
      <DashboardStats :stats="stats" />

      <div class="controls-bar">
        <div class="filters">
          <select v-model="filterPlantel">
            <option value="">Todos los Planteles</option>
            <option value="Primaria Metepec">Primaria Metepec</option>
            <option value="Primaria Toluca">Primaria Toluca</option>
            <option value="Secundaria Metepec">Secundaria Metepec</option>
            <option value="Secundaria Toluca">Secundaria Toluca</option>
            <option value="Casita Metepec">Casita Metepec</option>
            <option value="Casita Toluca">Casita Toluca</option>
            <option value="Desarrollo Metepec">Desarrollo Metepec</option>
            <option value="Preescolar Toluca">Preescolar Toluca</option>
            <option value="Preescolar Metepec">Preescolar Metepec</option>
          </select>
          <input type="text" v-model="filterSearch" placeholder="Buscar empleado..." />
        </div>
        <div class="actions">
          <button class="btn btn-primary" @click="showAddModal = true">
            <Plus class="icon" /> Agregar Externo
          </button>
          <button class="btn btn-secondary" @click="exportExcel">
            Descargar CSV
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">Cargando base de datos Signia...</div>
      <EmployeeTable 
        v-else 
        :data="filteredEmployees" 
        @update="updateEmployee" 
        @delete="deleteEmployee"
        @calendar="toggleCalendarEvent"
      />
    </main>

    <!-- Modal Extra User -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>Agregar Usuario Externo</h3>
        <input v-model="newUser.name" placeholder="Nombre completo" />
        <input v-model="newUser.email" placeholder="Correo electrónico" />
        <input v-model="newUser.birthday" type="date" placeholder="Fecha de Nacimiento" />
        <select v-model="newUser.plantel">
          <option value="Externo">Externo</option>
          <option value="Casita Metepec">Casita Metepec</option>
        </select>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAddModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="submitExternal">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import DashboardStats from '~/components/DashboardStats.vue'
import EmployeeTable from '~/components/EmployeeTable.vue'
import ThreeCake from '~/components/ThreeCake.vue'
import { useEmployees } from '~/composables/useEmployees'

const { 
  loading, stats, filteredEmployees, filterPlantel, filterSearch,
  fetchEmployees, updateEmployee, deleteEmployee, toggleCalendarEvent, addExternalUser, exportExcel 
} = useEmployees()

const showAddModal = ref(false)
const newUser = ref({ name: '', email: '', birthday: '', plantel: 'Externo' })

onMounted(() => {
  fetchEmployees()
})

const submitExternal = async () => {
  await addExternalUser(newUser.value)
  showAddModal.value = false
  newUser.value = { name: '', email: '', birthday: '', plantel: 'Externo' }
}

const logout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo-main { height: 40px; }
.logo-hhb { height: 40px; filter: drop-shadow(0 0 8px var(--secondary-color)); }
.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}
.logout-btn {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 8px 16px;
}
.logout-btn:hover { background: rgba(255,255,255,0.1); }
.main-content { padding: 32px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.filters, .actions { display: flex; gap: 12px; align-items: center; }
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: white;
}
.btn-primary { background: var(--primary-color); }
.btn-primary:hover { background: #1e293b; }
.btn-secondary { background: var(--secondary-color); color: var(--primary-color); font-weight: bold; }
.icon { width: 18px; height: 18px; }
.loading-state { text-align: center; padding: 48px; color: var(--text-secondary); font-size: 1.2rem; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal-content {
  background: white; padding: 32px; border-radius: var(--radius); width: 400px; display: flex; flex-direction: column; gap: 16px;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
</style>