<template>
  <div class="transcription-page">
    <Header />

    <!-- Main Content -->
    <main class="page-main">
      <div class="page-container">
        <!-- Sección de Upload o Vista Previa -->
        <section class="main-section">
          <!-- Formulario de Upload -->
          <AudioUploadForm
            v-if="!hasTranscription"
            :is-uploading="uploadProgress.isUploading"
            :upload-progress="uploadProgress.progress"
            :upload-stage="uploadProgress.stage"
            @upload="handleFileUpload"
            @error="showNotification"
            @clear="clearCurrentTranscription"
          />

          <!-- Vista Previa de Transcripción -->
          <TranscriptionPreview
            v-if="hasTranscription && currentTranscription"
            :transcription="currentTranscription"
            :is-loading="isLoading"
            :can-save="canSave"
            @save="handleSaveTranscription"
            @download="handleDownloadTxt"
            @download-json="handleDownloadJson"
            @copy="handleCopyText"
            @share="handleShareTranscription"
            @delete="handleDeleteTranscription"
            @new-transcription="clearCurrentTranscription"
            @text-changed="handleTextChanged"
          />
        </section>

        <!-- Sección de Transcripciones Recientes -->
        <section v-if="!hasTranscription" class="recent-section">
          <RecentTranscriptions
            @refresh="showNotification('Lista actualizada', 'success')"
          />
        </section>
      </div>
    </main>

    <!-- Modal de Éxito -->
    <SuccessModal
      v-if="showSuccessModal"
      :title="successModalData.title"
      :message="successModalData.message"
      :actions="successModalData.actions"
      @close="closeSuccessModal"
      @action="handleSuccessAction"
    />

    <!-- Notificaciones Toast -->
    <NotificationToast
      v-if="notification"
      :message="notification.message"
      :type="notification.type"
      @close="closeNotification"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Header from '~/components/header/Header.vue'
import AudioUploadForm from '../components/transcription/AudioUploadForm.vue'
import TranscriptionPreview from '~/components/transcription/TranscriptionPreview.vue'
import RecentTranscriptions from '../components/transcription/RecentTranscriptions.vue'
import SuccessModal from '../components/ui/SuccessModal.vue'
import NotificationToast from '../components/ui/NotificationToast.vue'
import { useFileTranscription } from '~/composables/useFileTranscription'
import type { TranscriptionData } from '~/components/transcription/TranscriptionPreview.vue'

// Middleware para proteger la ruta
definePageMeta({
  middleware: 'authenticated'
})

// Estado de notificaciones
const notification = ref<{ message: string; type: string } | null>(null)
const showSuccessModal = ref(false)
const successModalData = ref({
  title: '',
  message: '',
  actions: [] as Array<{ label: string; action: string; primary?: boolean }>
})

// Inicializar composable de transcripción
const transcriptionManager = useFileTranscription({
  onSuccess: (message: string) => showNotification(message, 'success'),
  onError: (error: string) => showNotification(error, 'error')
})

// Destructurar métodos y estado del composable
const {
  currentTranscription,
  uploadProgress,
  isLoading,
  uploadAndTranscribe,
  saveToHistory,
  downloadTranscription,
  copyToClipboard,
  shareTranscription,
  clearTranscription,
  updateTranscription,
  hasTranscription: hasTranscriptionFn,
  canSave
} = transcriptionManager

// Computadas adicionales
const hasTranscription = computed(() => hasTranscriptionFn())

const pageTitle = computed(() => {
  return hasTranscription.value ? 'Vista Previa de Transcripción' : 'Transcribir Archivo de Audio'
})

// Manejadores de eventos principales
const handleFileUpload = async (file: File) => {
  const success = await uploadAndTranscribe(file)
  if (success) {
    // La notificación de éxito ya se maneja en el composable
  }
}

const handleSaveTranscription = async (transcription: TranscriptionData) => {
  const success = await saveToHistory(transcription)
  if (success) {
    showSuccessModal.value = true
    successModalData.value = {
      title: '🎉 ¡Transcripción Guardada!',
      message: 'Tu transcripción ha sido guardada exitosamente en el historial permanente.',
      actions: [
        { label: '📚 Ver en Historial', action: 'view-history', primary: true },
        { label: '✅ Continuar', action: 'continue' }
      ]
    }
  }
}

const handleDownloadTxt = (transcription: TranscriptionData) => {
  downloadTranscription(transcription, 'txt')
}

const handleDownloadJson = (transcription: TranscriptionData) => {
  downloadTranscription(transcription, 'json')
}

const handleCopyText = async (text: string) => {
  await copyToClipboard(text)
}

const handleShareTranscription = async (transcription: TranscriptionData) => {
  await shareTranscription(transcription)
}

const handleDeleteTranscription = () => {
  clearCurrentTranscription()
  showNotification('Transcripción eliminada', 'info')
}

const handleTextChanged = (newText: string) => {
  updateTranscription({ text: newText })
}

const clearCurrentTranscription = () => {
  clearTranscription()
}

// Manejadores de modales y notificaciones
const showNotification = (message: string, type: string = 'info') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 4000)
}

const closeNotification = () => {
  notification.value = null
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
}

const handleSuccessAction = (action: string) => {
  switch (action) {
    case 'view-history':
      navigateTo('/history')
      break
    case 'continue':
      closeSuccessModal()
      break
  }
}

// SEO y meta tags
useHead({
  title: pageTitle,
  meta: [
    {
      name: 'description',
      content: 'Transcribe archivos de audio a texto usando inteligencia artificial. Sube tu archivo y obtén una transcripción precisa al instante.'
    }
  ]
})
</script>

<style scoped>
.transcription-page {
  @apply min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100;
}

.page-main {
  @apply pt-6 pb-12;
}

.page-container {
  @apply max-w-6xl mx-auto px-4 space-y-8;
}

.main-section {
  @apply relative;
}

.recent-section {
  @apply mt-8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    @apply px-3 space-y-6;
  }
  
  .page-main {
    @apply pt-4 pb-8;
  }
}

/* Animaciones suaves */
.main-section {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Estados de carga */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl;
}

.loading-spinner {
  @apply animate-spin text-4xl;
}

/* Transiciones entre estados */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Layout Grid */
@media (min-width: 1024px) {
  .page-container {
    @apply grid grid-cols-1 gap-8;
  }
  
  .main-section {
    @apply col-span-1;
  }
  
  .recent-section {
    @apply col-span-1 mt-0;
  }
}
</style>