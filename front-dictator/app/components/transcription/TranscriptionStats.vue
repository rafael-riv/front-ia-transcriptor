<template>
  <div class="transcription-stats">
    <div class="stats-grid">
      <div class="stat-item words-stat">
        <span class="stat-icon">📝</span>
        <div class="stat-content">
          <span class="stat-number">{{ wordCount }}</span>
          <span class="stat-label">Palabras</span>
        </div>
      </div>
      
      <div class="stat-item chars-stat">
        <span class="stat-icon">🔤</span>
        <div class="stat-content">
          <span class="stat-number">{{ characterCount }}</span>
          <span class="stat-label">Caracteres</span>
        </div>
      </div>
      
      <div class="stat-item time-stat">
        <span class="stat-icon">⏱️</span>
        <div class="stat-content">
          <span class="stat-number">{{ readingTime }}</span>
          <span class="stat-label">Lectura</span>
        </div>
      </div>
      
      <div v-if="fileInfo?.size" class="stat-item size-stat">
        <span class="stat-icon">💾</span>
        <div class="stat-content">
          <span class="stat-number">{{ formattedFileSize }}</span>
          <span class="stat-label">Archivo</span>
        </div>
      </div>
    </div>
    
    <div v-if="fileInfo?.filename" class="file-metadata">
      <div class="metadata-item">
        <span class="metadata-label">📄 Archivo:</span>
        <span class="metadata-value">{{ fileInfo.filename }}</span>
      </div>
      
      <div v-if="fileInfo.type" class="metadata-item">
        <span class="metadata-label">🎵 Tipo:</span>
        <span class="metadata-value">{{ fileInfo.type }}</span>
      </div>
      
      <div v-if="fileInfo.uploadedAt" class="metadata-item">
        <span class="metadata-label">📅 Procesado:</span>
        <span class="metadata-value">{{ formattedDate }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface FileInfo {
  filename?: string
  size?: number
  type?: string
  uploadedAt?: string
}

interface Props {
  wordCount: number
  characterCount: number
  readingTime: string
  fileInfo?: FileInfo
}

const props = withDefaults(defineProps<Props>(), {
  wordCount: 0,
  characterCount: 0,
  readingTime: '0 minutos'
})

// Computadas
const formattedFileSize = computed(() => {
  if (!props.fileInfo?.size) return 'N/A'
  
  const bytes = props.fileInfo.size
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
})

const formattedDate = computed(() => {
  if (!props.fileInfo?.uploadedAt) return 'N/A'
  
  const date = new Date(props.fileInfo.uploadedAt)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>

<style scoped>
.transcription-stats {
  @apply space-y-4;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-3;
}

.stat-item {
  @apply flex items-center gap-3 p-3 rounded-lg border;
}

.words-stat {
  @apply bg-blue-50 border-blue-200;
}

.chars-stat {
  @apply bg-green-50 border-green-200;
}

.time-stat {
  @apply bg-purple-50 border-purple-200;
}

.size-stat {
  @apply bg-orange-50 border-orange-200;
}

.stat-icon {
  @apply text-xl;
}

.stat-content {
  @apply flex flex-col min-w-0;
}

.stat-number {
  @apply text-base font-bold text-gray-800 leading-tight;
}

.stat-label {
  @apply text-xs text-gray-600 leading-tight;
}

.file-metadata {
  @apply bg-gray-50 rounded-lg p-4 space-y-2;
}

.metadata-item {
  @apply flex justify-between items-center text-sm;
}

.metadata-label {
  @apply font-medium text-gray-600;
}

.metadata-value {
  @apply font-semibold text-gray-800 truncate ml-2;
}

@media (max-width: 640px) {
  .stats-grid {
    @apply grid-cols-2;
  }
  
  .metadata-item {
    @apply flex-col items-start gap-1;
  }
  
  .metadata-value {
    @apply ml-0;
  }
}
</style> 