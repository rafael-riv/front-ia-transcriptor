<template>
  <div class="transcription-preview">
    <!-- Header del Preview -->
    <div class="preview-header">
      <div class="header-info">
        <h3 class="preview-title">
          📝 Vista Previa de la Transcripción
          <span class="status-badge success-badge">✅ Completada</span>
        </h3>
        <TranscriptionStats 
          :word-count="wordCount"
          :character-count="characterCount"
          :reading-time="readingTime"
          :file-info="fileInfo"
        />
      </div>
      
      <div class="header-actions">
        <button 
          @click="toggleEditMode"
          class="action-btn edit-btn"
          :class="{ 'active': isEditMode }"
          title="Editar transcripción"
        >
          {{ isEditMode ? '📖' : '✏️' }} {{ isEditMode ? 'Ver' : 'Editar' }}
        </button>
        
        <button 
          @click="$emit('new-transcription')"
          class="action-btn secondary-btn"
          title="Procesar nuevo archivo"
        >
          🔄 Nuevo Archivo
        </button>
      </div>
    </div>

    <!-- Contenido de la Transcripción -->
    <div class="preview-content">
      <div class="transcription-display">
        <div v-if="!isEditMode" class="text-viewer">
          <div class="text-container">
            <p class="transcription-text" :style="{ fontSize: `calc(1rem * ${textSize})` }">
              {{ transcriptionText }}
            </p>
          </div>
          
          <!-- Control de Zoom -->
          <div class="viewer-controls">
            <span class="control-label">Tamaño del texto:</span>
            <div class="zoom-controls">
              <button @click="decreaseTextSize" class="zoom-btn" :disabled="textSize <= 0.8">A-</button>
              <span class="zoom-indicator">{{ Math.round(textSize * 100) }}%</span>
              <button @click="increaseTextSize" class="zoom-btn" :disabled="textSize >= 1.4">A+</button>
            </div>
          </div>
        </div>

        <div v-else class="text-editor">
          <div class="editor-header">
            <span class="editor-label">✏️ Editando transcripción</span>
            <div class="editor-controls">
              <button @click="revertChanges" class="control-btn" :disabled="!hasChanges">
                ↺ Revertir
              </button>
              <button @click="saveChanges" class="control-btn save-btn" :disabled="!hasChanges">
                ✅ Aplicar Cambios
              </button>
            </div>
          </div>
          
          <textarea
            v-model="editableText"
            class="text-editor-input"
            placeholder="Edita la transcripción aquí..."
            rows="15"
            @input="onTextChange"
          ></textarea>
          
          <div class="editor-info">
            <span class="change-indicator" v-if="hasChanges">
              ⚠️ Hay cambios sin aplicar
            </span>
            <span class="word-counter">
              {{ editableWordCount }} palabras • {{ editableText.length }} caracteres
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones de la Transcripción -->
    <TranscriptionActions
      :transcription="transcriptionData"
      :is-loading="isLoading"
      :can-save="canSave"
      @save="handleSave"
      @download="handleDownload"
      @download-json="handleDownloadJson"
      @copy="handleCopy"
      @share="handleShare"
      @delete="handleDelete"
    />

    <!-- Modal de Confirmación -->
    <ConfirmModal
      v-if="showDeleteModal"
      title="🗑️ Confirmar Eliminación"
      message="¿Estás seguro de que quieres eliminar esta transcripción? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      danger
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TranscriptionStats from '~/components/transcription/TranscriptionStats.vue'
import TranscriptionActions from '~/components/transcription/TranscriptionActions.vue'
import ConfirmModal from '~/components/ui/ConfirmModal.vue'

export interface TranscriptionData {
  text: string
  filename?: string
  uploadedAt?: string
  fileSize?: number
  fileType?: string
  [key: string]: any
}

interface Props {
  transcription: TranscriptionData
  isLoading?: boolean
  canSave?: boolean
}

interface Emits {
  (e: 'save', transcription: TranscriptionData): void
  (e: 'download', transcription: TranscriptionData): void
  (e: 'download-json', transcription: TranscriptionData): void
  (e: 'copy', text: string): void
  (e: 'share', transcription: TranscriptionData): void
  (e: 'delete'): void
  (e: 'new-transcription'): void
  (e: 'text-changed', newText: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  canSave: true
})

const emit = defineEmits<Emits>()

// Estado local
const isEditMode = ref(false)
const editableText = ref('')
const textSize = ref(1.0)
const showDeleteModal = ref(false)

// Computadas
const transcriptionText = computed(() => props.transcription.text || '')

const transcriptionData = computed(() => ({
  ...props.transcription,
  text: isEditMode.value ? editableText.value : transcriptionText.value
}))

