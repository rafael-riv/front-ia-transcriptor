<template>
  <div class="recent-transcriptions">
    <div class="section-header">
      <h2 class="section-title">
        <ClipboardDocumentListIcon class="w-6 h-6 inline mr-2" />
        Transcripciones Recientes
      </h2>
      <div class="header-actions">
        <button 
          @click="refreshList"
          :disabled="isLoading"
          class="refresh-btn"
          title="Actualizar lista"
        >
          <ArrowPathIcon v-if="isLoading" class="w-4 h-4 animate-spin mr-1" />
          <ArrowPathIcon v-else class="w-4 h-4 mr-1" />
          Actualizar
        </button>
        
        <NuxtLink to="/history" class="history-link">
          <BookOpenIcon class="w-4 h-4 mr-1" />
          Ver Todo el Historial
        </NuxtLink>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <ArrowPathIcon class="loading-spinner w-12 h-12 animate-spin" />
      <p>Cargando transcripciones recientes...</p>
    </div>

    <div v-else-if="transcriptions.length === 0" class="empty-state">
      <InboxIcon class="empty-icon w-16 h-16 text-gray-400" />
      <h3>No hay transcripciones recientes</h3>
      <p class="empty-subtitle">
        Las transcripciones que proceses aparecerán aquí
      </p>
    </div>

    <div v-else class="transcriptions-list">
      <div 
        v-for="transcription in displayedTranscriptions"
        :key="transcription._id"
        class="transcription-item"
      >
        <div class="item-header">
          <h4 class="item-title">{{ transcription.filename || 'Audio sin nombre' }}</h4>
          <span class="item-date">{{ formatDate(transcription.createdAt) }}</span>
        </div>
        
        <div class="item-preview">
          <p class="preview-text">
            "{{ truncateText(transcription.text, 120) }}"
          </p>
        </div>
        
        <div class="item-stats">
          <span class="stat">
            <DocumentTextIcon class="w-4 h-4 inline mr-1" />
            {{ getWordCount(transcription.text) }} palabras
          </span>
          <span class="stat">
            <LanguageIcon class="w-4 h-4 inline mr-1" />
            {{ transcription.text?.length || 0 }} caracteres
          </span>
        </div>
        
        <div class="item-actions">
          <button 
            @click="copyText(transcription.text)"
            class="action-btn copy-btn"
            title="Copiar"
          >
            <ClipboardDocumentIcon class="w-4 h-4 mr-1" />
            Copiar
          </button>
          <button 
            @click="downloadTranscription(transcription)"
            class="action-btn download-btn"
            title="Descargar"
          >
            <FolderArrowDownIcon class="w-4 h-4 mr-1" />
            Descargar
          </button>
          <button 
            @click="viewInHistory(transcription._id)"
            class="action-btn view-btn"
            title="Ver en historial"
          >
            <EyeIcon class="w-4 h-4 mr-1" />
            Ver Detalles
          </button>
        </div>
      </div>
    </div>

    <div v-if="transcriptions.length > maxDisplayed" class="section-footer">
      <NuxtLink to="/history" class="view-all-link">
        Ver todas las transcripciones ({{ transcriptions.length }}) →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  BookOpenIcon,
  InboxIcon,
  DocumentTextIcon,
  LanguageIcon,
  ClipboardDocumentIcon,
  FolderArrowDownIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

interface Transcription {
  _id: string
  text: string
  filename?: string
  createdAt: string
  [key: string]: any
}

interface Emits {
  (e: 'refresh'): void
}

const emit = defineEmits<Emits>()

// Estado reactivo
const transcriptions = ref<Transcription[]>([])
const isLoading = ref(false)
const maxDisplayed = 5

// Computadas
const displayedTranscriptions = computed(() => {
  return transcriptions.value.slice(0, maxDisplayed)
})

// Lifecycle
onMounted(() => {
  loadTranscriptions()
})

// Métodos
const loadTranscriptions = async () => {
  isLoading.value = true

  try {
    const token = localStorage.getItem('auth-token')
    const config = useRuntimeConfig()
    const backendUrl = config.public.backendUrl

    const response = await $fetch(`${backendUrl}/api/history?limit=10&sortBy=newest`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }) as any

    transcriptions.value = response.data || []

  } catch (error) {
    console.error('Failed to load recent transcriptions:', error)
    transcriptions.value = []
  } finally {
    isLoading.value = false
  }
}

const refreshList = async () => {
  await loadTranscriptions()
  emit('refresh')
}

const copyText = async (text: string) => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    // Aquí podrías emitir un evento para mostrar notificación
  } catch (error) {
    console.error('Error copying text:', error)
  }
}

const downloadTranscription = (transcription: Transcription) => {
  if (!transcription.text) return

  const blob = new Blob([transcription.text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${transcription.filename || 'transcripcion'}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const viewInHistory = (id: string) => {
  navigateTo(`/history?highlight=${id}`)
}

// Utilidades
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getWordCount = (text: string): number => {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.recent-transcriptions {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.section-header {
  @apply flex justify-between items-center mb-6;
}

.section-title {
  @apply text-xl font-semibold text-gray-800;
}

.header-actions {
  @apply flex gap-3;
}

.refresh-btn {
  @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2;
}

.history-link {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-600 no-underline;
}

.loading-state,
.empty-state {
  @apply text-center py-12;
}

.loading-spinner {
  @apply mb-4 text-blue-500;
}

.empty-icon {
  @apply mb-4;
}

.empty-state h3 {
  @apply text-lg font-semibold text-gray-700 mb-2;
}

.empty-subtitle {
  @apply text-gray-500;
}

.transcriptions-list {
  @apply space-y-4;
}

.transcription-item {
  @apply border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200;
}

.item-header {
  @apply flex justify-between items-center mb-3;
}

.item-title {
  @apply text-lg font-semibold text-gray-800 m-0;
}

.item-date {
  @apply text-sm text-gray-500;
}

.item-preview {
  @apply mb-3;
}

.preview-text {
  @apply text-gray-700 italic leading-relaxed m-0;
}

.item-stats {
  @apply flex gap-4 text-sm text-gray-600 mb-3;
}

.stat {
  @apply flex items-center gap-1;
}

.item-actions {
  @apply flex gap-2;
}

.action-btn {
  @apply px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 border;
}

.copy-btn {
  @apply bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100;
}

.download-btn {
  @apply bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100;
}

.view-btn {
  @apply bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200;
}

.section-footer {
  @apply text-center mt-6 pt-4 border-t border-gray-200;
}

.view-all-link {
  @apply inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:from-blue-600 hover:to-blue-700 no-underline;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    @apply flex-col gap-4;
  }
  
  .header-actions {
    @apply w-full justify-center;
  }
  
  .item-header {
    @apply flex-col items-start gap-2;
  }
  
  .item-stats {
    @apply flex-col gap-2;
  }
  
  .item-actions {
    @apply flex-col;
  }
  
  .action-btn {
    @apply w-full text-center;
  }
}
</style> 