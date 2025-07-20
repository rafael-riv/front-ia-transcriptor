import { ref, readonly, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'

export interface TranscriptionResult {
  results: Array<{
    alternatives?: Array<{
      content: string
    }>
  }>
}

export interface UseWebSocketOptions {
  url?: string
  onPartialTranscript?: (transcript: string) => void
  onFinalTranscript?: (transcript: string) => void
  onError?: (error: string) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onRecognitionStarted?: () => void
}

export function useWebSocketConnection(options: UseWebSocketOptions = {}) {
  const socket: ref<Socket | null> = ref(null)
  const isConnected = ref(false)
  const connectionError = ref<string | null>(null)
  const isRecognitionActive = ref(false)

  const url = options.url || 'http://localhost:4000'

  const connect = (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        socket.value = io(url)

        socket.value.on('connect', () => {
          isConnected.value = true
          connectionError.value = null
          console.log('Connected to socket server')
          options.onConnected?.()
          resolve(true)
        })

        socket.value.on('disconnect', () => {
          isConnected.value = false
          console.log('Disconnected from socket server')
          options.onDisconnected?.()
        })

        socket.value.on('connect_error', (error) => {
          const errorMessage = `Connection error: ${error.message}`
          connectionError.value = errorMessage
          console.error(errorMessage)
          options.onError?.(errorMessage)
          resolve(false)
        })

        socket.value.on('partial_transcript', (data: TranscriptionResult) => {
          try {
            const partialText = data.results
              .map((r) => r.alternatives?.[0]?.content)
              .filter(Boolean)
              .join(' ')
            
            if (partialText) {
              options.onPartialTranscript?.(partialText)
            }
          } catch (error) {
            console.error('Error processing partial transcript:', error)
          }
        })

        socket.value.on('final_transcript', (data: TranscriptionResult) => {
          try {
            const finalText = data.results
              .map((r) => r.alternatives?.[0]?.content)
              .filter(Boolean)
              .join(' ')
            
            if (finalText) {
              options.onFinalTranscript?.(finalText)
            }
          } catch (error) {
            console.error('Error processing final transcript:', error)
          }
        })

        socket.value.on('error', (errorMessage: string) => {
          const fullError = `Socket error: ${errorMessage}`
          connectionError.value = fullError
          console.error(fullError)
          options.onError?.(fullError)
        })

        socket.value.on('recognition_started', () => {
          isRecognitionActive.value = true
          console.log('Recognition started')
          options.onRecognitionStarted?.()
        })

        // Timeout para la conexión
        setTimeout(() => {
          if (!isConnected.value) {
            resolve(false)
          }
        }, 5000)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown connection error'
        connectionError.value = errorMessage
        console.error('Failed to create socket connection:', error)
        options.onError?.(errorMessage)
        resolve(false)
      }
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      isRecognitionActive.value = false
    }
  }

  const startRecognition = (): boolean => {
    if (!socket.value || !isConnected.value) {
      console.warn('Socket not connected')
      return false
    }

    try {
      socket.value.emit('start_recognition')
      return true
    } catch (error) {
      console.error('Error starting recognition:', error)
      return false
    }
  }

  const stopRecognition = (): boolean => {
    if (!socket.value) {
      return false
    }

    try {
      socket.value.emit('stop_recognition')
      isRecognitionActive.value = false
      return true
    } catch (error) {
      console.error('Error stopping recognition:', error)
      return false
    }
  }

  const pauseRecognition = (): boolean => {
    if (!socket.value || !isConnected.value) {
      return false
    }

    try {
      socket.value.emit('pause_recognition')
      return true
    } catch (error) {
      console.error('Error pausing recognition:', error)
      return false
    }
  }

  const resumeRecognition = (): boolean => {
    if (!socket.value || !isConnected.value) {
      return false
    }

    try {
      socket.value.emit('resume_recognition')
      return true
    } catch (error) {
      console.error('Error resuming recognition:', error)
      return false
    }
  }

  const sendAudio = (audioData: Blob): boolean => {
    if (!socket.value || !isConnected.value || !isRecognitionActive.value) {
      return false
    }

    try {
      socket.value.emit('send_audio', audioData)
      return true
    } catch (error) {
      console.error('Error sending audio:', error)
      return false
    }
  }

  const reconnect = async (): Promise<boolean> => {
    disconnect()
    return await connect()
  }

  // Cleanup automático
  onUnmounted(() => {
    disconnect()
  })

  return {
    // Estado
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),
    isRecognitionActive: readonly(isRecognitionActive),
    
    // Métodos de conexión
    connect,
    disconnect,
    reconnect,
    
    // Métodos de reconocimiento
    startRecognition,
    stopRecognition,
    pauseRecognition,
    resumeRecognition,
    sendAudio
  }
} 