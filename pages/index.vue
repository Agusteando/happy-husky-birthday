<template>
  <div class="dashboard">
    <div class="hero-wrapper">
      <CelebrationScene :faces="heroFaces" />
      
      <header class="header-glass">
        <div class="header-inner">
          <div class="logo-area center-brand" @dblclick="showAuditModal = true" title="Doble clic para consultar auditoría de bajas">
            <img src="/hhb.png" alt="Happy Husky Birthday" class="logo-hhb-massive" />
            <div class="institutional-badge">
              <img src="/main.png" alt="IECS Logo" class="logo-main-small" />
            </div>
          </div>
          <div class="header-right">
            <button class="logout-btn" @click="logout" title="Cerrar sesión">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div class="hero-content">
        <div class="main-selector-glass">
          <select v-model="filterPlantel" class="premium-select hero-select">
            <option value="" disabled>Seleccione una sede para comenzar...</option>
            <option v-for="option in plantelOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <main class="main-content" v-if="filterPlantel">
      <DashboardStats :stats="stats" />

      <div class="controls-bar glass-panel">
        <div class="filters">
          <input type="text" v-model="filterSearch" placeholder="Buscar colaborador por nombre..." class="search-input" />
        </div>
        <div class="actions">
          <button class="btn btn-secondary" @click="exportExcel">
            Exportar directorio
          </button>
          <button class="btn btn-primary" @click="showAddModal = true">
            Registrar invitado externo
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state glass-panel">
        <div class="spinner"></div>
        <p>Cargando el directorio de {{ filterPlantel }}...</p>
      </div>
      
      <EmployeeTable 
        v-else 
        :data="filteredEmployees" 
        @update="updateEmployee" 
        @remove="handleRemove"
        @calendar="toggleCalendarEvent"
        @openStudio="openStudio"
      />
    </main>

    <main class="main-content landing-state" v-else>
      <div v-if="globalBirthers.length > 0">
        <div class="landing-header glass-panel">
          <h2>🎉 Hoy festejamos a</h2>
        </div>
        
        <EmployeeTable 
          :data="globalBirthers" 
          @update="updateEmployee" 
          @remove="handleRemove"
          @calendar="toggleCalendarEvent"
          @openStudio="openStudio"
        />
      </div>
      
      <div v-else class="empty-state glass-panel" style="margin-top: 40px;">
        <div class="empty-icon">🎈</div>
        <h2>Bienvenido al panel de celebraciones</h2>
        <p>Seleccione una sede en el menú superior para comenzar a explorar el directorio.</p>
      </div>
    </main>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>Registrar invitado externo</h3>
        <p class="modal-subtitle">Añada a colaboradores externos a las celebraciones de {{ filterPlantel }}.</p>
        
        <div class="form-group">
          <label>Nombre completo</label>
          <input v-model="newUser.name" placeholder="Ej. Juan Pérez" />
        </div>
        <div class="form-group">
          <label>Correo electrónico</label>
          <input v-model="newUser.email" placeholder="institucional@iecs.edu.mx" />
        </div>
        <div class="form-group">
          <label>Fecha de nacimiento</label>
          <input v-model="newUser.birthday" type="date" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAddModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="submitExternal">Guardar registro</button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de baja -->
    <div v-if="employeeToRemove" class="modal-overlay" @click.self="employeeToRemove = null">
      <div class="modal-content">
        <h3>Confirmación de baja</h3>
        <p class="modal-subtitle">¿Desea retirar a <strong>{{ employeeToRemove.name }}</strong> del panel de celebraciones?</p>
        <div class="form-group">
          <label>Motivo de la baja (Opcional)</label>
          <input v-model="removeReason" placeholder="Ej. Fin de contrato, permiso, etc." />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="employeeToRemove = null">Cancelar</button>
          <button class="btn btn-danger" @click="confirmRemove">Confirmar baja</button>
        </div>
      </div>
    </div>

    <!-- Modal de auditoría oculto/administrativo -->
    <div v-if="showAuditModal" class="modal-overlay" @click.self="showAuditModal = false">
      <div class="modal-content large-modal">
        <h3>Auditoría de Bajas</h3>
        <p class="modal-subtitle">Registro de colaboradores retirados del panel de celebraciones.</p>
        
        <div v-if="loadingAudit" class="loading-state">
          <div class="spinner"></div>
        </div>
        <table v-else class="audit-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Fecha de retiro</th>
              <th>Autorizado por</th>
              <th>Motivo registrado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in auditLogs" :key="log.id">
              <td>{{ log.employee_name }}</td>
              <td>{{ new Date(log.removed_at).toLocaleString('es-MX') }}</td>
              <td>{{ log.removed_by_user_name }} ({{ log.removed_by_user_email }})</td>
              <td>{{ log.reason || 'Sin especificar' }}</td>
            </tr>
            <tr v-if="auditLogs.length === 0">
              <td colspan="4" style="text-align: center; padding: 20px;">No hay registros de bajas.</td>
            </tr>
          </tbody>
        </table>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAuditModal = false">Cerrar panel</button>
        </div>
      </div>
    </div>

    <TemplateStudio 
      v-if="studioEmployee" 
      :employee="studioEmployee" 
      @close="studioEmployee = null" 
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import DashboardStats from '~/components/DashboardStats.vue'
import EmployeeTable from '~/components/EmployeeTable.vue'
import CelebrationScene from '~/components/CelebrationScene.vue'
import TemplateStudio from '~/components/TemplateStudio.vue'
import { useEmployees, codeToUI } from '~/composables/useEmployees'

