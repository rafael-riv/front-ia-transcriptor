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
      :current-text="transcriptionStatus.currentText"
      :session-duration="sessionDuration()"
      :is-loading="isLoading"
      @save="saveCurrentTranscript"
      @download="downloadCurrentTranscript"
      @copy="copyCurrentToClipboard"
      @clear="clearCurrentText"
    />

    <!-- Información sobre el historial -->
    <section class="history-info-section">
      <div class="info-card">
        <div class="info-content">
          <h3>📋 ¿Quieres revisar tus transcripciones anteriores?</h3>
          <p>Accede al historial completo para ver, gestionar y descargar todas tus transcripciones guardadas.</p>
          
          <div class="info-actions">
            <NuxtLink to="/history" class="history-link">
              📋 Ver Historial Completo
            </NuxtLink>
          </div>
        </div>
        
        <div class="info-stats">
          <div class="stat-item">
            <span class="stat-icon">💾</span>
            <span class="stat-label">Solo se guardan las transcripciones que elijas guardar</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🔍</span>
            <span class="stat-label">Busca y organiza tus transcripciones fácilmente</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Notificaciones Toast -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRealTimeTranscription } from '~/composables/useRealTimeTranscription'
import TranscriptionControls from './TranscriptionControls.vue'
import LiveTranscriptDisplay from './LiveTranscriptDisplay.vue'

// Middleware para proteger la ruta
definePageMeta({
  middleware: 'authenticated'
})

// Estado para notificaciones
const notification = ref<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
const isLoading = ref(false)

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
  handleMainAction,
  stopSession,
  saveCurrentTranscript: saveTranscript,
  downloadCurrentTranscript: downloadTranscript,
  copyToClipboard,
  clearText,
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

const clearCurrentText = () => {
  clearText()
  showNotification('Texto eliminado', 'info')
}
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

/* Sección de información del historial */
.history-info-section {
  @apply bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6;
}

.info-card {
  @apply space-y-6;
}

.info-content h3 {
  @apply text-lg font-semibold text-gray-800 mb-3 m-0;
}

.info-content p {
  @apply text-gray-600 mb-4;
}

.info-actions {
  @apply flex justify-center;
}

.history-link {
  @apply inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors duration-200 no-underline;
}

.info-stats {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.stat-item {
  @apply flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100;
}

.stat-icon {
  @apply text-lg;
}

.stat-label {
  @apply text-sm text-gray-700 font-medium;
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
  
  .info-stats {
    @apply grid-cols-1;
  }
  
  .notification {
    @apply left-4 right-4;
  }
}

@media (max-width: 640px) {
  .history-link {
    @apply w-full text-center;
  }
  
  .stat-item {
    @apply flex-col text-center gap-2;
  }
}
</style>