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

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startIndex: number
  endIndex: number
}

export interface FilterOptions {
  search?: string
  type?: 'all' | 'recent' | 'old'
  sortBy?: 'newest' | 'oldest' | 'longest' | 'shortest'
  startDate?: string
  endDate?: string
}

export interface HistoryStatistics {
  totalDocuments: number
  totalWords: number
  totalCharacters: number
  avgWordsPerDoc: number
  avgCharactersPerDoc: number
  longestText: number
  shortestText: number
}

export interface UseTranscriptionHistoryOptions {
  apiBaseUrl?: string
  autoLoad?: boolean
  initialPageSize?: number
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}

export function useTranscriptionHistory(options: UseTranscriptionHistoryOptions = {}) {
  const transcriptions = ref<TranscriptionItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: options.initialPageSize || 10,
    hasNextPage: false,
    hasPrevPage: false,
    startIndex: 0,
    endIndex: 0
  })
  const statistics = ref<HistoryStatistics>({
    totalDocuments: 0,
    totalWords: 0,
    totalCharacters: 0,
    avgWordsPerDoc: 0,
    avgCharactersPerDoc: 0,
    longestText: 0,
    shortestText: 0
  })
  const currentFilters = ref<FilterOptions>({})
  
  const apiBaseUrl = options.apiBaseUrl || 'http://localhost:4000'

  const getAuthToken = (): string | null => {
    return localStorage.getItem('auth-token')
  }

  const buildQueryParams = (page: number = 1, limit: number = 10, filters: FilterOptions = {}) => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (filters.search) params.append('search', filters.search)
    if (filters.type && filters.type !== 'all') params.append('type', filters.type)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    
    return params
  }

  const loadFromDatabase = async (
    page: number = 1, 
    limit: number = pagination.value.limit,
    filters: FilterOptions = {}
  ): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const token = getAuthToken()
      if (!token) {
        console.log('No token found, skipping history load')
        transcriptions.value = []
        return false
      }

      const queryParams = buildQueryParams(page, limit, filters)
      const response = await fetch(`${apiBaseUrl}/api/history?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()

        // Convertir las transcripciones de la DB al formato local
        transcriptions.value = result.data
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

        // Actualizar información de paginación
        pagination.value = result.pagination
        
        // Actualizar estadísticas si están disponibles
        if (result.statistics) {
          statistics.value = result.statistics
        }

        // Guardar filtros actuales
        currentFilters.value = filters

        console.log(`Historial cargado: página ${page}, ${transcriptions.value.length} transcripciones de ${pagination.value.totalCount}`)
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

  const loadPage = async (page: number): Promise<boolean> => {
    return await loadFromDatabase(page, pagination.value.limit, currentFilters.value)
  }

  const changePageSize = async (newLimit: number): Promise<boolean> => {
    pagination.value.limit = newLimit
    return await loadFromDatabase(1, newLimit, currentFilters.value)
  }

  const applyFilters = async (filters: FilterOptions): Promise<boolean> => {
    return await loadFromDatabase(1, pagination.value.limit, filters)
  }

  const loadStatistics = async (): Promise<boolean> => {
    try {
      const token = getAuthToken()
      if (!token) {
        return false
      }

      const response = await fetch(`${apiBaseUrl}/api/history/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const stats = await response.json()
        statistics.value = stats
        return true
      } else {
        console.error('Error loading statistics:', response.status)
        return false
      }
    } catch (err) {
      console.error('Error loading statistics:', err)
      return false
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
        
        // Recargar el historial actual para obtener la versión guardada
        await loadFromDatabase(pagination.value.currentPage, pagination.value.limit, currentFilters.value)
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
      // Si tiene _id, está en la base de datos - usar el endpoint del servidor
      options.onError?.('Use deleteServerItem para eliminar transcripciones del servidor')
      return false
    } else {
      // Es una transcripción temporal, eliminar solo del historial local
      transcriptions.value = transcriptions.value.filter(item => item.id !== id)
      options.onSuccess?.('Transcripción eliminada localmente')
      return true
    }
  }

  const deleteServerItem = async (id: string): Promise<boolean> => {
    const item = transcriptions.value.find(item => item._id === id || item.id === id)
    
    if (!item || !item._id) {
      options.onError?.('La transcripción no existe en el servidor')
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const token = getAuthToken()
      if (!token) {
        const errorMsg = 'No estás autenticado. Por favor, inicia sesión.'
        error.value = errorMsg
        options.onError?.(errorMsg)
        return false
      }

      const response = await fetch(`${apiBaseUrl}/api/history/${item._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Eliminar del historial local
        transcriptions.value = transcriptions.value.filter(t => t._id !== item._id)
        
        // Actualizar la paginación después de eliminar
        if (transcriptions.value.length === 0 && pagination.value.currentPage > 1) {
          // Si no quedan elementos en la página actual, ir a la anterior
          await loadPage(pagination.value.currentPage - 1)
        } else {
          // Recargar la página actual para actualizar la numeración
          await loadPage(pagination.value.currentPage)
        }
        
        options.onSuccess?.('Transcripción eliminada del servidor')
        return true
      } else {
        const errorData = await response.json()
        const errorMsg = `Error al eliminar: ${errorData.msg || 'Error desconocido'}`
        error.value = errorMsg
        options.onError?.(errorMsg)
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al conectar con el servidor'
      error.value = errorMsg
      console.error('Error al eliminar transcripción:', err)
      options.onError?.(errorMsg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearLocalHistory = async (): Promise<boolean> => {
    // Limpiar solo las transcripciones temporales
    transcriptions.value = transcriptions.value.filter(item => !!item._id)
    options.onSuccess?.('Transcripciones temporales eliminadas')
    
    // Recargar desde la base de datos para mantener solo las guardadas
    return await loadFromDatabase(1, pagination.value.limit, currentFilters.value)
  }

  const findById = (id: string): TranscriptionItem | undefined => {
    return transcriptions.value.find(item => item.id === id || item._id === id)
  }

  const getTemporaryTranscriptions = (): TranscriptionItem[] => {
    return transcriptions.value.filter(item => !item._id)
  }

  const getSavedTranscriptions = (): TranscriptionItem[] => {
    return transcriptions.value.filter(item => !!item._id)
  }

  const refresh = async (): Promise<boolean> => {
    return await loadFromDatabase(pagination.value.currentPage, pagination.value.limit, currentFilters.value)
  }

  const getTranscriptionsByDateRange = (startDate: Date, endDate: Date): TranscriptionItem[] => {
    return transcriptions.value.filter(item => {
      const itemDate = new Date(item.startTime)
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  const searchTranscriptions = (query: string): TranscriptionItem[] => {
    if (!query.trim()) return transcriptions.value

    const searchTerm = query.toLowerCase()
    return transcriptions.value.filter(item => 
      item.text?.toLowerCase().includes(searchTerm) ||
      item.filename?.toLowerCase().includes(searchTerm) ||
      item.timestamp?.toLowerCase().includes(searchTerm)
    )
  }

  const getStatistics = () => {
    return statistics.value
  }

  const exportToFormat = (format: 'txt' | 'json' | 'csv') => {
    const items = transcriptions.value.filter(item => item.text)
    
    if (items.length === 0) {
      options.onError?.('No hay transcripciones para exportar')
      return null
    }

    let content = ''
    let mimeType = ''
    let extension = ''

    switch (format) {
      case 'txt':
        content = items.map((item, index) => {
          const separator = '='.repeat(50)
          const header = `TRANSCRIPCIÓN #${index + 1}`
          const filename = item.filename || 'Sin nombre'
          const timestamp = item.timestamp
          const wordCount = item.text!.trim().split(/\s+/).length
          const charCount = item.text!.length
          
          return `${separator}\n${header}\n${separator}\nArchivo: ${filename}\nFecha: ${timestamp}\nPalabras: ${wordCount}\nCaracteres: ${charCount}\n\n${item.text}\n\n`
        }).join('')
        mimeType = 'text/plain;charset=utf-8'
        extension = 'txt'
        break

      case 'json':
        content = JSON.stringify(items.map(item => ({
          ...item,
          metadata: {
            wordCount: item.text!.trim().split(/\s+/).length,
            characterCount: item.text!.length,
            exportedAt: new Date().toISOString()
          }
        })), null, 2)
        mimeType = 'application/json;charset=utf-8'
        extension = 'json'
        break

      case 'csv':
        const headers = ['ID', 'Filename', 'Text', 'Timestamp', 'Words', 'Characters', 'Duration']
        const csvRows = items.map(item => [
          item.id,
          item.filename || 'Sin nombre',
          `"${item.text!.replace(/"/g, '""')}"`,
          item.timestamp,
          item.text!.trim().split(/\s+/).length,
          item.text!.length,
          item.duration || 'N/A'
        ])
        
        content = [headers, ...csvRows].map(row => row.join(',')).join('\n')
        mimeType = 'text/csv;charset=utf-8'
        extension = 'csv'
        break
    }

    return {
      content,
      mimeType,
      filename: `historial_transcripciones_${new Date().toISOString().slice(0, 10)}.${extension}`
    }
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
    pagination: readonly(pagination),
    statistics: readonly(statistics),
    currentFilters: readonly(currentFilters),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Métodos principales de paginación
    loadFromDatabase,
    loadPage,
    changePageSize,
    applyFilters,
    loadStatistics,
    
    // Métodos de gestión
    addLocalTranscription,
    saveTranscription,
    saveExistingItem,
    deleteLocalItem,
    deleteServerItem,
    clearLocalHistory,
    refresh,
    
    // Utilidades de búsqueda y filtrado (lado cliente para compatibilidad)
    findById,
    getTemporaryTranscriptions,
    getSavedTranscriptions,
    getTranscriptionsByDateRange,
    searchTranscriptions,
    
    // Estadísticas y exportación
    getStatistics,
    exportToFormat,
    
    // Getters computados
    count: () => transcriptions.value.length,
    totalCount: () => pagination.value.totalCount,
    hasTemporary: () => transcriptions.value.some(item => !item._id),
    hasSaved: () => transcriptions.value.some(item => !!item._id)
  }
} 