const { 
  loading, stats, filteredEmployees, filterPlantel, filterSearch, heroFaces, globalBirthers,
  fetchEmployees, fetchHeroFaces, updateEmployee, removeEmployee, toggleCalendarEvent, addExternalUser, exportExcel 
} = useEmployees()

const plantelOptions = Object.values(codeToUI)
const showAddModal = ref(false)
const newUser = ref({ name: '', email: '', birthday: '', plantel: '' })
const studioEmployee = ref(null)

const showAuditModal = ref(false)
const auditLogs = ref([])
const loadingAudit = ref(false)
const employeeToRemove = ref(null)
const removeReason = ref('')

onMounted(() => {
  fetchHeroFaces()
})

watch(filterPlantel, (val) => {
  if (val) {
    newUser.value.plantel = val
    fetchEmployees(val)
  }
})

const openStudio = (emp) => {
  studioEmployee.value = emp
}

const submitExternal = async () => {
  if(!newUser.value.name) return alert('El nombre es obligatorio.')
  await addExternalUser(newUser.value)
  showAddModal.value = false
  newUser.value = { name: '', email: '', birthday: '', plantel: filterPlantel.value }
}

const handleRemove = (emp) => {
  employeeToRemove.value = emp
  removeReason.value = ''
}

const confirmRemove = async () => {
  if (employeeToRemove.value) {
    await removeEmployee(employeeToRemove.value, removeReason.value)
    employeeToRemove.value = null
  }
}

watch(showAuditModal, async (val) => {
  if (val) {
    loadingAudit.value = true
    try {
      auditLogs.value = await $fetch('/api/employees/removals')
    } catch (e) {
      console.error(e)
    } finally {
      loadingAudit.value = false
    }
  }
})

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

