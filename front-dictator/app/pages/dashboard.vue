<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>🎤 Dashboard Vocali</h1>
        <div class="user-actions">
          <span class="welcome-text">¡Bienvenido!</span>
          <button @click="handleLogout" class="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="dashboard-main">
      <!-- Upload Section -->
      <section class="upload-section">
        <div class="section-card">
          <h2>📁 Subir Audio para Transcribir</h2>
          <p class="section-description">
            Sube tu archivo de audio y obtendrás la transcripción automáticamente
          </p>
          
          <form @submit.prevent="handleUpload" class="upload-form">
            <div class="file-input-container">
              <input 
                ref="fileInput"
                type="file" 
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                @change="handleFileSelect"
                class="file-input"
                id="audio-file"
                required
              />
              <label for="audio-file" class="file-label">
                <span v-if="!selectedFile" class="file-label-text">
                  📎 Seleccionar archivo de audio
                </span>
                <span v-else class="file-selected">
                  ✅ {{ selectedFile.name }}
                </span>
              </label>
            </div>
            
            <div v-if="selectedFile" class="file-info">
              <p><strong>Archivo:</strong> {{ selectedFile.name }}</p>
              <p><strong>Tamaño:</strong> {{ formatFileSize(selectedFile.size) }}</p>
              <p><strong>Tipo:</strong> {{ selectedFile.type }}</p>
            </div>
            
            <button 
              type="submit" 
              :disabled="uploading || !selectedFile" 
              class="upload-btn"
            >
              <span v-if="uploading">
                🔄 Subiendo y transcribiendo...
              </span>
              <span v-else>
                🚀 Subir y Transcribir
              </span>
            </button>
          </form>

          <!-- Progress Bar -->
          <div v-if="uploading" class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p class="progress-text">{{ uploadProgress }}% completado</p>
          </div>
        </div>
      </section>

      <!-- History Section -->
      <section class="history-section">
        <div class="section-card">
          <div class="section-header">
            <h2>📋 Historial de Transcripciones</h2>
            <button @click="loadTranscriptions" class="refresh-btn" :disabled="loadingHistory">
              {{ loadingHistory ? '🔄' : '🔄' }} Actualizar
            </button>
          </div>
          
          <div v-if="loadingHistory" class="loading-state">
            <p>⏳ Cargando transcripciones...</p>
          </div>
          
          <div v-else-if="transcriptions.length === 0" class="empty-state">
            <p>📭 No hay transcripciones aún</p>
            <p class="empty-subtitle">¡Sube tu primer archivo de audio!</p>
          </div>
          
          <div v-else class="transcriptions-list">
            <div 
              v-for="transcription in transcriptions" 
              :key="transcription._id"
              class="transcription-item"
            >
              <div class="transcription-header">
                <h3>{{ transcription.filename || 'Audio sin nombre' }}</h3>
                <span class="transcription-date">
                  {{ formatDate(transcription.createdAt) }}
                </span>
              </div>
              
              <div class="transcription-content">
                <p v-if="transcription.text" class="transcription-text">
                  "{{ transcription.text }}"
                </p>
                <p v-else class="no-transcription">
                  ⚠️ Transcripción no disponible
                </p>
              </div>
              
              <div class="transcription-actions">
                <button 
                  @click="copyToClipboard(transcription.text)"
                  class="action-btn copy-btn"
                  :disabled="!transcription.text"
                >
                  📋 Copiar
                </button>
                <button 
                  @click="downloadTranscription(transcription)"
                  class="action-btn download-btn"
                >
                  💾 Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Toast Notifications -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { useUserSession } from '~/composables/useUserSession'

// Middleware para proteger la ruta
definePageMeta({
  middleware: 'authenticated'
})

// Composables
const { loggingOut } = useUserSession()

// Estado reactivo
const fileInput = ref(null)
const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const loadingHistory = ref(false)
const transcriptions = ref([])
const notification = ref(null)

// Cargar transcripciones al montar el componente
onMounted(() => {
  loadTranscriptions()
})

