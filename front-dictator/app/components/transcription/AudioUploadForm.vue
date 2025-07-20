<template>
  <div class="upload-form-container">
    <div class="upload-header">
      <h3 class="upload-title">
        <FolderIcon class="w-6 h-6 inline" />
        Subir Archivo de Audio
      </h3>
      <p class="upload-description">
        Selecciona tu archivo de audio para transcribir. Formatos soportados: MP3, WAV, M4A, AAC, OGG
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="upload-form">
      <div class="file-input-container">
        <input 
          ref="fileInputRef" 
          type="file" 
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg" 
          @change="handleFileSelect"
          class="file-input" 
          id="audio-upload-input" 
          required 
        />
        <label for="audio-upload-input" class="file-label" :class="{ 'has-file': selectedFile }">
          <div class="file-label-content">
            <CheckCircleIcon v-if="selectedFile" class="file-icon w-10 h-10 text-green-500" />
            <PaperClipIcon v-else class="file-icon w-10 h-10 text-blue-500" />
            <span class="file-text">
              {{ selectedFile ? selectedFile.name : 'Arrastra tu archivo aquí o haz clic para seleccionar' }}
            </span>
            <span class="file-hint">
              Máximo 50MB • MP3, WAV, M4A, AAC, OGG
            </span>
          </div>
        </label>
      </div>

      <div v-if="selectedFile" class="file-info">
        <h4 class="file-info-title">
          <DocumentIcon class="w-5 h-5 inline mr-2" />
          Información del Archivo
        </h4>
        <div class="file-details">
          <div class="detail-row">
            <span class="detail-label">Nombre:</span>
            <span class="detail-value">{{ selectedFile.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tamaño:</span>
            <span class="detail-value">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tipo:</span>
            <span class="detail-value">{{ selectedFile.type || 'Audio' }}</span>
          </div>
        </div>
      </div>

      <div class="upload-actions">
        <button 
          type="submit" 
          :disabled="!selectedFile || isUploading" 
          class="upload-btn"
          :class="{ 'uploading': isUploading }"
        >
          <span v-if="isUploading" class="btn-content">
            <ArrowPathIcon class="btn-spinner w-5 h-5 animate-spin" />
            <span>{{ uploadStage }}</span>
          </span>
          <span v-else class="btn-content">
            <RocketLaunchIcon class="btn-icon w-5 h-5" />
            <span>Transcribir Archivo</span>
          </span>
        </button>

        <button 
          v-if="selectedFile"
          type="button"
          @click="clearSelection"
          class="clear-btn"
        >
          <TrashIcon class="w-4 h-4 mr-1" />
          Limpiar
        </button>
      </div>
    </form>

    <!-- Progress Display -->
    <TranscriptionProgress 
      v-if="isUploading"
      :progress="uploadProgress"
      :stage="uploadStage"
      :message="progressMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TranscriptionProgress from '~/components/transcription/TranscriptionProgress.vue'
import { 
  FolderIcon, 
  DocumentIcon, 
  PaperClipIcon, 
  CheckCircleIcon, 
  RocketLaunchIcon, 
  ArrowPathIcon, 
  TrashIcon 
} from '@heroicons/vue/24/outline'

interface Props {
  isUploading?: boolean
  uploadProgress?: number
  uploadStage?: string
}

interface Emits {
  (e: 'upload', file: File): void
  (e: 'error', message: string): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  isUploading: false,
  uploadProgress: 0,
  uploadStage: 'Preparando...'
})

const emit = defineEmits<Emits>()

// Estado local
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

// Computadas
const progressMessage = computed(() => {
  if (props.uploadProgress < 30) return 'Analizando archivo de audio...'
  if (props.uploadProgress < 60) return 'Aplicando reconocimiento de voz...'
  if (props.uploadProgress < 85) return 'Procesando transcripción...'
  return 'Finalizando proceso...'
})

// Métodos
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    selectedFile.value = null
    return
  }

  // Validar archivo
  const validation = validateAudioFile(file)
  if (!validation.isValid) {
    emit('error', validation.error!)
    if (target) target.value = ''
    selectedFile.value = null
    return
  }

  selectedFile.value = file
}

const handleSubmit = () => {
  if (!selectedFile.value) {
    emit('error', 'Selecciona un archivo primero')
    return
  }

  emit('upload', selectedFile.value)
}

const clearSelection = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('clear')
}

// Utilidades
const validateAudioFile = (file: File): { isValid: boolean; error?: string } => {
  // Validar tipo
  const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a']
  const isValidType = validTypes.some(type => {
    const subtype = type.split('/')[1]
    return subtype && file.type?.includes(subtype)
  }) || (file.name && file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i))

  if (!isValidType) {
    return {
      isValid: false,
      error: 'Por favor selecciona un archivo de audio válido (.mp3, .wav, .m4a, .aac, .ogg)'
    }
  }

  // Validar tamaño (máximo 50MB)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'El archivo es demasiado grande. Máximo 50MB permitido.'
    }
  }

  return { isValid: true }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Exponer métodos públicos
defineExpose({
  clearSelection,
  selectedFile: readonly(selectedFile)
})
</script>

<style scoped>
.upload-form-container {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.upload-header {
  @apply mb-6;
}

.upload-title {
  @apply text-xl font-semibold text-gray-800 mb-2;
}

.upload-description {
  @apply text-gray-600 text-sm;
}

.upload-form {
  @apply space-y-6;
}

.file-input-container {
  @apply relative;
}

.file-input {
  @apply absolute opacity-0 w-0 h-0;
}

.file-label {
  @apply block p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50;
}

.file-label.has-file {
  @apply border-green-400 bg-green-50;
}

.file-label-content {
  @apply text-center space-y-3 flex flex-col items-center;
}

.file-icon {
  @apply block;
}

.file-text {
  @apply block text-gray-700 font-medium;
}

.file-hint {
  @apply block text-sm text-gray-500;
}

.file-info {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-4;
}

.file-info-title {
  @apply text-sm font-semibold text-blue-800 mb-3;
}

.file-details {
  @apply space-y-2;
}

.detail-row {
  @apply flex justify-between items-center;
}

.detail-label {
  @apply text-sm text-blue-700 font-medium;
}

.detail-value {
  @apply text-sm text-blue-900 font-semibold;
}

.upload-actions {
  @apply flex gap-3;
}

.upload-btn {
  @apply flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed;
}

.upload-btn.uploading {
  @apply bg-gray-500 cursor-not-allowed;
}

.btn-content {
  @apply flex items-center gap-2;
}

.btn-spinner {
  @apply animate-spin;
}

.clear-btn {
  @apply px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:bg-gray-300;
}

@media (max-width: 640px) {
  .upload-actions {
    @apply flex-col;
  }
  
  .file-label {
    @apply p-6;
  }
  
  .file-icon {
    @apply text-3xl;
  }
}
</style> 