const wordCount = computed(() => {
  const text = transcriptionText.value
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => transcriptionText.value.length)

const readingTime = computed(() => {
  const words = wordCount.value
  const wordsPerMinute = 200
  const minutes = Math.ceil(words / wordsPerMinute)
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`
})

const fileInfo = computed(() => ({
  filename: props.transcription.filename,
  size: props.transcription.fileSize,
  type: props.transcription.fileType,
  uploadedAt: props.transcription.uploadedAt
}))

const editableWordCount = computed(() => {
  if (!editableText.value.trim()) return 0
  return editableText.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const hasChanges = computed(() => {
  return editableText.value !== transcriptionText.value
})

// Watchers
watch(() => props.transcription.text, (newText) => {
  if (!isEditMode.value) {
    editableText.value = newText || ''
  }
}, { immediate: true })

// Métodos
const toggleEditMode = () => {
  if (isEditMode.value && hasChanges.value) {
    if (!confirm('¿Descartar los cambios sin aplicar?')) return
  }
  
  isEditMode.value = !isEditMode.value
  if (isEditMode.value) {
    editableText.value = transcriptionText.value
  }
}

const increaseTextSize = () => {
  if (textSize.value < 1.4) {
    textSize.value = Math.min(1.4, textSize.value + 0.1)
  }
}

const decreaseTextSize = () => {
  if (textSize.value > 0.8) {
    textSize.value = Math.max(0.8, textSize.value - 0.1)
  }
}

const onTextChange = () => {
  // Emitir cambio de texto para sincronización con el padre si es necesario
  if (hasChanges.value) {
    emit('text-changed', editableText.value)
  }
}

const revertChanges = () => {
  editableText.value = transcriptionText.value
}

const saveChanges = () => {
  if (hasChanges.value) {
    // Actualizar la transcripción con el nuevo texto
    const updatedTranscription = {
      ...props.transcription,
      text: editableText.value
    }
    emit('save', updatedTranscription)
    isEditMode.value = false
  }
}

// Handlers de acciones
const handleSave = () => {
  emit('save', transcriptionData.value)
}

const handleDownload = () => {
  emit('download', transcriptionData.value)
}

const handleDownloadJson = () => {
  emit('download-json', transcriptionData.value)
}

const handleCopy = () => {
  emit('copy', transcriptionData.value.text)
}

const handleShare = () => {
  emit('share', transcriptionData.value)
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const confirmDelete = () => {
  showDeleteModal.value = false
  emit('delete')
}
</script>

<style scoped>
.transcription-preview {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden;
}

.preview-header {
  @apply bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6 flex justify-between items-start;
}

.header-info {
  @apply flex-1;
}

.preview-title {
  @apply text-xl font-semibold text-green-800 mb-3 flex items-center gap-2;
}

.status-badge {
  @apply px-3 py-1 rounded-full text-sm font-medium;
}

.success-badge {
  @apply bg-green-100 text-green-700;
}

.header-actions {
  @apply flex gap-3;
}

.action-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 border;
}

.edit-btn {
  @apply bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100;
}

.edit-btn.active {
  @apply bg-blue-500 text-white border-blue-500;
}

.secondary-btn {
  @apply bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200;
}

.preview-content {
  @apply p-6;
}

.transcription-display {
  @apply space-y-4;
}

.text-viewer {
  @apply space-y-4;
}

.text-container {
  @apply bg-gray-50 rounded-lg p-6 border border-gray-200 min-h-[300px] max-h-[500px] overflow-y-auto;
}

.transcription-text {
  @apply text-gray-800 leading-relaxed whitespace-pre-wrap;
  font-size: calc(1rem * var(--text-size, 1));
}

.viewer-controls {
  @apply flex justify-between items-center pt-4 border-t border-gray-200;
}

.control-label {
  @apply text-sm font-medium text-gray-600;
}

.zoom-controls {
  @apply flex items-center gap-3;
}

.zoom-btn {
  @apply w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed;
}

.zoom-indicator {
  @apply text-sm font-medium text-gray-600 min-w-[3rem] text-center;
}

.text-editor {
  @apply space-y-4;
}

.editor-header {
  @apply flex justify-between items-center pb-4 border-b border-gray-200;
}

.editor-label {
  @apply text-sm font-medium text-blue-700;
}

.editor-controls {
  @apply flex gap-2;
}

.control-btn {
  @apply px-3 py-1 text-sm rounded border;
}

.control-btn:not(.save-btn) {
  @apply bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.save-btn {
  @apply bg-green-100 text-green-700 border-green-200 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.text-editor-input {
  @apply w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm leading-relaxed;
}

.editor-info {
  @apply flex justify-between items-center text-sm;
}

.change-indicator {
  @apply text-orange-600 font-medium;
}

.word-counter {
  @apply text-gray-500;
}

@media (max-width: 768px) {
  .preview-header {
    @apply flex-col gap-4;
  }
  
  .header-actions {
    @apply w-full justify-center;
  }
  
  .viewer-controls {
    @apply flex-col gap-3;
  }
  
  .editor-header {
    @apply flex-col gap-3;
  }
  
  .editor-info {
    @apply flex-col items-start gap-2;
  }
}
</style> 