// Métodos
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  
  if (!file) {
    selectedFile.value = null
    return
  }
  
  // Validar tipo de archivo
  const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a']
  const isValidType = validTypes.some(type => file.type.includes(type.split('/')[1])) || 
                     file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)
  
  if (!isValidType) {
    showNotification('Por favor selecciona un archivo de audio válido (.mp3, .wav, .m4a, .aac, .ogg)', 'error')
    event.target.value = ''
    selectedFile.value = null
    return
  }
  
  // Validar tamaño (máximo 50MB)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    showNotification('El archivo es demasiado grande. Máximo 50MB permitido.', 'error')
    event.target.value = ''
    selectedFile.value = null
    return
  }
  
  selectedFile.value = file
  showNotification('Archivo seleccionado correctamente', 'success')
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    showNotification('Selecciona un archivo primero', 'error')
    return
  }
  
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    // Crear FormData
    const formData = new FormData()
    formData.append('audio', selectedFile.value)
    
    // Simular progreso
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 10
      }
    }, 200)
    
    // Obtener token de autenticación
    const token = localStorage.getItem('auth-token')
    
    // Subir archivo
    const response = await $fetch('http://localhost:4000/api/transcribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    // Completar progreso
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    showNotification('¡Archivo subido y transcrito exitosamente!', 'success')
    
    // Limpiar formulario
    selectedFile.value = null
    fileInput.value.value = ''
    uploadProgress.value = 0
    
    // Recargar transcripciones
    await loadTranscriptions()
    
  } catch (error) {
    console.error('Upload failed:', error)
    showNotification('Error al subir el archivo. Inténtalo de nuevo.', 'error')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

const loadTranscriptions = async () => {
  loadingHistory.value = true
  
  try {
    const token = localStorage.getItem('auth-token')
    
    const response = await $fetch('http://localhost:4000/api/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    transcriptions.value = Array.isArray(response) ? response : []
    
  } catch (error) {
    console.error('Failed to load transcriptions:', error)
    showNotification('Error al cargar las transcripciones', 'error')
    transcriptions.value = []
  } finally {
    loadingHistory.value = false
  }
}

const handleLogout = async () => {
  try {
    await loggingOut()
    showNotification('Sesión cerrada correctamente', 'success')
    await navigateTo('/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Redirigir de todas formas
    await navigateTo('/login')
  }
}

const copyToClipboard = async (text) => {
  if (!text) return
  
  try {
    await navigator.clipboard.writeText(text)
    showNotification('Texto copiado al portapapeles', 'success')
  } catch (error) {
    console.error('Copy failed:', error)
    showNotification('Error al copiar el texto', 'error')
  }
}

const downloadTranscription = (transcription) => {
  if (!transcription.text) {
    showNotification('No hay texto para descargar', 'error')
    return
  }
  
  const blob = new Blob([transcription.text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transcripcion_${transcription.filename || 'audio'}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showNotification('Transcripción descargada', 'success')
}

const showNotification = (message, type = 'info') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 4000)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.dashboard-header {
  background: white;
  padding: 1.5rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  color: #333;
  margin: 0;
  font-size: 2rem;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text {
  color: #666;
  font-weight: 500;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #c82333;
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.section-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  height: fit-content;
}

.section-card h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
}

.section-description {
  color: #666;
  margin-bottom: 2rem;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.file-input-container {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.file-label:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.file-label-text {
  color: #666;
  font-size: 1.1rem;
}

.file-selected {
  color: #28a745;
  font-weight: 600;
  font-size: 1.1rem;
}

.file-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.file-info p {
  margin: 0.25rem 0;
  color: #555;
}

.upload-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.upload-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.progress-container {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #34ce57);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  color: #666;
  font-weight: 500;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a6268;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-subtitle {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.transcriptions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transcription-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fafafa;
}

.transcription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.transcription-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.transcription-date {
  color: #888;
  font-size: 0.9rem;
}

.transcription-text {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  font-style: italic;
  color: #444;
  border-left: 4px solid #007bff;
}

.no-transcription {
  color: #dc3545;
  font-style: italic;
  margin: 1rem 0;
}

.transcription-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.copy-btn {
  background: #17a2b8;
  color: white;
}

.copy-btn:hover:not(:disabled) {
  background: #138496;
}

.copy-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.download-btn {
  background: #28a745;
  color: white;
}

.download-btn:hover {
  background: #218838;
}

.notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.notification.success {
  background: #28a745;
}

.notification.error {
  background: #dc3545;
}

.notification.info {
  background: #17a2b8;
}

@media (max-width: 768px) {
  .dashboard-main {
    grid-template-columns: 1fr;
    padding: 0 0.5rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .user-actions {
    flex-direction: column;
  }
  
  .section-card {
    padding: 1.5rem;
  }
  
  .transcription-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .transcription-actions {
    flex-direction: column;
  }
  
  .notification {
    top: 1rem;
    right: 1rem;
    left: 1rem;
  }
}
</style>
  