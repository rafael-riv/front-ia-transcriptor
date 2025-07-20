<template>
  <div class="transcript-display">
    <!-- Estado de Escucha Activa -->
    <div v-if="isTranscribing" class="listening-section">
      <div class="listening-header">
        <h3>🎧 Escuchando...</h3>
        <div class="listening-controls">
          <div class="live-indicator">
            <span class="pulse-dot"></span>
            <span class="live-text">EN VIVO</span>
          </div>
          <div v-if="sessionDuration > 0" class="session-time">
            ⏱️ {{ formatDuration(sessionDuration) }}
          </div>
        </div>
      </div>
      
      <div class="listening-animation">
        <div class="sound-wave">
          <div class="wave-bar" v-for="n in 5" :key="n" :style="{ animationDelay: n * 0.1 + 's' }"></div>
        </div>
        <p class="listening-message">
          <span v-if="!currentText">Habla al micrófono para comenzar...</span>
          <span v-else>Continúa hablando...</span>
        </p>
      </div>
    </div>

    <!-- Transcripción Actual Completa -->
    <div v-if="currentText || (!isTranscribing && !showEmpty)" class="current-section">
      <div class="section-header">
        <h3>📝 Transcripción</h3>
        <div class="text-stats">
          <span class="word-count">{{ wordCount }} palabras</span>
          <span class="char-count">{{ charCount }} caracteres</span>
          <span v-if="!isTranscribing" class="status-badge final">✅ Finalizada</span>
          <span v-else class="status-badge active">🔄 En proceso</span>
        </div>
      </div>
      
      <div class="current-transcript">
        <p class="current-text-content">{{ currentText }}</p>
        
        <!-- Indicador de texto en tiempo real -->
        <div v-if="isTranscribing" class="typing-indicator">
          <span class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>

      <div v-if="showActions" class="current-actions">
        <div v-if="!isTranscribing && currentText" class="save-reminder">
          <span class="reminder-icon">💡</span>
          <span class="reminder-text">
            ¡No olvides guardar tu transcripción si quieres conservarla!
          </span>
        </div>
        
        <button 
          @click="handleSave"
          :disabled="!currentText || isTranscribing || isLoading"
          class="action-btn save-btn"
          :title="isTranscribing ? 'Finaliza la transcripción para guardar' : 'Guardar transcripción en el historial'"
        >
          <span v-if="isLoading">💾 Guardando...</span>
          <span v-else>💾 Guardar en Historial</span>
        </button>
        
        <div class="action-buttons">
          <button 
            @click="handleDownload"
            :disabled="!currentText"
            class="action-btn download-btn"
            title="Descargar como archivo de texto"
          >
            📁 Descargar
          </button>

          <button 
            @click="handleCopy"
            :disabled="!currentText"
            class="action-btn copy-btn"
            title="Copiar al portapapeles"
          >
            📋 Copiar
          </button>

          <button 
            @click="handleClear"
            :disabled="!currentText || isTranscribing"
            class="action-btn clear-btn"
            title="Limpiar texto actual"
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Estado vacío inicial -->
    <div v-if="showEmpty && !currentText && !isTranscribing" class="empty-section">
      <div class="empty-content">
        <span class="empty-icon">🎤</span>
        <h3>Listo para transcribir</h3>
        <p>Presiona el botón de grabación para comenzar la transcripción en tiempo real</p>
        <div class="empty-features">
          <span class="feature-tag">⚡ Tiempo real</span>
          <span class="feature-tag">🎯 Alta precisión</span>
          <span class="feature-tag">💾 Guardado automático</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isTranscribing: boolean
  currentText: string
  isLoading?: boolean
  sessionDuration?: number
  showActions?: boolean
  showEmpty?: boolean
}

interface Emits {
  (e: 'save'): void
  (e: 'download'): void
  (e: 'copy'): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  sessionDuration: 0,
  showActions: true,
  showEmpty: true
})

const emit = defineEmits<Emits>()

// Computadas para estadísticas del texto
const wordCount = computed(() => {
  if (!props.currentText) return 0
  return props.currentText.trim().split(/\s+/).filter(word => word.length > 0).length
})

const charCount = computed(() => {
  return props.currentText.length
})

