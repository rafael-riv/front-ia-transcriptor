import { ref, type Ref, readonly } from 'vue'

export interface UseAudioRecordingOptions {
  onDataAvailable?: (data: Blob) => void
  onError?: (error: Error) => void
  onStateChange?: (state: RecordingState) => void
}

export type RecordingState = 'inactive' | 'recording' | 'paused'

export function useAudioRecording(options: UseAudioRecordingOptions = {}) {
  const mediaRecorder: Ref<MediaRecorder | null> = ref(null)
  const stream: Ref<MediaStream | null> = ref(null)
  const isRecording = ref(false)
  const isPaused = ref(false)
  const recordingState: Ref<RecordingState> = ref('inactive')
  const error = ref<string | null>(null)

  const updateState = (newState: RecordingState) => {
    recordingState.value = newState
    isRecording.value = newState === 'recording'
    isPaused.value = newState === 'paused'
    options.onStateChange?.(newState)
  }

  const startRecording = async (): Promise<boolean> => {
    try {
      error.value = null
      
      // Obtener acceso al micrófono
      stream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Crear MediaRecorder
      mediaRecorder.value = new MediaRecorder(stream.value, { 
        mimeType: 'audio/webm;codecs=opus' 
      })

      // Configurar eventos
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          options.onDataAvailable?.(event.data)
        }
      }

      mediaRecorder.value.onerror = (event) => {
        const recordingError = new Error('Error en la grabación de audio')
        error.value = recordingError.message
        options.onError?.(recordingError)
        updateState('inactive')
      }

      mediaRecorder.value.onstart = () => {
        updateState('recording')
      }

      mediaRecorder.value.onstop = () => {
        updateState('inactive')
      }

      mediaRecorder.value.onpause = () => {
        updateState('paused')
      }

      mediaRecorder.value.onresume = () => {
        updateState('recording')
      }

      // Iniciar grabación (enviar datos cada segundo)
      mediaRecorder.value.start(1000)
      
      return true
    } catch (err) {
      const recordingError = err instanceof Error ? err : new Error('Error desconocido al iniciar grabación')
      error.value = recordingError.message
      options.onError?.(recordingError)
      return false
    }
  }

  const pauseRecording = (): boolean => {
    if (mediaRecorder.value && recordingState.value === 'recording') {
      mediaRecorder.value.pause()
      return true
    }
    return false
  }

  const resumeRecording = (): boolean => {
    if (mediaRecorder.value && recordingState.value === 'paused') {
      mediaRecorder.value.resume()
      return true
    }
    return false
  }

  const stopRecording = (): boolean => {
    if (mediaRecorder.value && recordingState.value !== 'inactive') {
      mediaRecorder.value.stop()
      
      // Detener el stream
      if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
      }
      
      mediaRecorder.value = null
      return true
    }
    return false
  }

  const cleanup = () => {
    stopRecording()
  }

  return {
    // Estado
    isRecording: readonly(isRecording),
    isPaused: readonly(isPaused),
    recordingState: readonly(recordingState),
    error: readonly(error),
    
    // Métodos
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cleanup
  }
} 