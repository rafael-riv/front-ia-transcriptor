<template>
  <div class="real-time-transcription">
    <!-- Header Section -->
    <div class="section-header">
      <h2>🎙️ Transcripción en Tiempo Real</h2>
      <p class="section-description">
        Habla al micrófono y obtén la transcripción en tiempo real
      </p>
    </div>

    <!-- Status Indicators -->
    <div class="status-indicators">
      <div class="status-item" :class="{ active: isConnected }">
        <div class="status-dot"></div>
        <span>{{ isConnected ? 'Conectado' : 'Desconectado' }}</span>
      </div>
      
      <div class="status-item" :class="{ active: isRecording }">
        <div class="status-dot recording"></div>
        <span>{{ isRecording ? 'Grabando' : 'Sin grabar' }}</span>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message" :class="{ 'quota-error': isQuotaError }">
      <span class="error-icon">{{ isQuotaError ? '💳' : '⚠️' }}</span>
      <div class="error-content">
        <span class="error-text">{{ error }}</span>
        <div v-if="isQuotaError" class="quota-help">
          <p class="quota-suggestion">💡 <strong>Sugerencias:</strong></p>
          <ul class="quota-list">
            <li>Verifica tu cuota en <a href="https://portal.speechmatics.com" target="_blank" rel="noopener">portal.speechmatics.com</a></li>
            <li>Considera actualizar tu plan si necesitas más minutos</li>
            <li>Espera hasta el próximo ciclo de facturación</li>
          </ul>
        </div>
      </div>
      <button @click="clearError" class="close-error">×</button>
    </div>

    <!-- Control Panel -->
    <div class="control-panel">
      <!-- Language Selection -->
      <div class="control-group">
        <label for="language-select">Idioma:</label>
        <select 
          id="language-select" 
          v-model="selectedLanguage"
          :disabled="isTranscribing"
          class="language-select"
        >
          <option value="es">🇪🇸 Español</option>
          <option value="en">🇺🇸 English</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
        </select>
      </div>

      <!-- Options -->
      <div class="control-group">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="enablePartials"
            :disabled="isTranscribing"
          />
          <span class="checkmark"></span>
          Transcripción parcial
        </label>
      </div>

      <div class="control-group">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="removeDisfluencies"
            :disabled="isTranscribing"
          />
          <span class="checkmark"></span>
          Remover muletillas
        </label>
      </div>
    </div>

    <!-- Main Recording Button -->
    <div class="recording-controls">
      <button 
        @click="toggleTranscription"
        :disabled="!isConnected"
        :class="[
          'record-button',
          { 
            'recording': isTranscribing,
            'disabled': !isConnected
          }
        ]"
      >
        <div class="record-icon">
          <div v-if="!isTranscribing" class="microphone-icon">🎤</div>
          <div v-else class="recording-animation">
            <div class="pulse"></div>
            <div class="stop-icon">⏹️</div>
          </div>
        </div>
        <span class="record-text">
          {{ recordButtonText }}
        </span>
      </button>

      <!-- Clear Text Button -->
      <button 
        v-if="getFullText"
        @click="handleClearText"
        class="clear-button"
        :disabled="isTranscribing"
      >
        🗑️ Limpiar
      </button>
    </div>

    <!-- Transcription Display -->
    <div class="transcription-container">
      <div class="transcription-header">
        <h3>📝 Transcripción:</h3>
        <div v-if="isTranscribing" class="live-indicator">
          <div class="live-dot"></div>
          <span>EN VIVO</span>
        </div>
      </div>

      <div class="transcription-display">
        <div v-if="!getFullText && !isTranscribing" class="empty-state">
          <div class="empty-icon">🎯</div>
          <p>La transcripción aparecerá aquí cuando comiences a hablar</p>
        </div>

        <div v-else class="transcript-content">
          <!-- Texto final (confirmado) -->
          <span v-if="finalText" class="final-text">{{ finalText }}</span>
          
          <!-- Texto parcial (en tiempo real) -->
          <span v-if="partialText" class="partial-text">{{ partialText }}</span>
          
          <!-- Cursor parpadeante cuando está grabando -->
          <span v-if="isTranscribing" class="cursor">|</span>
        </div>

        <!-- Character Count -->
        <div v-if="getFullText" class="character-count">
          {{ getFullText.length }} caracteres
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="getFullText" class="action-buttons">
      <button @click="copyToClipboard" class="action-btn copy-btn">
        📋 Copiar
      </button>
      
      <button @click="downloadTranscript" class="action-btn download-btn">
        💾 Descargar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRealTimeTranscription } from '~/composables/useRealTimeTranscription'
const {
  // Estado
  isConnected,
  isTranscribing,
  isRecording,
  partialText,
  finalText,
  error,
  
  // Computed
  getFullText,
  
  // Métodos
  connect,
  startTranscription,
  stopTranscription,
  clearText
} = useRealTimeTranscription()

