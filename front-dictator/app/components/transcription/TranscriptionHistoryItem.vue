<template>
  <div class="transcription-item" :class="{ 'is-loading': isLoading }">
    <!-- Header principal -->
    <div class="item-header">
      <div class="header-left">
        <div class="title-section">
          <h4 class="item-title">
            {{ displayName }}
            <span v-if="!item._id" class="status-badge temp-badge">📝 Temporal</span>
            <span v-else class="status-badge saved-badge">💾 Guardado</span>
          </h4>
          <span class="item-date">{{ formattedDate }}</span>
        </div>
      </div>
      
      <div class="header-right">
        <div class="quick-actions">
          <button 
            v-if="!item._id" 
            @click="handleSave"
            class="quick-btn save-quick-btn"
            title="Guardar en servidor"
            :disabled="isLoading"
          >
            <span v-if="isLoading">⏳</span>
            <span v-else>💾</span>
          </button>
          
          <button 
            @click="handleCopy"
            class="quick-btn copy-quick-btn" 
            title="Copiar al portapapeles"
            :disabled="!item.text"
          >
            📋
          </button>
          
          <button 
            @click="toggleExpanded"
            class="quick-btn expand-quick-btn"
            :title="isExpanded ? 'Contraer' : 'Expandir'"
          >
            {{ isExpanded ? '⬆️' : '⬇️' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Estadísticas principales -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card words-stat">
          <span class="stat-icon">📝</span>
          <div class="stat-content">
            <span class="stat-number">{{ wordCount }}</span>
            <span class="stat-label">Palabras</span>
          </div>
        </div>
        
        <div class="stat-card chars-stat">
          <span class="stat-icon">🔤</span>
          <div class="stat-content">
            <span class="stat-number">{{ characterCount }}</span>
            <span class="stat-label">Caracteres</span>
          </div>
        </div>
        
        <div class="stat-card duration-stat">
          <span class="stat-icon">⏱️</span>
          <div class="stat-content">
            <span class="stat-number">{{ durationText }}</span>
            <span class="stat-label">Duración</span>
          </div>
        </div>
        
        <div class="stat-card size-stat">
          <span class="stat-icon">📊</span>
          <div class="stat-content">
            <span class="stat-number">{{ readingTime }}</span>
            <span class="stat-label">Lectura</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Información adicional -->
    <div class="meta-section">
      <div class="meta-badges">
        <span v-if="item._id" class="meta-badge server-badge">
          🌐 En servidor
        </span>
        <span v-else class="meta-badge local-badge">
          💻 Solo local
        </span>
        
        <span class="meta-badge type-badge">
          {{ textTypeInfo }}
        </span>
        
        <span v-if="isSavedRecently" class="meta-badge recent-badge">
          ✨ Reciente
        </span>
      </div>
    </div>

    <!-- Contenido de la transcripción -->
    <div class="content-section">
      <div v-if="item.text" class="text-container">
        <div class="text-preview">
          <p class="text-content" :class="{ 'expanded': isExpanded }">
            {{ item.text }}
          </p>
          
          <div v-if="isLongText" class="text-controls">
            <button 
              @click="toggleExpanded"
              class="expand-text-btn"
            >
              {{ isExpanded ? 'Mostrar menos' : `Mostrar más (+${hiddenCharacters} caracteres)` }}
            </button>
            
            <div class="text-progress">
              <div 
                class="progress-bar" 
                :style="{ width: `${readingProgress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-content">
        <span class="no-content-icon">⚠️</span>
        <span class="no-content-text">Transcripción no disponible</span>
      </div>
    </div>

    <!-- Acciones principales -->
    <div v-if="isExpanded" class="actions-section">
      <div class="action-groups">
        <!-- Grupo de Archivo -->
        <div class="action-group file-group">
          <span class="group-label">📁 Archivo:</span>
          <div class="group-buttons">
            <button 
              @click="handleDownload"
              class="action-btn download-btn"
              title="Descargar como archivo de texto"
            >
              📁 Descargar TXT
            </button>
            
            <button 
              @click="handleDownloadJson"
              class="action-btn download-json-btn"
              title="Descargar con metadatos"
            >
              📋 Descargar JSON
            </button>
          </div>
        </div>
        
        <!-- Grupo de Compartir -->
        <div class="action-group share-group">
          <span class="group-label">📤 Compartir:</span>
          <div class="group-buttons">
            <button 
              @click="handleCopy"
              class="action-btn copy-btn"
              :disabled="!item.text"
              title="Copiar texto al portapapeles"
            >
              📋 Copiar
            </button>
            
            <button 
              @click="handleShareLink"
              class="action-btn share-btn"
              title="Generar enlace para compartir"
              :disabled="!item._id"
            >
              🔗 Enlace
            </button>
          </div>
        </div>
        
        <!-- Grupo de Gestión -->
        <div class="action-group manage-group">
          <span class="group-label">🛠️ Gestión:</span>
          <div class="group-buttons">
            <button 
              v-if="!item._id"
              @click="handleSave"
              class="action-btn save-btn"
              title="Guardar en servidor permanentemente"
              :disabled="isLoading"
            >
              <span v-if="isLoading">⏳ Guardando...</span>
              <span v-else>💾 Guardar</span>
            </button>
            
            <button 
              v-else
              @click="handleUpdate"
              class="action-btn update-btn"
              title="Actualizar transcripción"
              :disabled="isLoading"
            >
              🔄 Actualizar
            </button>
            
            <button 
              @click="handleDuplicate"
              class="action-btn duplicate-btn"
              title="Crear una copia"
            >
              📄 Duplicar
            </button>
            
            <button 
              @click="handleDelete"
              class="action-btn delete-btn"
              :title="item._id ? 'Eliminar del servidor' : 'Eliminar localmente'"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de carga -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">⏳</div>
        <span class="loading-text">Procesando...</span>
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
  (e: 'downloadJson', item: TranscriptionItem): void
  (e: 'share', item: TranscriptionItem): void
  (e: 'update', item: TranscriptionItem): void
  (e: 'duplicate', item: TranscriptionItem): void
  (e: 'delete', id: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const isExpanded = ref(false)

// Computadas principales
const displayName = computed(() => {
  return props.item.filename || `Transcripción #${props.index + 1}`
})

const formattedDate = computed(() => {
  return props.item.timestamp || 'Sin fecha'
})

const wordCount = computed(() => {
  if (!props.item.text) return 0
  return props.item.text.trim().split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
  return props.item.text?.length || 0
})

const durationText = computed(() => {
  if (props.item.duration && props.item.duration !== 'Guardado') {
    return props.item.duration
  }
  
  if (props.item.startTime && props.item.endTime) {
    const start = new Date(props.item.startTime)
    const end = new Date(props.item.endTime)
    const diffSeconds = Math.round((end.getTime() - start.getTime()) / 1000)
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s`
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60)
      const seconds = diffSeconds % 60
      return `${minutes}m ${seconds}s`
    } else {
      const hours = Math.floor(diffSeconds / 3600)
      const minutes = Math.floor((diffSeconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }
  
  return 'N/A'
})

const readingTime = computed(() => {
  // Promedio de 200 palabras por minuto
  const wordsPerMinute = 200
  const minutes = Math.ceil(wordCount.value / wordsPerMinute)
  
  if (minutes < 1) return '< 1min'
  if (minutes === 1) return '1min'
  return `${minutes}min`
})

const isLongText = computed(() => {
  return props.item.text && props.item.text.length > 300
})

const hiddenCharacters = computed(() => {
  if (!isLongText.value || isExpanded.value) return 0
  return props.item.text!.length - 300
})

const readingProgress = computed(() => {
  if (!isLongText.value) return 100
  if (isExpanded.value) return 100
  return Math.round((300 / props.item.text!.length) * 100)
})

const textTypeInfo = computed(() => {
  const chars = characterCount.value
  
  if (chars === 0) return 'Vacío'
  if (chars < 100) return 'Corto'
  if (chars < 500) return 'Medio'
  if (chars < 2000) return 'Largo'
  return 'Muy largo'
})

const isSavedRecently = computed(() => {
  if (!props.item.startTime) return false
  
  const now = new Date()
  const itemDate = new Date(props.item.startTime)
  const diffHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60)
  
  return diffHours < 24 // Últimas 24 horas
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

const handleDownloadJson = () => {
  const jsonData = {
    ...props.item,
    metadata: {
      wordCount: wordCount.value,
      characterCount: characterCount.value,
      readingTime: readingTime.value,
      textType: textTypeInfo.value,
      exportedAt: new Date().toISOString()
    }
  }
  
  emit('downloadJson', jsonData as any)
}

const handleShareLink = () => {
  emit('share', props.item)
}

const handleUpdate = () => {
  emit('update', props.item)
}

const handleDuplicate = () => {
  emit('duplicate', props.item)
}

const handleDelete = () => {
  emit('delete', props.item.id)
}
</script>

<style scoped>
.transcription-item {
  @apply relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden;
}

.transcription-item.is-loading {
  @apply opacity-75;
}

.item-header {
  @apply flex justify-between items-start p-6 pb-4 border-b border-gray-100;
}

.header-left {
  @apply flex-1 min-w-0;
}

.title-section {
  @apply space-y-1;
}

.item-title {
  @apply text-lg font-semibold text-gray-800 m-0 flex items-center gap-2 flex-wrap;
}

.status-badge {
  @apply px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1;
}

.temp-badge {
  @apply bg-yellow-100 text-yellow-800 border border-yellow-200;
}

.saved-badge {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.item-date {
  @apply text-sm text-gray-500 font-medium;
}

.header-right {
  @apply flex-shrink-0;
}

.quick-actions {
  @apply flex gap-1;
}

.quick-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-sm;
}

.save-quick-btn {
  @apply bg-purple-50 border-purple-200 hover:bg-purple-100;
}

.copy-quick-btn {
  @apply bg-blue-50 border-blue-200 hover:bg-blue-100;
}

.expand-quick-btn {
  @apply bg-gray-50 border-gray-200 hover:bg-gray-100;
}

.stats-section {
  @apply px-6 py-4;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-3;
}

.stat-card {
  @apply flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100;
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

.words-stat {
  @apply bg-blue-50 border-blue-100;
}

.chars-stat {
  @apply bg-green-50 border-green-100;
}

.duration-stat {
  @apply bg-purple-50 border-purple-100;
}

.size-stat {
  @apply bg-orange-50 border-orange-100;
}

.meta-section {
  @apply px-6 py-3 bg-gray-50 border-t border-gray-100;
}

.meta-badges {
  @apply flex flex-wrap gap-2;
}

.meta-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.server-badge {
  @apply bg-blue-100 text-blue-700;
}

.local-badge {
  @apply bg-yellow-100 text-yellow-700;
}

.type-badge {
  @apply bg-gray-100 text-gray-700;
}

.recent-badge {
  @apply bg-green-100 text-green-700;
}

.content-section {
  @apply px-6 py-4;
}

.text-container {
  @apply space-y-3;
}

.text-preview {
  @apply space-y-2;
}

.text-content {
  @apply text-gray-800 leading-relaxed m-0 whitespace-pre-wrap;
}

.text-content:not(.expanded) {
  @apply line-clamp-4;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-controls {
  @apply space-y-2;
}

.expand-text-btn {
  @apply text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer text-sm font-medium transition-colors;
}

.text-progress {
  @apply w-full h-1 bg-gray-200 rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.no-content {
  @apply flex items-center justify-center gap-2 py-8 text-gray-500;
}

.no-content-icon {
  @apply text-2xl;
}

.no-content-text {
  @apply font-medium;
}

.actions-section {
  @apply px-6 py-4 bg-gray-50 border-t border-gray-100;
}

.action-groups {
  @apply space-y-4;
}

.action-group {
  @apply space-y-2;
}

.group-label {
  @apply text-sm font-semibold text-gray-700;
}

.group-buttons {
  @apply flex flex-wrap gap-2;
}

.action-btn {
  @apply px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border cursor-pointer;
}

.download-btn {
  @apply bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200;
}

.download-json-btn {
  @apply bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100;
}

.copy-btn {
  @apply bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100;
}

.share-btn {
  @apply bg-green-50 text-green-700 border-green-200 hover:bg-green-100;
}

.save-btn {
  @apply bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100;
}

.update-btn {
  @apply bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100;
}

.duplicate-btn {
  @apply bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100;
}

.delete-btn {
  @apply bg-red-50 text-red-700 border-red-200 hover:bg-red-100;
}

.action-btn:disabled {
  @apply bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed;
}

.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center;
}

.loading-content {
  @apply flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200;
}

.loading-spinner {
  @apply text-xl animate-pulse;
}

.loading-text {
  @apply text-sm font-medium text-gray-600;
}

/* Responsive */
@media (max-width: 768px) {
  .item-header {
    @apply flex-col gap-3;
  }
  
  .quick-actions {
    @apply w-full justify-center;
  }
  
  .stats-grid {
    @apply grid-cols-2;
  }
  
  .action-groups {
    @apply space-y-3;
  }
  
  .group-buttons {
    @apply grid grid-cols-2 gap-2;
  }
  
  .action-btn {
    @apply text-center;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    @apply grid-cols-1;
  }
  
  .group-buttons {
    @apply grid-cols-1;
  }
}

/* Animaciones */
.transcription-item:hover {
  @apply transform scale-[1.01];
}

.quick-btn:hover, .action-btn:hover {
  @apply transform scale-105;
}

.text-content {
  @apply transition-all duration-300;
}
</style> 