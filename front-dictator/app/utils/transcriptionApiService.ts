export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TranscriptionApiOptions {
  baseUrl?: string
  getAuthToken?: () => string | null
}

export class TranscriptionApiService {
  private baseUrl: string
  private getAuthToken: () => string | null

  constructor(options: TranscriptionApiOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4000'
    this.getAuthToken = options.getAuthToken || (() => localStorage.getItem('auth-token'))
  }

  /**
   * Obtiene los headers estándar para las peticiones autenticadas
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Maneja errores de respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.msg || errorData.message || `Error ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Guarda una transcripción en tiempo real
   */
  async saveRealtimeTranscription(text: string, filename?: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/transcribe/realtime`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          text: text,
          filename: filename || `Transcripción - ${new Date().toLocaleString()}`
        })
      })

      return await this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al conectar con el servidor'
      }
    }
  }

  /**
   * Sube un archivo de audio para transcripción
   */
  async uploadAudioFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    try {
      const formData = new FormData()
      formData.append('audio', file)

      const token = this.getAuthToken()
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Si se proporciona callback de progreso, usar XMLHttpRequest para monitorear el progreso
      if (onProgress) {
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100
              onProgress(Math.round(percentComplete))
            }
          })

          xhr.addEventListener('load', async () => {
            try {
              const response = {
                ok: xhr.status >= 200 && xhr.status < 300,
                status: xhr.status,
                statusText: xhr.statusText,
                json: async () => JSON.parse(xhr.responseText)
              } as Response

              const result = await this.handleResponse(response)
              resolve(result)
            } catch (error) {
              resolve({
                success: false,
                error: 'Error al procesar la respuesta del servidor'
              })
            }
          })

          xhr.addEventListener('error', () => {
            resolve({
              success: false,
              error: 'Error de red al subir el archivo'
            })
          })

          xhr.open('POST', `${this.baseUrl}/api/transcribe`)
          
          // Agregar headers de autorización
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value)
          })

          xhr.send(formData)
        })
      } else {
        // Usar fetch estándar sin monitoreo de progreso
        const response = await fetch(`${this.baseUrl}/api/transcribe`, {
          method: 'POST',
          headers,
          body: formData
        })

        return await this.handleResponse(response)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir el archivo'
      }
    }
  }

  /**
   * Obtiene el historial de transcripciones
   */
  async getTranscriptionHistory(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/history`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al cargar el historial'
      }
    }
  }

  /**
   * Elimina una transcripción del servidor
   */
  async deleteTranscription(transcriptionId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/history/${transcriptionId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar la transcripción'
      }
    }
  }

  /**
   * Obtiene una transcripción específica por ID
   */
  async getTranscriptionById(transcriptionId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/history/${transcriptionId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener la transcripción'
      }
    }
  }

  /**
   * Actualiza una transcripción existente
   */
  async updateTranscription(transcriptionId: string, text: string, filename?: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/history/${transcriptionId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          text,
          filename
        })
      })

      return await this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar la transcripción'
      }
    }
  }

  /**
   * Verifica la conectividad con el servidor
   */
  async checkServerHealth(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return await this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: 'No se pudo conectar con el servidor'
      }
    }
  }

  /**
   * Obtiene información del usuario actual
   */
  async getCurrentUser(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener información del usuario'
      }
    }
  }

  /**
   * Cambia la URL base del servicio
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url
  }

  /**
   * Obtiene la URL base actual
   */
  getBaseUrl(): string {
    return this.baseUrl
  }
}

// Instancia por defecto del servicio
export const transcriptionApi = new TranscriptionApiService() 