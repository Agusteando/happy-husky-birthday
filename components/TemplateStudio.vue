<template>
  <div class="studio-overlay" @click.self="emit('close')">
    <div class="studio-modal">
      <div class="studio-header">
        <h2>Diseñador de felicitación - {{ employee.name }}</h2>
        <button class="close-btn" @click="emit('close')">✖</button>
      </div>

      <div class="studio-content">
        <div class="preview-panel">
          <div class="canvas-wrapper">
            <img 
              v-if="selectedAsset" 
              :src="selectedAsset.imageUrl" 
              class="template-bg" 
              :style="{ objectPosition: `${cropX}% ${cropY}%` }" 
            />
            <div v-else class="empty-canvas">Cargue o seleccione una plantilla</div>
            
            <div class="canvas-overlay">
              <h1 class="canvas-name">{{ employee.name }}</h1>
              <div class="canvas-messages">
                <div v-for="msg in messages" :key="msg.id" class="msg-bubble">
                  "{{ msg.message }}" <br/><small>- {{ msg.author_name }}</small>
                </div>
              </div>
            </div>
          </div>
          
          <div class="crop-controls" v-if="selectedAsset">
            <label>Ajuste horizontal (X)</label>
            <input type="range" v-model="cropX" min="0" max="100" @change="saveCrop" />
            <label>Ajuste vertical (Y)</label>
            <input type="range" v-model="cropY" min="0" max="100" @change="saveCrop" />
          </div>
        </div>

        <div class="tools-panel">
          
          <!-- Galería Global y Subida Externa -->
          <div class="tool-section">
            <h3>Galería de Plantillas</h3>
            <p class="help-text">Seleccione una plantilla base o suba un nuevo diseño global.</p>
            
            <div class="gallery-grid" v-if="allTemplates.length > 0">
               <div 
                 v-for="t in allTemplates" 
                 :key="t.id" 
                 class="gallery-item" 
                 :class="{ active: selectedAsset?.id === t.id }" 
                 @click="selectTemplate(t)"
               >
                 <img :src="t.imageUrl" />
                 <div class="badges">
                    <span v-if="t.isDefault" title="Predeterminado Global">⭐</span>
                    <span v-if="t.targetPlantel" title="Asignado a Sede">🏢</span>
                    <span v-if="t.targetEmployee" title="Asignado a Colaborador Específico">👤</span>
                 </div>
               </div>
            </div>
            
            <button class="btn-primary mt-2" @click="$refs.fileInput.click()">Subir nueva plantilla</button>
            <input type="file" accept="image/*" @change="handleFileUpload" ref="fileInput" style="display: none;" />
          </div>

          <!-- Controles de Asignación y Jerarquía -->
          <div class="tool-section" v-if="selectedAsset && !selectedAsset.isLegacy">
            <h3>Asignación de Plantilla</h3>
            <div class="assign-toggles">
               <label class="toggle-row">
                 <input type="checkbox" v-model="selectedAsset.isDefault" @change="saveCurrentAsset" />
                 Fijar como Global Predeterminada
               </label>
               <label class="toggle-row">
                 <input type="checkbox" v-model="selectedAsset.allowRandom" @change="saveCurrentAsset" />
                 Incluir en Motor Aleatorio
               </label>
               
               <div class="assign-buttons">
                 <button class="btn-ghost" @click="assignToPlantel">
                   Asignar a Sede ({{ employeePlantel }})
                 </button>
                 <button class="btn-ghost" @click="assignToEmployee">
                   Asignar solo a {{ employee.name }}
                 </button>
               </div>
            </div>
          </div>

          <div class="tool-section">
            <h3>Añadir mensaje</h3>
            <input v-model="newAuthor" placeholder="Su nombre" class="full-width mb-2" />
            <textarea v-model="newMessage" placeholder="Escriba un mensaje de felicitación..." rows="3" class="full-width"></textarea>
            <button class="btn-secondary mt-2 full-width" @click="addMessage">Guardar mensaje</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const props = defineProps({ employee: Object })
