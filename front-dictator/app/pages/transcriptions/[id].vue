<template>
  <div class="transcription-page">
    <Header />

    <!-- Main Content -->
    <main class="page-main">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-card">
          <ArrowPathIcon class="loading-spinner w-16 h-16 text-blue-500 animate-spin" />
          <h2 class="loading-title">Cargando transcripción...</h2>
          <p class="loading-subtitle">Obteniendo detalles del servidor</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-card">
          <ExclamationTriangleIcon class="error-icon w-16 h-16 text-red-500" />
          <h2 class="error-title">Error al cargar la transcripción</h2>
          <p class="error-message">{{ error }}</p>
          <div class="error-actions">
            <button @click="loadTranscription" class="retry-btn">
              <ArrowPathIcon class="w-4 h-4 mr-2" />
              Reintentar
            </button>
            <NuxtLink to="/history" class="back-btn">
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              Volver al Historial
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Transcription Content -->
      <div v-else-if="transcription" class="transcription-container">
        <!-- Header Section -->
        <section class="transcription-header">
          <div class="header-navigation">
            <NuxtLink to="/history" class="back-link">
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              Volver al Historial
            </NuxtLink>
            <div class="header-breadcrumb">
              <span class="breadcrumb-item">Historial</span>
              <ChevronRightIcon class="w-4 h-4 text-gray-400" />
              <span class="breadcrumb-current">{{ displayTitle }}</span>
            </div>
          </div>

          <div class="header-content">
            <div class="title-section">
              <h1 class="transcription-title">
                <DocumentTextIcon class="w-8 h-8 inline mr-3 text-blue-600" />
                {{ displayTitle }}
              </h1>
              <div class="status-badges">
                <span class="status-badge saved-badge">
                  <ServerIcon class="w-4 h-4 inline mr-1" />
                  Guardado en servidor
                </span>
                <span v-if="isRecentlyCreated" class="status-badge recent-badge">
                  <SparklesIcon class="w-4 h-4 inline mr-1" />
                  Reciente
                </span>
              </div>
            </div>

            <div class="header-actions">
              <button 
                v-if="!isEditMode"
                @click="toggleEditMode" 
                class="action-btn edit-btn"
                title="Editar transcripción"
              >
                <PencilIcon class="w-4 h-4 mr-2" />
                Editar
              </button>
              <button 
                v-else
                @click="saveChanges" 
                class="action-btn save-btn"
                title="Guardar cambios"
                :disabled="!hasChanges || isSaving"
              >
                <ArrowPathIcon v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
                <CheckIcon v-else class="w-4 h-4 mr-2" />
                {{ isSaving ? 'Guardando...' : 'Guardar' }}
              </button>
              <button 
                v-if="isEditMode"
                @click="cancelEdit" 
                class="action-btn cancel-btn"
                title="Cancelar edición"
              >
                <XMarkIcon class="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          </div>
        </section>

        <!-- Statistics Section -->
        <section class="stats-section">
          <div class="stats-grid">
            <div class="stat-card words-stat">
              <DocumentTextIcon class="stat-icon w-8 h-8" />
              <div class="stat-content">
                <span class="stat-number">{{ wordCount }}</span>
                <span class="stat-label">Palabras</span>
                <span class="stat-extra">{{ wordDensity }} p/párrafo</span>
              </div>
            </div>
            
            <div class="stat-card chars-stat">
              <LanguageIcon class="stat-icon w-8 h-8" />
              <div class="stat-content">
                <span class="stat-number">{{ characterCount }}</span>
                <span class="stat-label">Caracteres</span>
                <span class="stat-extra">{{ characterDensity }} c/palabra</span>
              </div>
            </div>
            
            <div class="stat-card time-stat">
              <ClockIcon class="stat-icon w-8 h-8" />
              <div class="stat-content">
                <span class="stat-number">{{ readingTime }}</span>
                <span class="stat-label">Lectura estimada</span>
                <span class="stat-extra">200 palabras/min</span>
              </div>
            </div>
            
            <div class="stat-card date-stat">
              <CalendarIcon class="stat-icon w-8 h-8" />
              <div class="stat-content">
                <span class="stat-number">{{ formatDate(transcription.createdAt) }}</span>
                <span class="stat-label">Fecha de creación</span>
                <span class="stat-extra">{{ timeAgo(transcription.createdAt) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Text Content Section -->
        <section class="content-section">
          <div class="content-header">
            <h3 class="content-title">
              <DocumentIcon class="w-6 h-6 inline mr-2" />
              Contenido de la Transcripción
            </h3>
            <div class="content-controls">
              <div class="text-size-controls">
                <label class="control-label">Tamaño del texto:</label>
                <button @click="decreaseTextSize" class="size-btn" :disabled="textSize <= 0.8">
                  <MinusIcon class="w-4 h-4" />
                </button>
                <span class="size-display">{{ Math.round(textSize * 100) }}%</span>
                <button @click="increaseTextSize" class="size-btn" :disabled="textSize >= 1.4">
                  <PlusIcon class="w-4 h-4" />
                </button>
              </div>
              <button @click="toggleFullscreen" class="fullscreen-btn">
                <ArrowsPointingOutIcon v-if="!isFullscreen" class="w-4 h-4 mr-1" />
                <ArrowsPointingInIcon v-else class="w-4 h-4 mr-1" />
                {{ isFullscreen ? 'Salir' : 'Pantalla completa' }}
              </button>
            </div>
          </div>

          <div 
            class="text-container" 
            :class="{ 'fullscreen': isFullscreen, 'edit-mode': isEditMode }"
          >
            <div v-if="!isEditMode" class="text-content" :style="{ fontSize: `${textSize}rem` }">
              <p class="transcription-text">{{ transcription.text }}</p>
            </div>
            
            <div v-else class="edit-content">
              <textarea 
                v-model="editableText"
                class="edit-textarea"
                :style="{ fontSize: `${textSize}rem` }"
                placeholder="Edita el contenido de la transcripción..."
                @input="updateWordCount"
              ></textarea>
              <div class="edit-info">
                <span class="word-counter">
                  Palabras en edición: {{ editWordCount }}
                  <span v-if="hasChanges" class="changes-indicator">({{ wordDifference }})</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Actions Section -->
        <section class="actions-section">
          <div class="actions-header">
            <h3 class="actions-title">
              <WrenchScrewdriverIcon class="w-6 h-6 inline mr-2" />
              Acciones Disponibles
            </h3>
          </div>

          <div class="actions-content">
            <!-- Primary Actions -->
            <div class="action-group primary-actions">
              <h4 class="group-title">
                <StarIcon class="w-5 h-5 inline mr-1" />
                Acciones Principales
              </h4>
              <div class="actions-grid">
                <button 
                  @click="handleCopy"
                  class="action-btn copy-btn"
                  title="Copiar texto al portapapeles"
                >
                  <ClipboardDocumentIcon class="w-5 h-5 mr-2" />
                  Copiar Texto
                </button>

                <button 
                  @click="handleDownloadTxt"
                  class="action-btn download-btn"
                  title="Descargar como archivo TXT"
                >
                  <FolderArrowDownIcon class="w-5 h-5 mr-2" />
                  Descargar TXT
                </button>

                <button 
                  @click="handleShare"
                  class="action-btn share-btn"
                  title="Compartir transcripción"
                >
                  <ShareIcon class="w-5 h-5 mr-2" />
                  Compartir
                </button>
              </div>
            </div>

            <!-- Secondary Actions -->
            <div class="action-group secondary-actions">
              <h4 class="group-title">
                <CogIcon class="w-5 h-5 inline mr-1" />
                Opciones Adicionales
              </h4>
              <div class="actions-grid">
                <button 
                  @click="handleDownloadJson"
                  class="action-btn json-btn"
                  title="Descargar con metadatos JSON"
                >
                  <CodeBracketIcon class="w-5 h-5 mr-2" />
                  Descargar JSON
                </button>

                <button 
                  @click="handleDuplicate"
                  class="action-btn duplicate-btn"
                  title="Crear una copia de esta transcripción"
                >
                  <DocumentDuplicateIcon class="w-5 h-5 mr-2" />
                  Duplicar
                </button>

                <button 
                  @click="handlePrint"
                  class="action-btn print-btn"
                  title="Imprimir transcripción"
                >
                  <PrinterIcon class="w-5 h-5 mr-2" />
                  Imprimir
                </button>
              </div>
            </div>

            <!-- Management Actions -->
            <div class="action-group management-actions">
              <h4 class="group-title">
                <ShieldCheckIcon class="w-5 h-5 inline mr-1" />
                Gestión
              </h4>
              <div class="actions-grid">
                <button 
                  @click="refreshTranscription"
                  class="action-btn refresh-btn"
                  title="Recargar desde servidor"
                  :disabled="isLoading"
                >
                  <ArrowPathIcon class="w-5 h-5 mr-2" :class="{ 'animate-spin': isLoading }" />
                  Actualizar
                </button>

                <button 
                  @click="showDeleteModal = true"
                  class="action-btn delete-btn"
                  title="Eliminar permanentemente"
                >
                  <TrashIcon class="w-5 h-5 mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Related Actions Section -->
        <section class="related-section">
          <div class="related-header">
            <h3 class="related-title">
              <LinkIcon class="w-6 h-6 inline mr-2" />
              Acciones Relacionadas
            </h3>
          </div>
          
          <div class="related-content">
            <div class="related-cards">
              <NuxtLink to="/realtime" class="related-card">
                <MicrophoneIcon class="card-icon w-8 h-8" />
                <h4 class="card-title">Nueva Transcripción en Vivo</h4>
                <p class="card-description">Crear una nueva transcripción en tiempo real</p>
              </NuxtLink>

              <NuxtLink to="/transcription" class="related-card">
                <FolderOpenIcon class="card-icon w-8 h-8" />
                <h4 class="card-title">Subir Archivo de Audio</h4>
                <p class="card-description">Transcribir un archivo de audio</p>
              </NuxtLink>

              <NuxtLink to="/history" class="related-card">
                <ClipboardDocumentListIcon class="card-icon w-8 h-8" />
                <h4 class="card-title">Ver Todo el Historial</h4>
                <p class="card-description">Explorar todas las transcripciones</p>
              </NuxtLink>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <ExclamationTriangleIcon class="modal-icon w-12 h-12 text-red-500" />
          <h3 class="modal-title">Confirmar Eliminación</h3>
        </div>
        <div class="modal-body">
          <p class="modal-message">
            ¿Estás seguro de que deseas eliminar esta transcripción? 
            Esta acción no se puede deshacer.
          </p>
          <div class="modal-details">
            <strong>Transcripción:</strong> {{ displayTitle }}<br>
            <strong>Palabras:</strong> {{ wordCount }}<br>
            <strong>Fecha:</strong> {{ formatDate(transcription?.createdAt) }}
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="modal-btn cancel-btn">
            Cancelar
          </button>
          <button @click="handleDelete" class="modal-btn delete-btn" :disabled="isDeleting">
            <ArrowPathIcon v-if="isDeleting" class="w-4 h-4 mr-2 animate-spin" />
            <TrashIcon v-else class="w-4 h-4 mr-2" />
            {{ isDeleting ? 'Eliminando...' : 'Eliminar Definitivamente' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="notification" class="notification-toast" :class="notification.type">
      <CheckCircleIcon v-if="notification.type === 'success'" class="notification-icon w-5 h-5" />
      <ExclamationTriangleIcon v-else class="notification-icon w-5 h-5" />
      <span class="notification-message">{{ notification.message }}</span>
      </div>
    </div>
  </template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTranscriptionHistory } from '~/composables/useTranscriptionHistory'
import Header from '~/components/header/Header.vue'
import {
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  ServerIcon,
  SparklesIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  LanguageIcon,
  ClockIcon,
  CalendarIcon,
  DocumentIcon,
  MinusIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  WrenchScrewdriverIcon,
  StarIcon,
  ClipboardDocumentIcon,
  FolderArrowDownIcon,
  ShareIcon,
  CogIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  ShieldCheckIcon,
  TrashIcon,
  LinkIcon,
  MicrophoneIcon,
  FolderOpenIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

// Middleware para proteger la ruta
definePageMeta({
  middleware: 'authenticated'
})

// Reactive data
const route = useRoute()
const router = useRouter()
const transcriptionId = route.params.id as string

const transcription = ref<any>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const editableText = ref('')
const originalText = ref('')
const textSize = ref(1.0)
const isFullscreen = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const isSaving = ref(false)
const notification = ref<{ message: string; type: string } | null>(null)

// Initialize transcription history composable
const transcriptionHistory = useTranscriptionHistory({
  autoLoad: false,
  onError: (errorMsg) => showNotification(errorMsg, 'error'),
  onSuccess: (message) => showNotification(message, 'success')
})

// Computed properties
const displayTitle = computed(() => {
  return transcription.value?.filename || 'Transcripción sin nombre'
})

const wordCount = computed(() => {
  if (!transcription.value?.text) return 0
  return transcription.value.text.trim().split(/\s+/).filter((word: string) => word.length > 0).length
})

const characterCount = computed(() => {
  return transcription.value?.text?.length || 0
})

const readingTime = computed(() => {
  const words = wordCount.value
  const wordsPerMinute = 200
  const minutes = Math.ceil(words / wordsPerMinute)
  if (minutes < 1) return '< 1min'
  if (minutes === 1) return '1min'
  return `${minutes}min`
})

const wordDensity = computed(() => {
  if (!transcription.value?.text || wordCount.value === 0) return 0
  const paragraphs = transcription.value.text.split('\n').filter((p: string) => p.trim().length > 0).length
  return Math.round(wordCount.value / Math.max(paragraphs, 1))
})

const characterDensity = computed(() => {
  if (wordCount.value === 0) return 0
  return Math.round(characterCount.value / wordCount.value)
})

const isRecentlyCreated = computed(() => {
  if (!transcription.value?.createdAt) return false
  const now = new Date()
  const created = new Date(transcription.value.createdAt)
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  return diffHours < 24
})

const editWordCount = computed(() => {
  if (!editableText.value) return 0
  return editableText.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const hasChanges = computed(() => {
  return editableText.value !== originalText.value
})

const wordDifference = computed(() => {
  const diff = editWordCount.value - wordCount.value
  if (diff > 0) return `+${diff}`
  if (diff < 0) return `${diff}`
  return '±0'
})

// SEO
useHead({
  title: computed(() => `${displayTitle.value} - Scripter.ai`),
  meta: [
    { name: 'description', content: computed(() => `Ver detalles de la transcripción: ${displayTitle.value}`) }
  ]
})

// Methods
const loadTranscription = async () => {
  if (!transcriptionId) {
    error.value = 'ID de transcripción no válido'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const token = localStorage.getItem('auth-token')
    const config = useRuntimeConfig()
    const backendUrl = config.public.backendUrl

    const response = await $fetch(`${backendUrl}/api/history/${transcriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }) as any

    if (response) {
      transcription.value = response
      originalText.value = response.text || ''
      editableText.value = response.text || ''
    } else {
      error.value = 'Transcripción no encontrada'
    }
  } catch (err: any) {
    console.error('Error loading transcription:', err)
    error.value = err.data?.msg || 'Error al cargar la transcripción'
  } finally {
    isLoading.value = false
  }
}

const toggleEditMode = () => {
  if (isEditMode.value && hasChanges.value) {
    if (!confirm('¿Descartar los cambios sin guardar?')) return
  }
  
  isEditMode.value = !isEditMode.value
  if (isEditMode.value) {
    editableText.value = originalText.value
  }
}

const saveChanges = async () => {
  if (!hasChanges.value) return

  isSaving.value = true
  try {
    const token = localStorage.getItem('auth-token')
    const config = useRuntimeConfig()
    const backendUrl = config.public.backendUrl

    const response = await $fetch(`${backendUrl}/api/history/${transcriptionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: editableText.value
      })
    }) as any

    if (response) {
      transcription.value = response
      originalText.value = response.text || ''
      isEditMode.value = false
      showNotification('Cambios guardados exitosamente', 'success')
    }
  } catch (err: any) {
    console.error('Error saving changes:', err)
    showNotification(err.data?.msg || 'Error al guardar cambios', 'error')
  } finally {
    isSaving.value = false
  }
}

const cancelEdit = () => {
  if (hasChanges.value) {
    if (!confirm('¿Descartar los cambios sin guardar?')) return
  }
  
  editableText.value = originalText.value
  isEditMode.value = false
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

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const updateWordCount = () => {
  // Trigger reactivity for computed properties
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(transcription.value.text)
    showNotification('Texto copiado al portapapeles', 'success')
  } catch (error) {
    showNotification('Error al copiar el texto', 'error')
  }
}

const handleDownloadTxt = () => {
  if (!transcription.value?.text) return

  const blob = new Blob([transcription.value.text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${displayTitle.value}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showNotification('Archivo TXT descargado', 'success')
}

const handleDownloadJson = () => {
  if (!transcription.value) return

  const jsonData = {
    ...transcription.value,
    metadata: {
      wordCount: wordCount.value,
      characterCount: characterCount.value,
      readingTime: readingTime.value,
      exportedAt: new Date().toISOString()
    }
  }

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${displayTitle.value}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showNotification('Archivo JSON descargado', 'success')
}

const handleShare = async () => {
  try {
    const shareData = {
      title: displayTitle.value,
      text: transcription.value.text,
      url: window.location.href
    }

    if (navigator.share) {
      await navigator.share(shareData)
      showNotification('Transcripción compartida', 'success')
    } else {
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\nVer en: ${shareData.url}`)
      showNotification('Enlace copiado al portapapeles', 'success')
    }
  } catch (error) {
    showNotification('Error al compartir', 'error')
  }
}

const handleDuplicate = async () => {
  try {
    const token = localStorage.getItem('auth-token')
    const config = useRuntimeConfig()
    const backendUrl = config.public.backendUrl

    await $fetch(`${backendUrl}/api/transcribe/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: transcription.value.text,
        filename: `Copia de ${displayTitle.value}`
      })
    })

    showNotification('Transcripción duplicada exitosamente', 'success')
  } catch (error) {
    showNotification('Error al duplicar la transcripción', 'error')
  }
}

const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${displayTitle.value}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .meta { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .content { font-size: 14px; line-height: 1.8; }
          </style>
        </head>
        <body>
          <h1>${displayTitle.value}</h1>
          <div class="meta">
            <strong>Fecha:</strong> ${formatDate(transcription.value.createdAt)}<br>
            <strong>Palabras:</strong> ${wordCount.value}<br>
            <strong>Caracteres:</strong> ${characterCount.value}<br>
            <strong>Tiempo de lectura:</strong> ${readingTime.value}
          </div>
          <div class="content">
            ${transcription.value.text.replace(/\n/g, '<br>')}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
  }
}

const refreshTranscription = async () => {
  await loadTranscription()
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    const success = await transcriptionHistory.deleteServerItem(transcriptionId)
    if (success) {
      showDeleteModal.value = false
      showNotification('Transcripción eliminada exitosamente', 'success')
      setTimeout(() => {
        router.push('/history')
      }, 1500)
    }
  } catch (error) {
    showNotification('Error al eliminar la transcripción', 'error')
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const timeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Hace menos de 1 hora'
  if (diffHours < 24) return `Hace ${diffHours} horas`
  if (diffDays === 1) return 'Hace 1 día'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  return `Hace ${Math.floor(diffDays / 30)} meses`
}

const showNotification = (message: string, type: string = 'info') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 4000)
}

