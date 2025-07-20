import { ref, readonly, onMounted } from 'vue'

export interface TranscriptionItem {
  id: string
  text: string
  timestamp: string
  duration?: string
  startTime: Date
  endTime: Date
  _id?: string // ID de la base de datos
  createdAt?: string // Fecha de creación desde la DB
  filename?: string // Nombre del archivo desde la DB
}

export interface UseTranscriptionHistoryOptions {
  apiBaseUrl?: string
  autoLoad?: boolean
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}

export function useTranscriptionHistory(options: UseTranscriptionHistoryOptions = {}) {
  const transcriptions = ref<TranscriptionItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const apiBaseUrl = options.apiBaseUrl || 'http://localhost:4000'

  const getAuthToken = (): string | null => {
    return localStorage.getItem('auth-token')
  }

  const loadFromDatabase = async (): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const token = getAuthToken()
      if (!token) {
        console.log('No token found, skipping history load')
        transcriptions.value = []
        return false
      }

      const response = await fetch(`${apiBaseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const dbTranscripts = await response.json()

        // Convertir las transcripciones de la DB al formato local
        transcriptions.value = dbTranscripts
          .filter((item: any) => item.text && item.text.trim()) // Solo transcripciones con texto
          .map((item: any) => ({
            id: item._id,
            _id: item._id,
            text: item.text,
            filename: item.filename,
            timestamp: new Date(item.createdAt).toLocaleString(),
            duration: 'Guardado',
            startTime: new Date(item.createdAt),
            endTime: new Date(item.updatedAt || item.createdAt),
            createdAt: item.createdAt
          }))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        console.log(`Historial cargado: ${transcriptions.value.length} transcripciones`)
        return true
      } else {
        const errorMsg = `Error al cargar historial: ${response.status}`
        error.value = errorMsg
        options.onError?.(errorMsg)
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al cargar historial'
      error.value = errorMsg
      console.error('Error al cargar historial desde la base de datos:', err)
      options.onError?.(errorMsg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const addLocalTranscription = (text: string, startTime: Date, endTime: Date): TranscriptionItem => {
    const duration = `${Math.round((endTime.getTime() - startTime.getTime()) / 1000)}s`
    
    const newTranscription: TranscriptionItem = {
      id: `temp_transcript_${Date.now()}`, // ID temporal hasta que se guarde
      text: text.trim(),
      timestamp: endTime.toLocaleString(),
      duration,
      startTime,
      endTime
    }

    // Agregar al inicio del historial
    transcriptions.value.unshift(newTranscription)
    
    return newTranscription
  }

  const saveTranscription = async (text: string, filename?: string): Promise<boolean> => {
    try {
      const token = getAuthToken()
      if (!token) {
        const errorMsg = 'No estás autenticado. Por favor, inicia sesión.'
        error.value = errorMsg
        options.onError?.(errorMsg)
        return false
      }

      const response = await fetch(`${apiBaseUrl}/api/transcribe/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text,
          filename: filename || `Transcripción - ${new Date().toLocaleString()}`
        })
      })

      if (response.ok) {
        const result = await response.json()
        options.onSuccess?.('Transcripción guardada exitosamente')
        console.log('Transcripción guardada:', result)
        
        // Recargar el historial para obtener la versión guardada
        await loadFromDatabase()
        return true
      } else {
        const errorData = await response.json()
        const errorMsg = `Error al guardar: ${errorData.msg || 'Error desconocido'}`
        error.value = errorMsg
        options.onError?.(errorMsg)
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al conectar con el servidor'
      error.value = errorMsg
      console.error('Error al guardar transcripción:', err)
      options.onError?.(errorMsg)
      return false
    }
  }

  const saveExistingItem = async (item: TranscriptionItem): Promise<boolean> => {
    // Solo guardar si es una transcripción temporal (no guardada)
    if (!item._id && item.id.startsWith('temp_')) {
      const index = transcriptions.value.indexOf(item)
      const filename = `Transcripción #${index + 1}`
      return await saveTranscription(item.text, filename)
    } else {
      options.onError?.('Esta transcripción ya está guardada en el servidor')
      return false
    }
  }

  const deleteLocalItem = (id: string): boolean => {
    const item = transcriptions.value.find(item => item.id === id)
    
    if (item && item._id) {
      // Si tiene _id, está en la base de datos
      options.onError?.('Funcionalidad de eliminación del servidor no implementada aún')
      return false
    } else {
      // Es una transcripción temporal, eliminar solo del historial local
      transcriptions.value = transcriptions.value.filter(item => item.id !== id)
      return true
    }
  }

  const clearLocalHistory = async (): Promise<boolean> => {
    transcriptions.value = []
    // Recargar desde la base de datos para mantener solo las guardadas
    return await loadFromDatabase()
  }

  const findById = (id: string): TranscriptionItem | undefined => {
    return transcriptions.value.find(item => item.id === id)
  }

  const getTemporaryTranscriptions = (): TranscriptionItem[] => {
    return transcriptions.value.filter(item => !item._id)
  }

  const getSavedTranscriptions = (): TranscriptionItem[] => {
    return transcriptions.value.filter(item => !!item._id)
  }

  const refresh = async (): Promise<boolean> => {
    return await loadFromDatabase()
  }

  // Auto-cargar al montar si está habilitado
  if (options.autoLoad !== false) {
    onMounted(() => {
      loadFromDatabase()
    })
  }

  return {
    // Estado
    transcriptions: readonly(transcriptions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Métodos principales
    loadFromDatabase,
    addLocalTranscription,
    saveTranscription,
    saveExistingItem,
    deleteLocalItem,
    clearLocalHistory,
    refresh,
    
    // Utilidades
    findById,
    getTemporaryTranscriptions,
    getSavedTranscriptions,
    
    // Getters computados
    count: () => transcriptions.value.length,
    hasTemporary: () => transcriptions.value.some(item => !item._id),
    hasSaved: () => transcriptions.value.some(item => !!item._id)
  }
} 