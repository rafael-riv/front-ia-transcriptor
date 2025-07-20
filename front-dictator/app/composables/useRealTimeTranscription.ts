import { ref, reactive, computed, onUnmounted, readonly } from 'vue'
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

interface TranscriptionBuffer {
  finalText: string        // Texto ya confirmado como final
  pendingText: string     // Texto parcial actual que aún puede cambiar
  lastPartialText: string // Último texto parcial para detectar cambios
}

export function useRealTimeTranscription(options: UseRealTimeTranscriptionOptions = {}) {
  // Estado principal
  const transcriptionBuffer = ref<TranscriptionBuffer>({
    finalText: '',
    pendingText: '',
    lastPartialText: ''
  })
  
  const sessionStartTime = ref<Date | null>(null)
  const status = ref('Detenido')
  const isSessionActive = ref(false)

  // Texto computado que combina final + parcial
  const currentTranscript = computed(() => {
    const buffer = transcriptionBuffer.value
    const finalPart = buffer.finalText.trim()
    const pendingPart = buffer.pendingText.trim()
    
    if (finalPart && pendingPart) {
      return `${finalPart} ${pendingPart}`
    }
    return finalPart || pendingPart
  })

  // Texto en vivo (solo el parcial actual)
  const liveTranscript = computed(() => {
    return transcriptionBuffer.value.pendingText
  })

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
      handlePartialTranscript(transcript)
    },
    onFinalTranscript: (transcript) => {
      handleFinalTranscript(transcript)
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

  // Instancia de transcription history solo para operaciones de guardado
  let transcriptionHistory: ReturnType<typeof useTranscriptionHistory> | null = null
  
  const getTranscriptionHistory = () => {
    if (!transcriptionHistory) {
      transcriptionHistory = useTranscriptionHistory({
        apiBaseUrl: options.apiBaseUrl,
        autoLoad: false, // No auto-cargar para evitar problemas de serialización
        onError: options.onError,
        onSuccess: options.onSuccess
      })
    }
    return transcriptionHistory
  }

  // Lógica mejorada para manejar transcripciones
  const handlePartialTranscript = (transcript: string) => {
    const buffer = transcriptionBuffer.value
    
    // Actualizar solo el texto parcial
    buffer.pendingText = transcript.trim()
    
    console.log('📝 Partial:', transcript.trim())
  }

  const handleFinalTranscript = (transcript: string) => {
    const buffer = transcriptionBuffer.value
    const finalText = transcript.trim()
    
    if (finalText) {
      // Si hay texto parcial previo, lo reemplazamos con el final
      // Si no hay texto parcial, simplemente agregamos el final
      if (buffer.pendingText) {
        // Reemplazar el texto parcial con el final
        buffer.finalText = buffer.finalText ? `${buffer.finalText} ${finalText}` : finalText
        buffer.pendingText = '' // Limpiar el parcial ya que se convirtió en final
      } else {
        // Agregar directamente al final si no hay parcial
        buffer.finalText = buffer.finalText ? `${buffer.finalText} ${finalText}` : finalText
      }
      
      console.log('✅ Final:', finalText)
      console.log('📄 Accumulated:', buffer.finalText)
    }
  }

  const finalizeCurrentTranscript = () => {
    const buffer = transcriptionBuffer.value
    
    // Si hay texto parcial pendiente, lo promovemos a final
    if (buffer.pendingText.trim()) {
      const pendingText = buffer.pendingText.trim()
      buffer.finalText = buffer.finalText ? `${buffer.finalText} ${pendingText}` : pendingText
      buffer.pendingText = ''
      
      console.log('🔄 Finalized pending text:', pendingText)
    }
  }

  const clearTranscriptionBuffer = () => {
    transcriptionBuffer.value = {
      finalText: '',
      pendingText: '',
      lastPartialText: ''
    }
  }

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

      // ✨ Solo limpiar el buffer si hay texto previo y el usuario lo confirma
      const hasText = currentTranscript.value.trim().length > 0
      if (hasText) {
        const shouldClear = confirm('¿Estás seguro de que quieres iniciar una nueva transcripción? Se perderá el texto actual si no lo has guardado.')
        if (!shouldClear) {
          status.value = 'Detenido'
          return false
        }
      }

      // Limpiar estado anterior
      clearTranscriptionBuffer()
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

    // Al pausar, finalizamos cualquier texto parcial pendiente
    finalizeCurrentTranscript()

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
    // IMPORTANTE: Finalizar cualquier texto parcial antes de detener
    finalizeCurrentTranscript()

    // Detener grabación de audio
    audioRecording.stopRecording()
    
    // Detener reconocimiento
    webSocket.stopRecognition()

    // ✨ NO agregar automáticamente al historial
    // El usuario debe decidir explícitamente si quiere guardar

    // Limpiar estado de sesión pero MANTENER el texto
    isSessionActive.value = false
    status.value = 'Detenido'
    sessionStartTime.value = null
    
    // ✨ NO limpiar automáticamente el buffer
    // El texto debe persistir hasta que el usuario decida qué hacer
    // Solo se limpiará cuando:
    // 1. Inicie una nueva transcripción
    // 2. Use el método clearText explícitamente
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

  // Método para limpiar el texto manualmente
  const clearText = () => {
    clearTranscriptionBuffer()
  }

  // Métodos de guardado y descarga
  const saveCurrentTranscript = async (): Promise<boolean> => {
    // Asegurar que el texto actual incluye todo (final + parcial)
    const textToSave = currentTranscript.value.trim()
    
    if (!textToSave) {
      options.onError?.('No hay texto para guardar')
      return false
    }

    // Si hay texto parcial, finalizarlo antes de guardar
    if (transcriptionBuffer.value.pendingText.trim()) {
      finalizeCurrentTranscript()
    }

    const historyManager = getTranscriptionHistory()
    const result = await historyManager.saveTranscription(
      transcriptionBuffer.value.finalText.trim(),
      'Transcripción actual en progreso'
    )

    if (result) {
      options.onSuccess?.('Transcripción guardada exitosamente')
    }

    return result
  }

  const downloadCurrentTranscript = (): void => {
    const textToDownload = currentTranscript.value.trim()
    
    if (!textToDownload) {
      options.onError?.('No hay texto para descargar')
      return
    }

    try {
      FileOperationsService.downloadTranscription(textToDownload, 'transcripcion_actual')
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
    // Estado reactivo
    status: readonly(status),
    transcriptionStatus: readonly(transcriptionStatus),
    buttonState: readonly(buttonState),
    statusClass: readonly(statusClass),
    
    // Métodos principales
    handleMainAction,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    clearText,
    
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