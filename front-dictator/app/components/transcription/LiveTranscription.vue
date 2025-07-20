<template>
  <div class="live-transcription-container">
    <header class="transcription-header">
      <h2>🎙️ Transcripción en Tiempo Real</h2>
      <p class="header-description">
        Utiliza IA avanzada para transcribir tu voz en tiempo real
      </p>
    </header>

    <!-- Controles de Transcripción -->
    <TranscriptionControls
      :is-transcribing="transcriptionStatus.isTranscribing"
      :is-paused="transcriptionStatus.isPaused"
      :is-connected="transcriptionStatus.isConnected"
      :status="status"
      :status-class="statusClass"
      :button-state="buttonState"
      :session-duration="sessionDuration()"
      :disabled="isLoading"
      @main-action="handleMainAction"
      @stop="stopSession"
    />

    <!-- Display de Transcripción -->
    <LiveTranscriptDisplay
      :is-transcribing="transcriptionStatus.isTranscribing"
      :live-text="transcriptionStatus.liveText"
      :current-text="transcriptionStatus.currentText"
      :is-loading="isLoading"
      @save="saveCurrentTranscript"
      @download="downloadCurrentTranscript"
      @copy="copyCurrentToClipboard"
    />

    <!-- Historial de Transcripciones -->
    <section class="history-section">
      <div class="history-header">
        <h3>📋 Historial de Transcripciones</h3>
        <div class="history-controls">
          <span v-if="transcriptionHistory.isLoading.value" class="loading-indicator">
            🔄 Cargando...
          </span>
          <span v-else class="history-count">
            {{ transcriptionHistory.count() }} transcripciones
          </span>
          
          <button 
            @click="refreshHistory"
            class="refresh-btn"
            :disabled="transcriptionHistory.isLoading.value"
          >
            🔄 Actualizar
          </button>
          
          <button 
            v-if="transcriptionHistory.count() > 0"
            @click="downloadAllTranscripts"
            class="download-all-btn"
          >
            📁 Descargar Todo
          </button>
          
          <button 
            v-if="transcriptionHistory.hasTemporary()"
            @click="clearLocalHistory"
            class="clear-btn"
          >
            🧹 Limpiar Local
          </button>
        </div>
      </div>

      <!-- Lista de Transcripciones -->
      <div v-if="transcriptionHistory.isLoading.value" class="loading-state">
        <p>📥 Cargando historial desde el servidor...</p>
      </div>

      <div v-else-if="transcriptionHistory.count() === 0" class="empty-history">
        <span class="empty-icon">📝</span>
        <h4>No hay transcripciones en el historial</h4>
        <p>¡Crea tu primera transcripción usando el micrófono!</p>
      </div>

      <div v-else class="history-list">
        <TranscriptionHistoryItem
          v-for="(item, index) in transcriptionHistory.transcriptions"
          :key="item.id"
          :item="item"
          :index="index"
          :is-loading="isActionLoading"
          @save="saveHistoryItem"
          @copy="copyHistoryItem"
          @download="downloadHistoryItem"
          @delete="deleteHistoryItem"
        />
      </div>
    </section>

    <!-- Notificaciones Toast -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRealTimeTranscription } from '~/composables/useRealTimeTranscription'
import { FileOperationsService } from '~/utils/fileOperationsService'
import TranscriptionControls from './TranscriptionControls.vue'
import LiveTranscriptDisplay from './LiveTranscriptDisplay.vue'
import TranscriptionHistoryItem from './TranscriptionHistoryItem.vue'
import type { TranscriptionItem } from '~/composables/useTranscriptionHistory'

// Middleware para proteger la ruta
definePageMeta({
  middleware: 'authenticated'
})

// Estado para notificaciones
const notification = ref<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
const isLoading = ref(false)
const isActionLoading = ref(false)

// Configurar transcripción en tiempo real
const transcription = useRealTimeTranscription({
  apiBaseUrl: 'http://localhost:4000',
  autoConnect: true,
  onSuccess: (message) => showNotification(message, 'success'),
  onError: (error) => showNotification(error, 'error')
})

// Destructuring de las propiedades del composable
const {
  status,
  transcriptionStatus,
  buttonState,
  statusClass,
  transcriptionHistory,
  handleMainAction,
  stopSession,
  saveCurrentTranscript: saveTranscript,
  downloadCurrentTranscript: downloadTranscript,
  copyToClipboard,
  sessionDuration
} = transcription

// Métodos de manejo de notificaciones
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 4000)
}

// Métodos para manejar transcripción actual
const saveCurrentTranscript = async () => {
  isLoading.value = true
  try {
    await saveTranscript()
  } finally {
    isLoading.value = false
  }
}

const downloadCurrentTranscript = () => {
  downloadTranscript()
}

const copyCurrentToClipboard = () => {
  copyToClipboard()
}

// Métodos para manejar historial
const refreshHistory = async () => {
  await transcriptionHistory.refresh()
}