// Estado local del componente
const selectedLanguage = ref('es')
const enablePartials = ref(true)
const removeDisfluencies = ref(true)

// Computed properties
const recordButtonText = computed(() => {
  if (!isConnected.value) return 'Conectando...'
  if (isTranscribing.value) return 'Detener Grabación'
  return 'Iniciar Grabación'
})

const isQuotaError = computed(() => {
  return error.value && (
    error.value.includes('límite de uso') || 
    error.value.includes('quota') ||
    error.value.includes('cuota') ||
    error.value.includes('límite de Speechmatics')
  )
})

// Métodos
const toggleTranscription = async () => {
  if (isTranscribing.value) {
    stopTranscription()
  } else {
    try {
      await startTranscription({
        language: selectedLanguage.value,
        enable_partials: enablePartials.value,
        remove_disfluencies: removeDisfluencies.value
      })
    } catch (err) {
      console.error('Error al iniciar transcripción:', err)
    }
  }
}

const clearError = () => {
  // El error se limpia automáticamente con el composable
}

const handleClearText = () => {
  if (!isTranscribing.value) {
    clearText()
  }
}

const copyToClipboard = async () => {
  if (getFullText.value) {
    try {
      await navigator.clipboard.writeText(getFullText.value)
      // Podrías mostrar una notificación de éxito aquí
      console.log('✅ Texto copiado al portapapeles')
    } catch (err) {
      console.error('Error copiando al portapapeles:', err)
    }
  }
}

const downloadTranscript = () => {
  if (getFullText.value) {
    const blob = new Blob([getFullText.value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcripcion-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Auto-conectar si no está conectado
onMounted(() => {
  if (!isConnected.value) {
    connect()
  }
})
</script>

<style scoped>
.real-time-transcription {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  color: white;
}

.section-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
}

.section-description {
  text-align: center;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.status-indicators {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.status-item.active {
  background: rgba(255, 255, 255, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b6b;
  transition: all 0.3s ease;
}

.status-item.active .status-dot {
  background: #51cf66;
}

.status-dot.recording {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.error-message {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.5);
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.error-message.quota-error {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.5);
}

.error-content {
  flex: 1;
}

.error-text {
  display: block;
  margin-bottom: 0.5rem;
}

.quota-help {
  font-size: 0.9rem;
  opacity: 0.9;
}

.quota-suggestion {
  margin: 0.5rem 0 0.25rem 0;
  font-size: 0.85rem;
}

.quota-list {
  margin: 0.25rem 0 0 1rem;
  padding: 0;
  list-style-type: disc;
}

.quota-list li {
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}

.quota-list a {
  color: #74b9ff;
  text-decoration: underline;
}

.close-error {
  margin-left: auto;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.control-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.language-select {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1rem;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.recording-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.record-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
  min-height: 150px;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
}

.record-button:hover:not(.disabled) {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(255, 107, 107, 0.4);
}

.record-button.recording {
  background: linear-gradient(135deg, #51cf66, #40c057);
  box-shadow: 0 10px 30px rgba(81, 207, 102, 0.3);
  animation: recordingPulse 2s infinite;
}

.record-button.disabled {
  background: #adb5bd;
  cursor: not-allowed;
  box-shadow: none;
}

@keyframes recordingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.record-icon {
  font-size: 3rem;
  position: relative;
}

.recording-animation {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: ripple 1.5s infinite;
}

@keyframes ripple {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.clear-button {
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.transcription-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.transcription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(102, 126, 234, 0.1);
  border-bottom: 1px solid rgba(102, 126, 234, 0.2);
}

.transcription-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.2rem;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff6b6b;
  font-weight: 600;
  font-size: 0.9rem;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #ff6b6b;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.transcription-display {
  min-height: 200px;
  padding: 1.5rem;
  color: #495057;
  position: relative;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: #adb5bd;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.transcript-content {
  line-height: 1.8;
  font-size: 1.1rem;
  position: relative;
}

.final-text {
  color: #495057;
}

.partial-text {
  color: #868e96;
  font-style: italic;
}

.cursor {
  color: #667eea;
  font-weight: bold;
  animation: blink 1s infinite;
}

.character-count {
  position: absolute;
  bottom: 1rem;
  right: 1.5rem;
  font-size: 0.8rem;
  color: #adb5bd;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.action-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.copy-btn {
  background: linear-gradient(135deg, #74b9ff, #0984e3);
}

.download-btn {
  background: linear-gradient(135deg, #a29bfe, #6c5ce7);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Responsive Design */
@media (max-width: 768px) {
  .real-time-transcription {
    padding: 1rem;
    margin: 1rem;
  }
  
  .control-panel {
    grid-template-columns: 1fr;
  }
  
  .record-button {
    min-width: 120px;
    min-height: 120px;
    padding: 1.5rem;
  }
  
  .recording-controls {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style> 