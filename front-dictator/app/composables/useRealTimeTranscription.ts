import { io, Socket } from 'socket.io-client'
import { useUserSession } from './useUserSession'

interface TranscriptionConfig {
  language?: string
  enable_partials?: boolean
  remove_disfluencies?: boolean
}

interface TranscriptionState {
  isConnected: boolean
  isTranscribing: boolean
  partialText: string
  finalText: string
  isRecording: boolean
  error: string | null
}

export function useRealTimeTranscription() {
  const { token } = useUserSession()
  
  // Estado reactivo
  const state = reactive<TranscriptionState>({
    isConnected: false,
    isTranscribing: false,
    partialText: '',
    finalText: '',
    isRecording: false,
    error: null
  })

  // Referencias para grabación de audio
  let socket: Socket | null = null
  let mediaRecorder: MediaRecorder | null = null
  let audioStream: MediaStream | null = null

  // Conectar al WebSocket
  const connect = () => {
    if (socket?.connected) return

    const config = useRuntimeConfig()
    const backendUrl = config.public.socketioUrl || 'http://localhost:4000'
    
    socket = io(`${backendUrl}/transcription`, {
      transports: ['websocket'],
      forceNew: true
    })

    // Eventos del socket
    socket.on('connect', () => {
      state.isConnected = true
      state.error = null
      console.log('🔗 Conectado al servicio de transcripción')
    })

    socket.on('disconnect', () => {
      state.isConnected = false
      state.isTranscribing = false
      console.log('🔌 Desconectado del servicio de transcripción')
    })

    socket.on('ready-for-audio', () => {
      console.log('🎤 Listo para recibir audio')
      startAudioRecording()
    })

    socket.on('partial-transcript', (data: { text: string }) => {
      state.partialText = data.text
    })

    socket.on('final-transcript', (data: { text: string }) => {
      state.finalText += data.text + ' '
      state.partialText = '' // Limpiar texto parcial
    })

    socket.on('transcription-ended', () => {
      state.isTranscribing = false
      stopAudioRecording()
      console.log('✅ Transcripción finalizada')
    })

    socket.on('retry-attempt', (data: { attempt: number; maxRetries: number }) => {
      console.log(`🔄 Reintentando transcripción (${data.attempt}/${data.maxRetries})`)
    })

    socket.on('transcript-saved', (data: any) => {
      console.log('💾 Transcripción guardada:', data)
    })

    socket.on('error', (data: { message: string; code?: string; retryIn?: number }) => {
      state.error = data.message
      state.isTranscribing = false
      stopAudioRecording()
      
      // Log específico según el tipo de error
      if (data.code === 'QUOTA_EXCEEDED') {
        console.error('❌ Límite de cuota excedido:', data.message)
      } else if (data.code === 'RATE_LIMIT' && data.retryIn) {
        console.warn(`⏳ Rate limit alcanzado, reintentando en ${data.retryIn} segundos`)
      } else {
        console.error('❌ Error:', data.message)
      }
    })
  }

  // Iniciar transcripción
  const startTranscription = async (config: TranscriptionConfig = {}) => {
    try {
      if (!socket?.connected) {
        throw new Error('No hay conexión con el servidor')
      }

      state.error = null
      state.finalText = ''
      state.partialText = ''
      state.isTranscribing = true

      // Solicitar permisos de micrófono
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      // Enviar configuración al servidor
      socket.emit('start-transcription', {
        language: config.language || 'es',
        enable_partials: config.enable_partials !== false,
        remove_disfluencies: config.remove_disfluencies !== false
      })

    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Error desconocido'
      state.isTranscribing = false
      console.error('Error iniciando transcripción:', error)
      throw error
    }
  }

  // Configurar grabación de audio
  const startAudioRecording = () => {
    if (!audioStream) return

    try {
      mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket?.connected) {
          // Convertir blob a array buffer y enviar
          event.data.arrayBuffer().then(buffer => {
            if (socket?.connected) {
              socket.emit('audio-data', buffer)
            }
          })
        }
      }

      mediaRecorder.onstart = () => {
        state.isRecording = true
        console.log('🎙️ Grabación iniciada')
      }

      mediaRecorder.onstop = () => {
        state.isRecording = false
        console.log('⏹️ Grabación detenida')
      }

      // Iniciar grabación con intervalos pequeños para tiempo real
      mediaRecorder.start(100) // Enviar datos cada 100ms

    } catch (error) {
      console.error('Error configurando grabación:', error)
      state.error = 'Error configurando grabación de audio'
    }
  }

  // Detener grabación de audio
  const stopAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      audioStream = null
    }
  }

  // Detener transcripción
  const stopTranscription = () => {
    if (socket?.connected && state.isTranscribing) {
      socket.emit('stop-transcription')
    }
    
    stopAudioRecording()
    state.isTranscribing = false
  }

  // Desconectar
  const disconnect = () => {
    stopTranscription()
    
    if (socket) {
      socket.disconnect()
      socket = null
    }
    
    state.isConnected = false
  }

  // Limpiar texto
  const clearText = () => {
    state.finalText = ''
    state.partialText = ''
  }

  // Obtener texto completo (final + parcial)
  const getFullText = computed(() => {
    const final = state.finalText.trim()
    const partial = state.partialText.trim()
    
    if (final && partial) {
      return `${final} ${partial}`
    }
    return final || partial
  })

  // Auto-conectar cuando el composable se inicializa
  onMounted(() => {
    if (import.meta.client && token.value) {
      connect()
    }
  })

  // Limpiar al desmontar
  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    // Estado
    ...toRefs(state),
    
    // Computed
    getFullText,
    
    // Métodos
    connect,
    disconnect,
    startTranscription,
    stopTranscription,
    clearText
  }
} 