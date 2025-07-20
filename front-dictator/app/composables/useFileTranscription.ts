import { ref, readonly } from 'vue'
import type { TranscriptionData } from '~/components/transcription/TranscriptionPreview.vue'

export interface FileTranscriptionOptions {
  apiBaseUrl?: string
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export interface UploadProgress {
  progress: number
  stage: string
  isUploading: boolean
}

export function useFileTranscription(options: FileTranscriptionOptions = {}) {
  // Estado reactivo
  const currentTranscription = ref<TranscriptionData | null>(null)
  const uploadProgress = ref<UploadProgress>({
    progress: 0,
    stage: 'Preparando...',
    isUploading: false
  })
  const isLoading = ref(false)

  const apiBaseUrl = options.apiBaseUrl || 'http://localhost:4000'

  // Métodos principales
  const uploadAndTranscribe = async (file: File): Promise<boolean> => {
    try {
      uploadProgress.value.isUploading = true
      uploadProgress.value.progress = 0
      uploadProgress.value.stage = 'Preparando archivo...'

      // Crear FormData
      const formData = new FormData()
      formData.append('audio', file)

      // Simular progreso con etapas realistas
      const progressStages = [
        { progress: 10, stage: 'Subiendo archivo...' },
        { progress: 30, stage: 'Procesando audio...' },
        { progress: 60, stage: 'Transcribiendo contenido...' },
        { progress: 85, stage: 'Finalizando transcripción...' },
        { progress: 95, stage: 'Preparando resultado...' }
      ]

      const progressInterval = setInterval(() => {
        const currentStage = progressStages.find(stage => 
          uploadProgress.value.progress < stage.progress
        )
        if (currentStage) {
          uploadProgress.value.progress = Math.min(
            uploadProgress.value.progress + Math.random() * 3, 
            currentStage.progress
          )
          uploadProgress.value.stage = currentStage.stage
        }
      }, 300)

      // Obtener token y realizar petición
      const token = localStorage.getItem('auth-token')
      const config = useRuntimeConfig()
      const backendUrl = config.public.backendUrl || apiBaseUrl

      const response = await $fetch(`${backendUrl}/api/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      }) as any

      // Completar progreso
      clearInterval(progressInterval)
      uploadProgress.value.progress = 100
      uploadProgress.value.stage = 'Transcripción completada!'

      // Crear objeto de transcripción
      currentTranscription.value = {
        text: response.transcript?.text || response.text || '',
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        fileType: file.type,
        ...response
      }

      options.onSuccess?.('¡Transcripción completada exitosamente!')
      return true

    } catch (error) {
      console.error('Upload failed:', error)
      options.onError?.('Error al procesar el archivo. Inténtalo de nuevo.')
      return false
    } finally {
      uploadProgress.value.isUploading = false
      uploadProgress.value.progress = 0
      uploadProgress.value.stage = 'Preparando...'
    }
  }

  const saveToHistory = async (transcription: TranscriptionData): Promise<boolean> => {
    if (!transcription.text) {
      options.onError?.('No hay texto para guardar')
      return false
    }

    isLoading.value = true
    try {
      const token = localStorage.getItem('auth-token')
      const config = useRuntimeConfig()
      const backendUrl = config.public.backendUrl || apiBaseUrl

      await $fetch(`${backendUrl}/api/transcribe/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: transcription.text,
          filename: transcription.filename || `Archivo - ${new Date().toLocaleString()}`
        })
      })

      options.onSuccess?.('Transcripción guardada en el historial')
      return true

    } catch (error) {
      console.error('Save failed:', error)
      options.onError?.('Error al guardar en el historial')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const downloadTranscription = (transcription: TranscriptionData, format: 'txt' | 'json' = 'txt'): void => {
    if (!transcription.text && format === 'txt') {
      options.onError?.('No hay texto para descargar')
      return
    }

    let content: string
    let mimeType: string
    let extension: string

    if (format === 'json') {
      const jsonData = {
        ...transcription,
        metadata: {
          wordCount: getWordCount(transcription.text),
          characterCount: transcription.text?.length || 0,
          exportedAt: new Date().toISOString()
        }
      }
      content = JSON.stringify(jsonData, null, 2)
      mimeType = 'application/json;charset=utf-8'
      extension = 'json'
    } else {
      content = transcription.text || ''
      mimeType = 'text/plain;charset=utf-8'
      extension = 'txt'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${transcription.filename?.replace(/\.[^/.]+$/, '') || 'transcripcion'}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    options.onSuccess?.(`Archivo ${extension.toUpperCase()} descargado`)
  }

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) {
      options.onError?.('No hay texto para copiar')
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      options.onSuccess?.('Texto copiado al portapapeles')
      return true
    } catch (error) {
      options.onError?.('Error al copiar el texto')
      return false
    }
  }

  const shareTranscription = async (transcription: TranscriptionData): Promise<boolean> => {
    if (!transcription.text) {
      options.onError?.('No hay contenido para compartir')
      return false
    }

    try {
      const shareData = {
        title: 'Transcripción de Audio',
        text: transcription.text,
        url: window.location.href
      }

      if (navigator.share) {
        await navigator.share(shareData)
        options.onSuccess?.('Transcripción compartida')
      } else {
        // Fallback: copiar al portapapeles
        const content = `${shareData.title}\n\n${shareData.text}`
        await navigator.clipboard.writeText(content)
        options.onSuccess?.('Transcripción copiada al portapapeles')
      }
      return true
    } catch (error) {
      options.onError?.('Error al compartir')
      return false
    }
  }

  const clearTranscription = (): void => {
    currentTranscription.value = null
  }

  const updateTranscription = (newData: Partial<TranscriptionData>): void => {
    if (currentTranscription.value) {
      currentTranscription.value = {
        ...currentTranscription.value,
        ...newData
      }
    }
  }

  // Utilidades
  const getWordCount = (text: string): number => {
    if (!text?.trim()) return 0
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getCharacterCount = (text: string): number => {
    return text?.length || 0
  }

  const getReadingTime = (text: string): string => {
    const words = getWordCount(text)
    const wordsPerMinute = 200
    const minutes = Math.ceil(words / wordsPerMinute)
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`
  }

  // API pública del composable
  return {
    // Estado (readonly para mantener encapsulación)
    currentTranscription: readonly(currentTranscription),
    uploadProgress: readonly(uploadProgress),
    isLoading: readonly(isLoading),

    // Métodos principales
    uploadAndTranscribe,
    saveToHistory,
    downloadTranscription,
    copyToClipboard,
    shareTranscription,
    clearTranscription,
    updateTranscription,

    // Utilidades
    getWordCount,
    getCharacterCount,
    getReadingTime,

    // Getters computados
    hasTranscription: () => !!currentTranscription.value,
    canSave: () => !!(currentTranscription.value?.text?.trim()),
    wordCount: () => getWordCount(currentTranscription.value?.text || ''),
    characterCount: () => getCharacterCount(currentTranscription.value?.text || ''),
    readingTime: () => getReadingTime(currentTranscription.value?.text || '')
  }
} 