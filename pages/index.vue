<template>
  <div class="dashboard">
    <!-- Hero 3D Scene acts as background for the header -->
    <CelebrationScene :faces="randomFaces" v-if="!loading" />

    <header class="header-glass">
      <div class="header-inner">
        <div class="logo-area">
          <img src="/main.png" alt="IECS Logo" class="logo-main" />
          <div class="divider"></div>
          <img src="/hhb.png" alt="Happy Husky Birthday" class="logo-hhb" />
        </div>
        <div class="header-right">
          <span class="welcome-text">Panel de Talento</span>
          <button class="logout-btn" @click="logout" title="Cerrar Sesión">
            Salir
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Stats float over the hero background visually -->
      <DashboardStats :stats="stats" class="elevated-stats" />

      <div class="controls-bar">
        <div class="filters">
          <select v-model="filterPlantel" class="premium-select">
            <option value="">Directorio General (Todas las Sedes)</option>
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
          <input type="text" v-model="filterSearch" placeholder="Buscar por nombre o correo..." class="search-input" />
        </div>
        <div class="actions">
          <button class="btn btn-secondary" @click="exportExcel">
            Descargar Reporte (CSV)
          </button>
          <button class="btn btn-primary" @click="showAddModal = true">
            <Plus class="icon" /> Registrar Invitado
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Sincronizando directorio institucional...</p>
      </div>
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
        <h3>Registrar Colaborador Externo</h3>
        <p class="modal-subtitle">Añade invitados especiales o talento externo al calendario de celebraciones.</p>
        
        <div class="form-group">
          <label>Nombre Completo</label>
          <input v-model="newUser.name" placeholder="Ej. Juan Pérez" />
        </div>
        <div class="form-group">
          <label>Correo Electrónico</label>
          <input v-model="newUser.email" placeholder="institucional@iecs.edu.mx" />
        </div>
        <div class="form-group">
          <label>Fecha de Nacimiento</label>
          <input v-model="newUser.birthday" type="date" />
        </div>
        <div class="form-group">
          <label>Sede / Etiqueta</label>
          <select v-model="newUser.plantel">
            <option value="Externo">Externo General</option>
            <option value="Casita Metepec">Casita Metepec</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAddModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="submitExternal">Guardar Registro</button>
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
import CelebrationScene from '~/components/CelebrationScene.vue'
import { useEmployees } from '~/composables/useEmployees'

const { 
  loading, stats, filteredEmployees, filterPlantel, filterSearch, randomFaces,
  fetchEmployees, updateEmployee, deleteEmployee, toggleCalendarEvent, addExternalUser, exportExcel 
} = useEmployees()

const showAddModal = ref(false)
const newUser = ref({ name: '', email: '', birthday: '', plantel: 'Externo' })

onMounted(() => {
  fetchEmployees()
})

const submitExternal = async () => {
  if(!newUser.value.name) return alert('El nombre es obligatorio.')
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
  position: relative;
}

.header-glass {
  position: relative;
  z-index: 10;
  width: 100%;
  background: linear-gradient(to bottom, rgba(11, 19, 43, 0.9) 0%, rgba(11, 19, 43, 0) 100%);
  padding: 24px 32px 64px 32px;
  pointer-events: none; /* Let clicks pass through to 3D scene if needed */
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  pointer-events: auto;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 24px;
}
.logo-main { height: 45px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
.divider { width: 1px; height: 35px; background: rgba(255,255,255,0.2); }
.logo-hhb { height: 50px; filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.6)); }

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}
.welcome-text {
  color: white;
  font-weight: 500;
  letter-spacing: 0.05em;
  opacity: 0.9;
}
.logout-btn {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
}
.logout-btn:hover { background: rgba(255,255,255,0.25); }

.main-content { 
  position: relative;
  z-index: 20;
  padding: 0 32px 48px 32px; 
  max-width: 1400px; 
  margin: -100px auto 0 auto; /* Pull content up over the hero */
  width: 100%; 
  box-sizing: border-box; 
}

.elevated-stats {
  position: relative;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0 24px 0;
  gap: 16px;
  flex-wrap: wrap;
  background: white;
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-subtle);
  border: 1px solid var(--border-color);
}

.filters, .actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap;}

.premium-select, .search-input {
  min-width: 250px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
}
.btn-primary { 
  background: var(--primary-navy); 
  color: white;
  box-shadow: 0 4px 6px rgba(11, 19, 43, 0.2);
}
.btn-primary:hover { background: var(--primary-slate); transform: translateY(-1px); }

.btn-secondary { 
  background: white; 
  color: var(--primary-navy); 
  border: 1px solid var(--border-color);
}
.btn-secondary:hover { background: #F1F5F9; }

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover { background: #F1F5F9; color: var(--primary-navy); }

.icon { width: 18px; height: 18px; }

.loading-state { 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px; 
  color: var(--text-secondary); 
  font-size: 1.1rem; 
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E2E8F0;
  border-top-color: var(--secondary-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Modal Styling */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(11, 19, 43, 0.6); 
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; 
  z-index: 100;
}
.modal-content {
  background: white; 
  padding: 40px; 
  border-radius: 20px; 
  width: 450px; 
  display: flex; 
  flex-direction: column; 
  gap: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
}
.modal-content h3 { margin: 0; color: var(--primary-navy); font-size: 1.5rem; }
.modal-subtitle { margin: -10px 0 10px 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;}

.form-group {
  display: flex; flex-direction: column; gap: 6px;
}
.form-group label {
  font-size: 0.85rem; font-weight: 600; color: var(--text-primary);
}
.form-group input, .form-group select {
  width: 100%; box-sizing: border-box; background: #F8FAFC;
}

.modal-actions { 
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; 
}
</style>