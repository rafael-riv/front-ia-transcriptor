<template>
  <div class="transcription-item">
    <div class="transcription-header">
      <div class="transcription-title">
        <h4>
          {{ displayName }}
          <span v-if="!item._id" class="temp-badge">📝 Temporal</span>
          <span v-else class="saved-badge">💾 Guardado</span>
        </h4>
        <span class="transcription-date">{{ item.timestamp }}</span>
      </div>
      
      <div class="item-controls">
        <button 
          v-if="!item._id" 
          @click="handleSave"
          class="btn-save-small"
          title="Guardar en el servidor"
          :disabled="isLoading"
        >
          <span v-if="isLoading">⏳</span>
          <span v-else>💾</span>
          Guardar
        </button>
        
        <button 
          @click="handleCopy"
          class="btn-copy-small" 
          title="Copiar al portapapeles"
          :disabled="!item.text"
        >
          📋 Copiar
        </button>
        
        <button 
          @click="handleDownload"
          class="btn-download-small" 
          title="Descargar como archivo"
        >
          📁 Descargar
        </button>
        
        <button 
          @click="handleDelete"
          class="btn-delete"
          :title="item._id ? 'Eliminar del servidor' : 'Eliminar localmente'"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
    
    <div class="transcription-meta">
      <span class="duration-info">⏱️ {{ item.duration }}</span>
      <span v-if="item._id" class="server-info">🌐 En servidor</span>
      <span v-else class="local-info">💻 Solo local</span>
      <span v-if="wordCount > 0" class="word-count-info">📝 {{ wordCount }} palabras</span>
    </div>
    
    <div class="transcription-content">
      <div v-if="item.text" class="text-container">
        <p class="text-content" :class="{ 'expanded': isExpanded }">{{ item.text }}</p>
        
        <button 
          v-if="isLongText"
          @click="toggleExpanded"
          class="expand-btn"
        >
          {{ isExpanded ? 'Mostrar menos' : 'Mostrar más' }}
        </button>
      </div>
      
      <div v-else class="no-transcription">
        ⚠️ Transcripción no disponible
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TranscriptionItem } from '~/composables/useTranscriptionHistory'

interface Props {
  item: TranscriptionItem
  index: number
  isLoading?: boolean
}

interface Emits {
  (e: 'save', item: TranscriptionItem): void
  (e: 'copy', text: string): void
  (e: 'download', item: TranscriptionItem): void
  (e: 'delete', id: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const isExpanded = ref(false)

// Computadas
const displayName = computed(() => {
  return props.item.filename || `Transcripción #${props.index + 1}`
})

const wordCount = computed(() => {
  if (!props.item.text) return 0
  return props.item.text.trim().split(/\s+/).filter(word => word.length > 0).length
})

const isLongText = computed(() => {
  return props.item.text && props.item.text.length > 200
})

// Métodos
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const handleSave = () => {
  emit('save', props.item)
}

const handleCopy = () => {
  if (props.item.text) {
    emit('copy', props.item.text)
  }
}

const handleDownload = () => {
  emit('download', props.item)
}

const handleDelete = () => {
  emit('delete', props.item.id)
}
</script>

<style scoped>
.transcription-item {
  @apply border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200;
}

.transcription-header {
  @apply flex justify-between items-start mb-3 pb-3 border-b border-gray-100;
}

.transcription-title {
  @apply flex-1 min-w-0;
}

.transcription-title h4 {
  @apply text-lg font-semibold text-gray-800 m-0 mb-1 flex items-center gap-2 flex-wrap;
}

.transcription-date {
  @apply text-sm text-gray-500;
}

.item-controls {
  @apply flex gap-2 flex-wrap;
}

.transcription-meta {
  @apply flex flex-wrap gap-3 mb-3 text-sm;
}

.duration-info,
.server-info,
.local-info,
.word-count-info {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.duration-info {
  @apply bg-gray-100 text-gray-700;
}

.server-info {
  @apply bg-blue-100 text-blue-700;
}

.local-info {
  @apply bg-yellow-100 text-yellow-700;
}

.word-count-info {
  @apply bg-green-100 text-green-700;
}

.transcription-content {
  @apply bg-gray-50 rounded-md p-3;
}

.text-container {
  @apply relative;
}

.text-content {
  @apply text-gray-800 leading-relaxed m-0 whitespace-pre-wrap;
}

.text-content:not(.expanded) {
  @apply line-clamp-3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-btn {
  @apply mt-2 text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer text-sm font-medium;
}

.no-transcription {
  @apply text-red-600 italic text-center py-2;
}

/* Badges */
.temp-badge {
  @apply bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold;
}

.saved-badge {
  @apply bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold;
}

/* Botones */
.btn-save-small,
.btn-copy-small,
.btn-download-small,
.btn-delete {
  @apply px-2 py-1 rounded text-xs font-medium transition-colors duration-200 border-none cursor-pointer;
}

.btn-save-small {
  @apply bg-purple-100 text-purple-700 hover:bg-purple-200;
}

.btn-copy-small {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
}

.btn-download-small {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.btn-delete {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

.btn-save-small:disabled,
.btn-copy-small:disabled,
.btn-download-small:disabled,
.btn-delete:disabled {
  @apply bg-gray-100 text-gray-400 cursor-not-allowed;
}

/* Responsive */
@media (max-width: 640px) {
  .transcription-header {
    @apply flex-col gap-3;
  }
  
  .item-controls {
    @apply w-full justify-start;
  }
  
  .transcription-meta {
    @apply flex-col gap-1;
  }
  
  .btn-save-small,
  .btn-copy-small,
  .btn-download-small,
  .btn-delete {
    @apply flex-1 text-center min-w-0;
  }
}

/* Animaciones */
.transcription-item:hover {
  @apply transform scale-[1.01];
}

.item-controls button:hover {
  @apply transform scale-105;
}
</style> 