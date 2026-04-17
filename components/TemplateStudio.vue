<template>
  <div class="studio-overlay" @click.self="emit('close')">
    <div class="studio-modal">
      <div class="studio-header">
        <h2>Estudio de diseño - {{ employee.name }}</h2>
        <button class="close-btn" @click="emit('close')">✖</button>
      </div>

      <div class="studio-content">
        <div class="preview-panel">
          <div class="canvas-wrapper">
            <img 
              v-if="templateBg" 
              :src="templateBg" 
              class="template-bg" 
              :style="{ objectPosition: `${cropX}% ${cropY}%` }" 
            />
            <div v-else class="empty-canvas">Sube una plantilla base</div>
            
            <div class="canvas-overlay">
              <h1 class="canvas-name">{{ employee.name }}</h1>
              <div class="canvas-messages">
                <div v-for="msg in messages" :key="msg.id" class="msg-bubble">
                  "{{ msg.message }}" <br/><small>- {{ msg.author_name }}</small>
                </div>
              </div>
            </div>
          </div>
          
          <div class="crop-controls" v-if="templateBg">
            <label>Encuadre Horizontal (X)</label>
            <input type="range" v-model="cropX" min="0" max="100" @change="saveTemplateMeta" />
            <label>Encuadre Vertical (Y)</label>
            <input type="range" v-model="cropY" min="0" max="100" @change="saveTemplateMeta" />
          </div>
        </div>

        <div class="tools-panel">
          <div class="tool-section">
            <h3>Fondo de plantilla</h3>
            <p class="help-text">Selecciona la plantilla base para la felicitación.</p>
            <input type="file" accept="image/*" @change="handleFileUpload" class="file-input" />
          </div>

          <div class="tool-section">
            <h3>Añadir mensaje</h3>
            <input v-model="newAuthor" placeholder="Tu nombre" class="full-width mb-2" />
            <textarea v-model="newMessage" placeholder="Escribe un mensaje de felicitación..." rows="3" class="full-width"></textarea>
            <button class="btn-primary mt-2" @click="addMessage">Guardar mensaje</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({ employee: Object })
const emit = defineEmits(['close'])

const templateBg = ref('')
const cropX = ref(50)
const cropY = ref(50)
const messages = ref([])
const newAuthor = ref('')
const newMessage = ref('')

const loadData = async () => {
  try {
    const res = await $fetch(`/api/templates?employeeId=${props.employee.id}`)
    if (res.template) {
      templateBg.value = res.template.image_url
      if (res.template.crop_meta) {
        const meta = JSON.parse(res.template.crop_meta)
        cropX.value = meta.x || 50
        cropY.value = meta.y || 50
      }
    }
    messages.value = res.messages || []
  } catch (e) {
    console.error('Error cargando estudio', e)
  }
}

onMounted(loadData)

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    templateBg.value = ev.target.result
    await $fetch('/api/templates/upload', {
      method: 'POST',
      body: { employeeId: props.employee.id, imageBase64: templateBg.value, cropMeta: { x: cropX.value, y: cropY.value } }
    })
  }
  reader.readAsDataURL(file)
}

const saveTemplateMeta = async () => {
  await $fetch('/api/templates/upload', {
    method: 'POST',
    body: { employeeId: props.employee.id, imageBase64: templateBg.value, cropMeta: { x: cropX.value, y: cropY.value } }
  })
}

const addMessage = async () => {
  if (!newMessage.value || !newAuthor.value) return alert('Completa nombre y mensaje.')
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
  background: rgba(26, 32, 44, 0.7);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.studio-modal {
  background: var(--bg-color);
  width: 900px;
  max-width: 95vw;
  height: 600px;
  max-height: 90vh;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.studio-header {
  padding: 20px 32px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.studio-header h2 { margin: 0; color: var(--primary-navy); font-size: 1.25rem; }
.close-btn { background: transparent; font-size: 1.2rem; color: var(--text-secondary); padding: 4px 8px; }
.close-btn:hover { color: var(--danger); }

.studio-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.preview-panel {
  flex: 2;
  padding: 32px;
  background: #F1F5F9;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

.canvas-wrapper {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 4/5;
  background: white;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-subtle);
}

.template-bg {
  width: 100%; height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0; left: 0;
}

.empty-canvas {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: #94A3B8; font-weight: 500; border: 2px dashed #CBD5E1; border-radius: 16px;
}

.canvas-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column;
  padding: 32px; text-align: center;
}

.canvas-name {
  margin-top: auto;
  color: white;
  font-size: 2.5rem;
  font-weight: 800;
  text-shadow: 0 4px 10px rgba(0,0,0,0.6);
  margin-bottom: 20px;
}

.canvas-messages {
  display: flex; flex-direction: column; gap: 8px;
}

.msg-bubble {
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  color: var(--primary-navy);
  text-align: left;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.crop-controls {
  margin-top: 24px;
  width: 100%;
  max-width: 400px;
  display: flex; flex-direction: column; gap: 8px;
}

.crop-controls label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }

.tools-panel {
  flex: 1;
  background: white;
  padding: 32px;
  border-left: 1px solid var(--border-color);
  overflow-y: auto;
}

.tool-section { margin-bottom: 32px; }
.tool-section h3 { margin: 0 0 4px 0; font-size: 1.1rem; color: var(--primary-navy); }
.help-text { margin: 0 0 16px 0; font-size: 0.85rem; color: var(--text-secondary); }

.full-width { width: 100%; box-sizing: border-box; }
.mb-2 { margin-bottom: 8px; }
.mt-2 { margin-top: 8px; }

.file-input { width: 100%; padding: 8px; border: 1px dashed var(--border-color); background: #F8FAFC; cursor: pointer; }

.btn-primary {
  width: 100%;
  background: var(--primary-navy);
  color: white;
  padding: 12px;
  font-weight: 600;
}
.btn-primary:hover { background: var(--primary-slate); }
</style>