const downloadAllTranscripts = () => {
  try {
    const transcripts = transcriptionHistory.transcriptions.map((item: TranscriptionItem) => ({
      text: item.text,
      timestamp: item.timestamp,
      duration: item.duration,
      filename: item.filename
    }))
    
    FileOperationsService.downloadMultipleTranscriptions(transcripts)
    showNotification('Historial completo descargado', 'success')
  } catch (error) {
    showNotification(
      error instanceof Error ? error.message : 'Error al descargar historial',
      'error'
    )
  }
}

const clearLocalHistory = async () => {
  if (confirm('¿Estás seguro de que quieres eliminar todo el historial local? (Las transcripciones guardadas en el servidor permanecerán)')) {
    const success = await transcriptionHistory.clearLocalHistory()
    if (success) {
      showNotification('Historial local limpiado', 'success')
    }
  }
}

// Métodos para items individuales del historial
const saveHistoryItem = async (item: TranscriptionItem) => {
  isActionLoading.value = true
  try {
    const success = await transcriptionHistory.saveExistingItem(item)
    if (success) {
      showNotification('Transcripción guardada exitosamente', 'success')
    }
  } finally {
    isActionLoading.value = false
  }
}

const copyHistoryItem = async (text: string) => {
  try {
    const success = await FileOperationsService.copyToClipboard(text)
    if (success) {
      showNotification('Texto copiado al portapapeles', 'success')
    }
  } catch (error) {
    showNotification(
      error instanceof Error ? error.message : 'Error al copiar',
      'error'
    )
  }
}

const downloadHistoryItem = (item: TranscriptionItem) => {
  try {
    const index = transcriptionHistory.transcriptions.indexOf(item) + 1
    FileOperationsService.downloadTranscription(
      item.text,
      item.filename || `transcripcion_${index}`
    )
    showNotification('Transcripción descargada', 'success')
  } catch (error) {
    showNotification(
      error instanceof Error ? error.message : 'Error al descargar',
      'error'
    )
  }
}

const deleteHistoryItem = async (id: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta transcripción?')) {
    const success = transcriptionHistory.deleteLocalItem(id)
    if (success) {
      showNotification('Transcripción eliminada', 'success')
    }
  }
}

// Cargar historial al montar
onMounted(() => {
  transcriptionHistory.refresh()
})
</script>

<style scoped>
.live-transcription-container {
  @apply max-w-6xl mx-auto p-6 space-y-8;
}

.transcription-header {
  @apply text-center mb-8;
}

.transcription-header h2 {
  @apply text-3xl font-bold text-gray-800 mb-2;
}

.header-description {
  @apply text-gray-600 text-lg;
}

/* Sección de historial */
.history-section {
  @apply bg-white rounded-lg border border-gray-200 p-6 shadow-sm;
}

.history-header {
  @apply flex justify-between items-center mb-6 pb-4 border-b border-gray-200;
}

.history-header h3 {
  @apply text-xl font-semibold text-gray-800 m-0;
}

.history-controls {
  @apply flex items-center gap-3 flex-wrap;
}

.loading-indicator,
.history-count {
  @apply text-sm text-gray-600 font-medium;
}

.refresh-btn,
.download-all-btn,
.clear-btn {
  @apply px-3 py-1.5 rounded-md text-sm font-medium transition-colors border-none cursor-pointer;
}

.refresh-btn {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
}

.download-all-btn {
  @apply bg-green-100 text-green-700 hover:bg-green-200;
}

.clear-btn {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

.refresh-btn:disabled {
  @apply bg-gray-100 text-gray-400 cursor-not-allowed;
}

/* Estados del historial */
.loading-state,
.empty-history {
  @apply text-center py-12 text-gray-600;
}

.empty-history {
  @apply bg-gray-50 rounded-lg border-2 border-dashed border-gray-300;
}

.empty-icon {
  @apply text-4xl mb-4 block;
}

.empty-history h4 {
  @apply text-lg font-semibold text-gray-700 mb-2;
}

.empty-history p {
  @apply text-gray-500 m-0;
}

.history-list {
  @apply space-y-4;
}

/* Notificaciones */
.notification {
  @apply fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 font-medium text-white;
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  @apply bg-green-500;
}

.notification.error {
  @apply bg-red-500;
}

.notification.info {
  @apply bg-blue-500;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .live-transcription-container {
    @apply p-4 space-y-6;
  }
  
  .transcription-header h2 {
    @apply text-2xl;
  }
  
  .header-description {
    @apply text-base;
  }
  
  .history-header {
    @apply flex-col items-stretch gap-4;
  }
  
  .history-controls {
    @apply justify-center;
  }
  
  .notification {
    @apply left-4 right-4;
  }
}

@media (max-width: 640px) {
  .history-controls {
    @apply flex-col;
  }
  
  .refresh-btn,
  .download-all-btn,
  .clear-btn {
    @apply w-full text-center;
  }
}
</style>