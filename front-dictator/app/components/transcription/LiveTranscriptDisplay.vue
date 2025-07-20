<template>
  <div class="transcript-display">
    <!-- Transcripción en vivo -->
    <div v-if="showLive && isTranscribing" class="live-section">
      <div class="section-header">
        <h3>🎙️ Transcripción en vivo:</h3>
        <div class="live-indicator">
          <span class="pulse-dot"></span>
          <span class="live-text">EN VIVO</span>
        </div>
      </div>
      
      <div class="live-transcript">
        <p v-if="liveText" class="live-text-content">{{ liveText }}</p>
        <p v-else class="placeholder-text">Habla al micrófono...</p>
      </div>
    </div>

    <!-- Transcripción actual acumulada -->
    <div v-if="showCurrent && currentText" class="current-section">
      <div class="section-header">
        <h3>📝 Transcripción actual:</h3>
        <div class="text-stats">
          <span class="word-count">{{ wordCount }} palabras</span>
          <span class="char-count">{{ charCount }} caracteres</span>
        </div>
      </div>
      
      <div class="current-transcript">
        <p class="current-text-content">{{ currentText }}</p>
      </div>

      <div v-if="showActions" class="current-actions">
        <button 
          @click="handleSave"
          :disabled="!currentText || isTranscribing || isLoading"
          class="action-btn save-btn"
        >
          <span v-if="isLoading">💾 Guardando...</span>
          <span v-else>💾 Guardar Transcripción</span>
        </button>
        
        <button 
          @click="handleDownload"
          :disabled="!currentText"
          class="action-btn download-btn"
        >
          📁 Descargar Texto
        </button>

        <button 
          @click="handleCopy"
          :disabled="!currentText"
          class="action-btn copy-btn"
        >
          📋 Copiar
        </button>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-if="showEmpty && !currentText && !liveText" class="empty-section">
      <div class="empty-content">
        <span class="empty-icon">🎤</span>
        <h3>Listo para transcribir</h3>
        <p>Presiona el botón de grabación para comenzar</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isTranscribing: boolean
  liveText: string
  currentText: string
  isLoading?: boolean
  showLive?: boolean
  showCurrent?: boolean
  showActions?: boolean
  showEmpty?: boolean
}

interface Emits {
  (e: 'save'): void
  (e: 'download'): void
  (e: 'copy'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  showLive: true,
  showCurrent: true,
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
</script>

<style scoped>
.transcript-display {
  @apply space-y-6;
}

/* Sección de transcripción en vivo */
.live-section {
  @apply bg-green-50 border border-green-200 rounded-lg p-4;
}

.section-header {
  @apply flex items-center justify-between mb-3;
}

.section-header h3 {
  @apply text-lg font-semibold text-gray-800 m-0;
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

.live-transcript {
  @apply bg-white border border-green-300 rounded-md p-4 min-h-[80px] max-h-[150px] overflow-y-auto;
}

.live-text-content {
  @apply text-gray-800 font-medium m-0 leading-relaxed;
}

.placeholder-text {
  @apply text-gray-500 italic m-0;
}

/* Sección de transcripción actual */
.current-section {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-4;
}

.text-stats {
  @apply flex gap-4 text-sm text-gray-600;
}

.word-count, .char-count {
  @apply bg-white px-2 py-1 rounded border;
}

.current-transcript {
  @apply bg-white border border-blue-300 rounded-md p-4 min-h-[120px] max-h-[300px] overflow-y-auto mb-4;
}

.current-text-content {
  @apply text-gray-800 leading-relaxed m-0 whitespace-pre-wrap;
}

/* Acciones */
.current-actions {
  @apply flex flex-wrap gap-3 pt-3 border-t border-blue-200;
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

.action-btn:disabled {
  @apply bg-gray-300 text-gray-500 cursor-not-allowed;
}

/* Estado vacío */
.empty-section {
  @apply bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8;
}

.empty-content {
  @apply text-center;
}

.empty-icon {
  @apply text-4xl mb-3 block;
}

.empty-content h3 {
  @apply text-xl font-semibold text-gray-700 mb-2;
}

.empty-content p {
  @apply text-gray-500 m-0;
}

/* Responsive */
@media (max-width: 640px) {
  .section-header {
    @apply flex-col items-start gap-2;
  }
  
  .text-stats {
    @apply flex-col gap-1;
  }
  
  .current-actions {
    @apply flex-col;
  }
  
  .action-btn {
    @apply w-full text-center;
  }
}

/* Scrollbar personalizado */
.live-transcript::-webkit-scrollbar,
.current-transcript::-webkit-scrollbar {
  @apply w-2;
}

.live-transcript::-webkit-scrollbar-track,
.current-transcript::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.live-transcript::-webkit-scrollbar-thumb,
.current-transcript::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded hover:bg-gray-500;
}
</style> 