.hero-wrapper {
  position: relative;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.header-glass {
  position: relative;
  z-index: 10;
  width: 100%;
  padding: 24px 32px;
  pointer-events: none;
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 1400px;
  margin: 0 auto;
  pointer-events: auto;
}

.logo-area.center-brand { 
  display: flex; 
  flex-direction: column; 
  align-items: flex-start; 
  gap: 8px; 
  cursor: default;
}

.logo-hhb-massive { 
  height: 180px; 
  filter: drop-shadow(0 15px 25px rgba(212, 175, 55, 0.5)); 
  transform: translateY(-15px);
}

.institutional-badge {
  background: rgba(255,255,255,0.95);
  padding: 6px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.logo-main-small { 
  height: 28px; 
  opacity: 0.95;
}

.header-right {
  margin-top: 10px;
}

.logout-btn {
  background: white;
  color: var(--primary-navy);
  padding: 8px 24px;
  border-radius: 20px;
  font-weight: 600;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
}
.logout-btn:hover { background: #F8FAFC; transform: translateY(-1px); box-shadow: 0 6px 12px rgba(0,0,0,0.08); }

.hero-content {
  position: relative;
  z-index: 10;
  margin: auto auto 40px auto;
  text-align: center;
  pointer-events: none;
  padding: 0 20px;
}

.main-selector-glass {
  display: inline-block;
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  padding: 8px;
  border-radius: 30px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,1);
}

.hero-select {
  border: none;
  background: transparent;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-navy);
  padding: 12px 40px 12px 24px;
  cursor: pointer;
  box-shadow: none !important;
  outline: none;
  appearance: none;
}

.main-content { 
  position: relative;
  z-index: 20;
  padding: 0 32px 48px 32px; 
  max-width: 1400px; 
  margin: 0 auto; 
  width: 100%; 
  box-sizing: border-box; 
}

.landing-header {
  padding: 32px;
  margin-bottom: 32px;
  border-radius: var(--radius-lg);
  text-align: center;
}
.landing-header h2 {
  margin: 0;
  color: var(--primary-navy);
  font-size: 2rem;
  letter-spacing: -0.02em;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 24px;
  border-radius: var(--radius-lg);
}

.filters, .actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap;}

.search-input { min-width: 300px; border-radius: 20px; }

.btn {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 24px; border-radius: 12px; font-weight: 600;
}
.btn-primary { 
  background: var(--primary-navy); color: white;
  box-shadow: 0 4px 15px rgba(45, 55, 72, 0.2);
}
.btn-primary:hover { background: var(--primary-slate); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45, 55, 72, 0.3); }

.btn-secondary { background: white; color: var(--primary-navy); border: 1px solid var(--border-color); }
.btn-secondary:hover { background: #F8FAFC; }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: #F1F5F9; color: var(--primary-navy); }
.btn-danger { background: var(--danger); color: white; }
.btn-danger:hover { background: #E53E3E; box-shadow: 0 4px 15px rgba(245, 101, 101, 0.3); }

.loading-state { 
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 100px 20px; color: var(--text-secondary); font-size: 1.1rem; gap: 20px;
  border-radius: var(--radius-lg);
}
.spinner { width: 40px; height: 40px; border: 3px solid #E2E8F0; border-top-color: var(--secondary-gold); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modals */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(26, 32, 44, 0.6); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal-content {
  background: white; padding: 40px; border-radius: 24px; width: 450px; 
  display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
}
.large-modal { width: 850px; max-width: 90vw; max-height: 85vh; overflow-y: auto; }

.modal-content h3 { margin: 0; color: var(--primary-navy); font-size: 1.5rem; }
.modal-subtitle { margin: -10px 0 10px 0; color: var(--text-secondary); font-size: 0.95rem; line-height: 1.4;}
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }

.audit-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 0.9rem; text-align: left;}
.audit-table th, .audit-table td { padding: 12px; border-bottom: 1px solid var(--border-color); }
.audit-table th { color: var(--primary-navy); font-weight: 600; background: #F8FAFC; border-radius: 6px 6px 0 0;}
.audit-table td { color: var(--text-secondary); }

.empty-state {
  text-align: center;
  padding: 60px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.empty-icon { font-size: 3rem; animation: float-crown 3s infinite alternate; }
.empty-state h2 { margin: 0; color: var(--primary-navy); font-size: 1.8rem; }
.empty-state p { color: var(--text-secondary); margin: 0; font-size: 1.1rem; }
</style>