// Formatear duración
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const remainingMinutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${remainingMinutes}m`
  }
}

// Handlers para las acciones
const handleSave = () => {
  emit('save')
}

const handleDownload = () => {
  emit('download')
}

const handleCopy = () => {
  emit('copy')
}

const handleClear = () => {
  if (confirm('¿Estás seguro de que quieres eliminar el texto actual?')) {
    emit('clear')
  }
}
</script>

<style scoped>
.transcript-display {
  @apply space-y-6;
}

/* Sección de estado de escucha */
.listening-section {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6;
}

.listening-header {
  @apply flex items-center justify-between mb-4;
}

.listening-header h3 {
  @apply text-lg font-semibold text-blue-800 m-0;
}

.listening-controls {
  @apply flex items-center gap-4;
}

.live-indicator {
  @apply flex items-center gap-2;
}

.pulse-dot {
  @apply w-3 h-3 bg-red-500 rounded-full animate-ping;
}

.live-text {
  @apply text-sm font-bold text-red-600 uppercase tracking-wide;
}

.session-time {
  @apply text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded;
}

.listening-animation {
  @apply text-center;
}

.sound-wave {
  @apply flex items-end justify-center gap-1 mb-4 h-16;
}

.wave-bar {
  @apply w-2 bg-blue-500 rounded-t;
  height: 20px;
  animation: wave 1.5s ease-in-out infinite;
}

.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }
.wave-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { height: 20px; opacity: 0.4; }
  50% { height: 60px; opacity: 1; }
}

.listening-message {
  @apply text-blue-700 font-medium m-0;
}

/* Sección de transcripción actual */
.current-section {
  @apply bg-white border border-gray-200 rounded-lg p-6 shadow-sm;
}

.section-header {
  @apply flex items-center justify-between mb-4 pb-3 border-b border-gray-200;
}

.section-header h3 {
  @apply text-lg font-semibold text-gray-800 m-0;
}

.text-stats {
  @apply flex items-center gap-3 text-sm;
}

.word-count, .char-count {
  @apply bg-gray-100 text-gray-700 px-2 py-1 rounded;
}

.status-badge {
  @apply px-2 py-1 rounded text-xs font-bold;
}

.status-badge.active {
  @apply bg-blue-100 text-blue-700;
}

.status-badge.final {
  @apply bg-green-100 text-green-700;
}

.current-transcript {
  @apply bg-gray-50 border border-gray-200 rounded-md p-4 min-h-[120px] max-h-[400px] overflow-y-auto mb-4 relative;
}

.current-text-content {
  @apply text-gray-800 leading-relaxed m-0 whitespace-pre-wrap;
}

.typing-indicator {
  @apply absolute bottom-2 right-2;
}

.typing-dots {
  @apply inline-flex gap-1;
}

.typing-dots span {
  @apply w-2 h-2 bg-blue-400 rounded-full animate-pulse;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

/* Acciones */
.current-actions {
  @apply space-y-3 pt-3 border-t border-gray-200;
}

.save-reminder {
  @apply flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg;
}

.reminder-icon {
  @apply text-yellow-500;
}

.reminder-text {
  @apply text-sm text-yellow-700 font-medium;
}

.action-buttons {
  @apply flex flex-wrap gap-3;
}

.action-btn {
  @apply px-4 py-2 rounded-md font-medium transition-all duration-200 border-none cursor-pointer text-sm;
}

.save-btn {
  @apply bg-purple-500 text-white hover:bg-purple-600;
}

.download-btn {
  @apply bg-gray-600 text-white hover:bg-gray-700;
}

.copy-btn {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.clear-btn {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.action-btn:disabled {
  @apply bg-gray-300 text-gray-500 cursor-not-allowed;
}

/* Estado vacío */
.empty-section {
  @apply bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8;
}

.empty-content {
  @apply text-center;
}

.empty-icon {
  @apply text-4xl mb-4 block;
}

.empty-content h3 {
  @apply text-xl font-semibold text-gray-700 mb-2;
}

.empty-content p {
  @apply text-gray-500 mb-4;
}

.empty-features {
  @apply flex justify-center gap-2 flex-wrap;
}

.feature-tag {
  @apply bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium;
}

/* Responsive */
@media (max-width: 640px) {
  .listening-header {
    @apply flex-col items-start gap-3;
  }
  
  .listening-controls {
    @apply w-full justify-between;
  }
  
  .section-header {
    @apply flex-col items-start gap-3;
  }
  
  .text-stats {
    @apply flex-wrap gap-2;
  }
  
  .action-buttons {
    @apply flex-col;
  }
  
  .action-btn {
    @apply w-full text-center;
  }
  
  .empty-features {
    @apply flex-col items-center;
  }
}

/* Scrollbar personalizado */
.current-transcript::-webkit-scrollbar {
  @apply w-2;
}

.current-transcript::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.current-transcript::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded hover:bg-gray-500;
}

/* Animaciones adicionales */
.listening-section {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 