// Lifecycle
onMounted(() => {
  loadTranscription()
})
</script>
  
  <style scoped>
.transcription-page {
  @apply min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100;
}

.page-main {
  @apply pb-12;
}

.loading-container,
.error-container {
  @apply flex items-center justify-center min-h-[60vh] px-4;
}

.loading-card,
.error-card {
  @apply bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full;
}

.loading-spinner {
  @apply mb-6;
}

.loading-title,
.error-title {
  @apply text-xl font-semibold text-gray-800 mb-2;
}

.loading-subtitle,
.error-message {
  @apply text-gray-600;
}

.error-icon {
  @apply mb-6;
}

.error-actions {
  @apply flex gap-4 justify-center mt-6;
}

.retry-btn,
.back-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center;
}

.retry-btn {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.back-btn {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 no-underline;
}

.transcription-container {
  @apply max-w-6xl mx-auto px-4 space-y-8;
}

.transcription-header {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.header-navigation {
  @apply mb-6 space-y-2;
}

.back-link {
  @apply inline-flex items-center text-blue-600 hover:text-blue-800 no-underline font-medium;
}

.header-breadcrumb {
  @apply flex items-center text-sm text-gray-500;
}

.breadcrumb-item {
  @apply text-gray-400;
}

.breadcrumb-current {
  @apply text-gray-700 font-medium;
}

.header-content {
  @apply flex justify-between items-start;
}

.title-section {
  @apply flex-1 min-w-0;
}

.transcription-title {
  @apply text-3xl font-bold text-gray-800 mb-3;
}

.status-badges {
  @apply flex gap-2 flex-wrap;
}

.status-badge {
  @apply px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1;
}

.saved-badge {
  @apply bg-green-100 text-green-800;
}

.recent-badge {
  @apply bg-blue-100 text-blue-800;
}

.header-actions {
  @apply flex gap-3;
}

.action-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 border cursor-pointer flex items-center;
}

.edit-btn {
  @apply bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100;
}

.save-btn {
  @apply bg-green-50 text-green-700 border-green-200 hover:bg-green-100;
}

.save-btn:disabled {
  @apply bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed;
}

.cancel-btn {
  @apply bg-red-50 text-red-700 border-red-200 hover:bg-red-100;
}

.stats-section {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.stat-card {
  @apply flex items-center gap-4 p-4 rounded-lg border-2;
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

.date-stat {
  @apply bg-orange-50 border-orange-200;
}

.stat-icon {
  @apply text-blue-600 flex-shrink-0;
}

.stat-content {
  @apply flex flex-col min-w-0;
}

.stat-number {
  @apply text-lg font-bold text-gray-800 leading-tight;
}

.stat-label {
  @apply text-sm text-gray-600 leading-tight;
}

.stat-extra {
  @apply text-xs text-gray-500;
}

.content-section {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden;
}

.content-header {
  @apply flex justify-between items-center p-6 border-b border-gray-200;
}

.content-title {
  @apply text-xl font-semibold text-gray-800;
}

.content-controls {
  @apply flex items-center gap-4;
}

.text-size-controls {
  @apply flex items-center gap-2;
}

.control-label {
  @apply text-sm font-medium text-gray-600;
}

.size-btn {
  @apply w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

.size-display {
  @apply text-sm font-mono text-gray-600 min-w-[3rem] text-center;
}

.fullscreen-btn {
  @apply px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center;
}

.text-container {
  @apply p-6;
}

.text-container.fullscreen {
  @apply fixed inset-0 bg-white z-50 overflow-auto;
}

.text-container.edit-mode {
  @apply p-0;
}

.text-content {
  @apply max-w-none;
}

.transcription-text {
  @apply text-gray-800 leading-relaxed whitespace-pre-wrap;
}

.edit-content {
  @apply space-y-4;
}

.edit-textarea {
  @apply w-full min-h-[300px] p-6 border-none outline-none resize-none text-gray-800 leading-relaxed;
}

.edit-info {
  @apply px-6 pb-4 text-sm text-gray-600;
}

.word-counter {
  @apply font-medium;
}

.changes-indicator {
  @apply text-blue-600 font-semibold;
}

.actions-section {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.actions-header {
  @apply mb-6;
}

.actions-title {
  @apply text-xl font-semibold text-gray-800;
}

.actions-content {
  @apply space-y-8;
}

.action-group {
  @apply space-y-4;
}

.group-title {
  @apply text-lg font-semibold text-gray-700 flex items-center;
}

.actions-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

/* Action button styles */
.copy-btn {
  @apply bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100;
}

.download-btn {
  @apply bg-green-50 text-green-700 border-green-200 hover:bg-green-100;
}

.share-btn {
  @apply bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100;
}

.json-btn {
  @apply bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100;
}

.duplicate-btn {
  @apply bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100;
}

.print-btn {
  @apply bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100;
}

.refresh-btn {
  @apply bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100;
}

.delete-btn {
  @apply bg-red-50 text-red-700 border-red-200 hover:bg-red-100;
}

.related-section {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.related-header {
  @apply mb-6;
}

.related-title {
  @apply text-xl font-semibold text-gray-800;
}

.related-cards {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.related-card {
  @apply block p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-200 transition-all duration-200 no-underline;
}

.card-icon {
  @apply text-blue-600 mb-3;
}

.card-title {
  @apply text-lg font-semibold text-gray-800 mb-2;
}

.card-description {
  @apply text-gray-600;
}

/* Modal styles */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.modal-content {
  @apply bg-white rounded-xl shadow-xl max-w-md w-full;
}

.modal-header {
  @apply text-center p-6 border-b border-gray-200;
}

.modal-icon {
  @apply mb-4;
}

.modal-title {
  @apply text-xl font-semibold text-gray-800;
}

.modal-body {
  @apply p-6;
}

.modal-message {
  @apply text-gray-600 mb-4;
}

.modal-details {
  @apply bg-gray-50 p-4 rounded-lg text-sm text-gray-700;
}

.modal-actions {
  @apply flex gap-3 p-6 border-t border-gray-200;
}

.modal-btn {
  @apply flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center;
}

.modal-btn.cancel-btn {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

.modal-btn.delete-btn {
  @apply bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Notification toast */
.notification-toast {
  @apply fixed top-4 right-4 flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg z-50 font-medium text-white max-w-sm;
}

.notification-toast.success {
  @apply bg-green-500;
}

.notification-toast.error {
  @apply bg-red-500;
}

.notification-icon {
  @apply flex-shrink-0;
}

.notification-message {
  @apply flex-1;
}

/* Responsive design */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col gap-4;
  }
  
  .stats-grid {
    @apply grid-cols-1;
  }
  
  .content-controls {
    @apply flex-col gap-2;
  }
  
  .actions-grid {
    @apply grid-cols-1;
  }
  
  .related-cards {
    @apply grid-cols-1;
  }
  
  .modal-actions {
    @apply flex-col;
  }
}

/* Animations */
.transcription-header,
.stats-section,
.content-section,
.actions-section,
.related-section {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-btn:hover {
  @apply transform scale-105;
}

.related-card:hover {
  @apply transform scale-105;
  }
  </style>
  