const emit = defineEmits(['close'])

const selectedAsset = ref(null)
const allTemplates = ref([])
const cropX = ref(50)
const cropY = ref(50)
const messages = ref([])
const newAuthor = ref('')
const newMessage = ref('')

const employeePlantel = computed(() => {
  return props.employee.plantel?.label || props.employee.plantel?.name || props.employee.plantel || ''
})

const loadData = async () => {
  try {
    const plantelStr = encodeURIComponent(employeePlantel.value)
    const res = await $fetch(`/api/templates?employeeId=${props.employee.id}&plantel=${plantelStr}`)
    
    allTemplates.value = res.allTemplates || []
    selectedAsset.value = res.template || null
    
    if (selectedAsset.value && selectedAsset.value.cropMeta) {
      cropX.value = selectedAsset.value.cropMeta.x || 50
      cropY.value = selectedAsset.value.cropMeta.y || 50
    }
    messages.value = res.messages || []
  } catch (e) {
    console.error('Error cargando datos del estudio', e)
  }
}

onMounted(loadData)

watch(() => selectedAsset.value, (newAsset) => {
  if (newAsset && newAsset.cropMeta) {
    cropX.value = newAsset.cropMeta.x || 50
    cropY.value = newAsset.cropMeta.y || 50
  }
})

const selectTemplate = (t) => {
  selectedAsset.value = t
}

const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Integración Multipart external upload para Expediente CasitaApps
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'hhb_templates')
  formData.append('includeUrl', 'true')

  try {
    const res = await fetch('https://expediente.casitaapps.com/upload.ashx', {
      method: 'POST',
      body: formData
    })
    
    const text = await res.text()
    let uploadedUrl = text
    try {
      const json = JSON.parse(text)
      if (json.url) uploadedUrl = json.url
      else if (json.path) uploadedUrl = json.path
    } catch {}

    const newId = crypto.randomUUID()
    const newAsset = {
      id: newId,
      name: file.name,
      imageUrl: uploadedUrl,
      isDefault: false,
      targetPlantel: null,
      targetEmployee: null,
      allowRandom: false,
      cropMeta: { x: 50, y: 50 }
    }

    await $fetch('/api/templates/save-asset', {
      method: 'POST',
      body: newAsset
    })
    
    await loadData()
    const found = allTemplates.value.find(t => t.id === newId)
    if (found) selectedAsset.value = found

  } catch (err) {
    console.error('Upload Error:', err)
    alert('Fallo al subir la plantilla al servidor de expedientes.')
  }
}

const saveCurrentAsset = async () => {
  if (!selectedAsset.value || selectedAsset.value.isLegacy) return
  await $fetch('/api/templates/save-asset', {
    method: 'POST',
    body: selectedAsset.value
  })
  await loadData()
}

const saveCrop = () => {
  if (!selectedAsset.value) return
  if (!selectedAsset.value.cropMeta) selectedAsset.value.cropMeta = {}
  selectedAsset.value.cropMeta.x = cropX.value
  selectedAsset.value.cropMeta.y = cropY.value
  
  if (selectedAsset.value.isLegacy) {
     $fetch('/api/templates/upload', {
       method: 'POST',
       body: { employeeId: props.employee.id, imageBase64: selectedAsset.value.imageUrl, cropMeta: { x: cropX.value, y: cropY.value } }
     })
  } else {
     saveCurrentAsset()
  }
}

const assignToPlantel = () => {
  selectedAsset.value.targetPlantel = employeePlantel.value
  selectedAsset.value.targetEmployee = null
  saveCurrentAsset()
}

const assignToEmployee = () => {
  selectedAsset.value.targetEmployee = props.employee.id
  selectedAsset.value.targetPlantel = null
  saveCurrentAsset()
}

