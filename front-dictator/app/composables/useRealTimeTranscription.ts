import { ref, reactive, computed, onUnmounted } from 'vue'
import { useAudioRecording } from './useAudioRecording'
import { useWebSocketConnection } from './useWebSocketConnection'
import { useTranscriptionHistory } from './useTranscriptionHistory'
import { FileOperationsService } from '~/utils/fileOperationsService'
import { transcriptionApi } from '~/utils/transcriptionApiService'

export interface TranscriptionStatus {
  isTranscribing: boolean
  isPaused: boolean
  isConnected: boolean
  currentText: string
  liveText: string
  error: string | null
}

export interface UseRealTimeTranscriptionOptions {
  apiBaseUrl?: string
  socketUrl?: string
  autoConnect?: boolean
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export function useRealTimeTranscription(options: UseRealTimeTranscriptionOptions = {}) {
  // Estado principal
  const currentTranscript = ref('')
  const liveTranscript = ref('')
  const sessionStartTime = ref<Date | null>(null)
  const status = ref('Detenido')
  const isSessionActive = ref(false)

  // Configurar y usar composables especializados
  const audioRecording = useAudioRecording({
    onDataAvailable: (audioData) => {
      if (webSocket.isConnected.value && !audioRecording.isPaused.value) {
        webSocket.sendAudio(audioData)
      }
    },
    onError: (error) => {
      status.value = `Error de audio: ${error.message}`
      options.onError?.(error.message)
      stopSession()
    },
    onStateChange: (state) => {
      // El estado del audio se sincroniza automáticamente
    }
  })

  const webSocket = useWebSocketConnection({
    url: options.socketUrl || options.apiBaseUrl || 'http://localhost:4000',
    onPartialTranscript: (transcript) => {
      liveTranscript.value = transcript
    },
    onFinalTranscript: (transcript) => {
      if (transcript.trim()) {
        // Acumular texto final en la transcripción actual
        currentTranscript.value += (currentTranscript.value ? ' ' : '') + transcript.trim()
      }
      liveTranscript.value = transcript
    },
    onError: (error) => {
      status.value = error
      options.onError?.(error)
      stopSession()
    },
    onConnected: () => {
      status.value = 'Conectado'
    },
    onDisconnected: () => {
      status.value = 'Desconectado'
      stopSession()
    },
    onRecognitionStarted: () => {
      status.value = '¡Habla ahora!'
      startAudioRecording()
    }
  })

  const transcriptionHistory = useTranscriptionHistory({
    apiBaseUrl: options.apiBaseUrl,
    autoLoad: true,
    onError: options.onError,
    onSuccess: options.onSuccess
  })

  // Estado computado combinado
  const transcriptionStatus = computed<TranscriptionStatus>(() => ({
    isTranscribing: isSessionActive.value && audioRecording.isRecording.value,
    isPaused: audioRecording.isPaused.value,
    isConnected: webSocket.isConnected.value,
    currentText: currentTranscript.value,
    liveText: liveTranscript.value,
    error: audioRecording.error.value || webSocket.connectionError.value
  }))

  const buttonState = computed(() => {
    if (!isSessionActive.value) return { label: 'Comenzar Grabación', class: 'bg-green-500 hover:bg-green-600' }
    if (audioRecording.isPaused.value) return { label: 'Reanudar Grabación', class: 'bg-blue-500 hover:bg-blue-600' }
    return { label: 'Pausar Grabación', class: 'bg-neutral-200 hover:bg-neutral-300 border border-red-600' }
  })

  const statusClass = computed(() => {
    if (status.value.includes('Error')) return 'status-error'
    if (transcriptionStatus.value.isTranscribing && !transcriptionStatus.value.isPaused) return 'status-recording'
    if (transcriptionStatus.value.isPaused) return 'status-paused'
    return 'status-stopped'
  })

  // Métodos principales
  const startSession = async (): Promise<boolean> => {
    try {
      status.value = 'Iniciando...'
      
      // Conectar WebSocket si no está conectado
      if (!webSocket.isConnected.value) {
        const connected = await webSocket.connect()
        if (!connected) {
          status.value = 'Error de conexión'
          return false
        }
      }

      // Limpiar estado anterior
      currentTranscript.value = ''
      liveTranscript.value = ''
      sessionStartTime.value = new Date()
      isSessionActive.value = true

      // Iniciar reconocimiento (esto activará el callback onRecognitionStarted)
      const started = webSocket.startRecognition()
      if (!started) {
        status.value = 'Error al iniciar reconocimiento'
        isSessionActive.value = false
        return false
      }

      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      status.value = `Error: ${errorMsg}`
      options.onError?.(errorMsg)
      isSessionActive.value = false
      return false
    }
  }

  const startAudioRecording = async (): Promise<boolean> => {
    if (!isSessionActive.value) return false

    const started = await audioRecording.startRecording()
    if (!started) {
      status.value = 'Error al acceder al micrófono'
      stopSession()
      return false
    }

    return true
  }

  const pauseSession = (): boolean => {
    if (!isSessionActive.value) return false

    const paused = audioRecording.pauseRecording() && webSocket.pauseRecognition()
    if (paused) {
      status.value = 'Pausado'
    }
    return paused
  }

  const resumeSession = (): boolean => {
    if (!isSessionActive.value) return false

    const resumed = audioRecording.resumeRecording() && webSocket.resumeRecognition()
    if (resumed) {
      status.value = '¡Habla ahora!'
    }
    return resumed
  }

  const stopSession = (): void => {
    // Detener grabación de audio
    audioRecording.stopRecording()
    
    // Detener reconocimiento
    webSocket.stopRecognition()

    // Agregar al historial si hay texto
    if (currentTranscript.value.trim() && sessionStartTime.value) {
      transcriptionHistory.addLocalTranscription(
        currentTranscript.value,
        sessionStartTime.value,
        new Date()
      )
    }

    // Limpiar estado
    isSessionActive.value = false
    status.value = 'Detenido'
    liveTranscript.value = ''
    currentTranscript.value = ''
    sessionStartTime.value = null
  }

  const handleMainAction = () => {
    if (!isSessionActive.value) {
      startSession()
    } else if (!audioRecording.isPaused.value) {
      pauseSession()
    } else {
      resumeSession()
    }
  }

  // Métodos de guardado y descarga
  const saveCurrentTranscript = async (): Promise<boolean> => {
    if (!currentTranscript.value.trim()) {
      options.onError?.('No hay texto para guardar')
      return false
    }

    const result = await transcriptionHistory.saveTranscription(
      currentTranscript.value,
      'Transcripción actual en progreso'
    )

    if (result) {
      options.onSuccess?.('Transcripción guardada exitosamente')
    }

    return result
  }

  const downloadCurrentTranscript = (): void => {
    if (!currentTranscript.value.trim()) {
      options.onError?.('No hay texto para descargar')
      return
    }

    try {
      FileOperationsService.downloadTranscription(currentTranscript.value, 'transcripcion_actual')
      options.onSuccess?.('Transcripción descargada')
    } catch (error) {
      options.onError?.(error instanceof Error ? error.message : 'Error al descargar')
    }
  }

  const copyToClipboard = async (text?: string): Promise<boolean> => {
    const textToCopy = text || currentTranscript.value
    
    try {
      const success = await FileOperationsService.copyToClipboard(textToCopy)
      if (success) {
        options.onSuccess?.('Texto copiado al portapapeles')
      }
      return success
    } catch (error) {
      options.onError?.(error instanceof Error ? error.message : 'Error al copiar')
      return false
    }
  }

  // Cleanup automático
  onUnmounted(() => {
    stopSession()
    webSocket.disconnect()
    audioRecording.cleanup()
  })

  // Auto-conectar si está habilitado
  if (options.autoConnect !== false) {
    webSocket.connect()
  }

  return {
    // Estado
    status: readonly(status),
    transcriptionStatus: readonly(transcriptionStatus),
    buttonState: readonly(buttonState),
    statusClass: readonly(statusClass),
    
    // Referencias a composables especializados para casos avanzados
    audioRecording: readonly(audioRecording),
    webSocket: readonly(webSocket),
    transcriptionHistory: readonly(transcriptionHistory),
    
    // Métodos principales
    handleMainAction,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    
    // Métodos de archivo
    saveCurrentTranscript,
    downloadCurrentTranscript,
    copyToClipboard,
    
    // Getters de estado
    isActive: () => isSessionActive.value,
    hasCurrentText: () => currentTranscript.value.trim().length > 0,
    sessionDuration: () => {
      if (!sessionStartTime.value) return 0
      return Math.round((Date.now() - sessionStartTime.value.getTime()) / 1000)
    }
  }
} 