const addMessage = async () => {
  if (!newMessage.value || !newAuthor.value) return alert('Complete nombre y mensaje.')
  try {
    const msg = await $fetch('/api/templates/messages', {
      method: 'POST',
      body: { employeeId: props.employee.id, authorName: newAuthor.value, message: newMessage.value }
    })
    messages.value.push(msg)
    newMessage.value = ''
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.studio-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(26, 32, 44, 0.7); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}

.studio-modal {
  background: var(--bg-color); width: 950px; max-width: 95vw; height: 650px; max-height: 90vh;
  border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.studio-header {
  padding: 20px 32px; background: white; border-bottom: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
}

.studio-header h2 { margin: 0; color: var(--primary-navy); font-size: 1.25rem; }
.close-btn { background: transparent; font-size: 1.2rem; color: var(--text-secondary); padding: 4px 8px; }
.close-btn:hover { color: var(--danger); }

.studio-content { display: flex; flex: 1; overflow: hidden; }

.preview-panel {
  flex: 1.5; padding: 32px; background: #F1F5F9;
  display: flex; flex-direction: column; align-items: center; overflow-y: auto;
}

.canvas-wrapper {
  width: 100%; max-width: 380px; aspect-ratio: 4/5;
  background: white; border-radius: 16px; position: relative; overflow: hidden;
  box-shadow: var(--shadow-subtle);
}

.template-bg { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }

.empty-canvas {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  color: #94A3B8; font-weight: 500; border: 2px dashed #CBD5E1; border-radius: 16px; text-align: center; padding: 20px;
}

.canvas-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column; padding: 32px; text-align: center;
}

.canvas-name {
  margin-top: auto; color: white; font-size: 2.2rem; font-weight: 800;
  text-shadow: 0 4px 10px rgba(0,0,0,0.6); margin-bottom: 20px;
}

.canvas-messages { display: flex; flex-direction: column; gap: 8px; }

.msg-bubble {
  background: rgba(255, 255, 255, 0.95); padding: 10px 16px; border-radius: 12px;
  font-size: 0.85rem; color: var(--primary-navy); text-align: left; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.crop-controls {
  margin-top: 24px; width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 8px;
}

.crop-controls label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }

.tools-panel {
  flex: 1; background: white; padding: 24px 32px; border-left: 1px solid var(--border-color); overflow-y: auto;
}

.tool-section { margin-bottom: 32px; }
.tool-section h3 { margin: 0 0 6px 0; font-size: 1.1rem; color: var(--primary-navy); }
.help-text { margin: 0 0 16px 0; font-size: 0.85rem; color: var(--text-secondary); }

.gallery-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;
}

.gallery-item {
  position: relative; aspect-ratio: 4/5; border-radius: 8px; overflow: hidden; cursor: pointer;
  border: 2px solid transparent; transition: all 0.2s ease; background: #F8FAFC;
}

.gallery-item.active { border-color: var(--secondary-gold); box-shadow: 0 4px 12px rgba(212,175,55,0.3); transform: translateY(-2px); }
.gallery-item img { width: 100%; height: 100%; object-fit: cover; }
.badges {
  position: absolute; top: 4px; right: 4px; display: flex; gap: 4px;
  background: rgba(255,255,255,0.9); padding: 2px 4px; border-radius: 6px; font-size: 0.75rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.assign-toggles { display: flex; flex-direction: column; gap: 12px; background: #F8FAFC; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); }
.toggle-row { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 500; color: var(--primary-navy); cursor: pointer; }
.assign-buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }

.full-width { width: 100%; box-sizing: border-box; }
.mb-2 { margin-bottom: 8px; }
.mt-2 { margin-top: 8px; }

.btn-primary { width: 100%; background: var(--primary-navy); color: white; padding: 12px; font-weight: 600; border-radius: 8px; }
.btn-primary:hover { background: var(--primary-slate); }
.btn-secondary { background: white; color: var(--primary-navy); border: 1px solid var(--border-color); padding: 12px; font-weight: 600; border-radius: 8px; }
.btn-secondary:hover { background: #F8FAFC; }
.btn-ghost { padding: 10px; font-size: 0.85rem; border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 6px; background: white; }
.btn-ghost:hover { background: #F1F5F9; color: var(--primary-navy); }
</style>