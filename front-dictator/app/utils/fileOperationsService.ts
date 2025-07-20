export interface DownloadOptions {
  filename?: string
  addTimestamp?: boolean
  extension?: string
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
  fileInfo?: {
    name: string
    size: number
    type: string
    sizeFormatted: string
  }
}

export class FileOperationsService {
  
  /**
   * Descarga un texto como archivo
   */
  static downloadText(text: string, baseFilename: string, options: DownloadOptions = {}): void {
    const {
      addTimestamp = true,
      extension = 'txt'
    } = options

    let filename = baseFilename
    
    if (addTimestamp) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      filename = `${baseFilename}_${timestamp}`
    }
    
    filename = `${filename}.${extension}`

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    this.downloadBlob(blob, filename)
  }

  /**
   * Descarga un Blob como archivo
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    // Limpiar la URL del objeto
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * Descarga múltiples transcripciones como un archivo unificado
   */
  static downloadMultipleTranscriptions(
    transcriptions: Array<{
      text: string
      timestamp: string
      duration?: string
      filename?: string
    }>,
    baseFilename: string = 'historial_completo'
  ): void {
    if (transcriptions.length === 0) {
      throw new Error('No hay transcripciones para descargar')
    }

    const content = transcriptions
      .map((item, index) => {
        const header = `=== Transcripción #${index + 1} ===`
        const metadata = [
          `Fecha: ${item.timestamp}`,
          `Duración: ${item.duration || 'N/A'}`,
          `Archivo: ${item.filename || 'Sin nombre'}`
        ].join('\n')
        
        return `${header}\n${metadata}\n\n${item.text}\n\n${'='.repeat(50)}\n`
      })
      .join('\n')

    this.downloadText(content, baseFilename)
  }

  /**
   * Valida un archivo de audio
   */
  static validateAudioFile(file: File): FileValidationResult {
    // Tipos válidos de audio
    const validTypes = [
      'audio/mp3', 
      'audio/mpeg', 
      'audio/wav', 
      'audio/ogg', 
      'audio/aac', 
      'audio/m4a',
      'audio/webm'
    ]
    
    // Extensiones válidas
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm']
    
    // Verificar tipo MIME
    const hasValidMimeType = validTypes.some(type => 
      file.type.includes(type.split('/')[1])
    )
    
    // Verificar extensión
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidMimeType && !hasValidExtension) {
      return {
        isValid: false,
        error: 'Tipo de archivo no válido. Se permiten: .mp3, .wav, .m4a, .aac, .ogg, .webm'
      }
    }

    // Validar tamaño (máximo 50MB por defecto)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Máximo ${this.formatFileSize(maxSize)} permitido.`
      }
    }

    // Archivo válido
    return {
      isValid: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeFormatted: this.formatFileSize(file.size)
      }
    }
  }

  /**
   * Formatea el tamaño de archivo en formato legible
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  /**
   * Genera un nombre de archivo único con timestamp
   */
  static generateFilename(baseName: string, extension: string = 'txt'): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    return `${baseName}_${timestamp}.${extension}`
  }

  /**
   * Copia texto al portapapeles
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    if (!text?.trim()) {
      throw new Error('No hay texto para copiar')
    }

    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error)
      
      // Fallback para navegadores más antiguos
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        return successful
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
        throw new Error('No se pudo copiar al portapapeles')
      }
    }
  }

  /**
   * Descarga una transcripción individual
   */
  static downloadTranscription(
    text: string, 
    filename?: string, 
    index?: number
  ): void {
    if (!text?.trim()) {
      throw new Error('No hay texto para descargar')
    }

    const baseName = filename || `transcripcion${index ? `_${index}` : ''}`
    this.downloadText(text, baseName)
  }

  /**
   * Valida y prepara un archivo para subida
   */
  static prepareFileForUpload(file: File): Promise<{ isValid: boolean; file?: File; error?: string }> {
    return new Promise((resolve) => {
      const validation = this.validateAudioFile(file)
      
      if (!validation.isValid) {
        resolve({
          isValid: false,
          error: validation.error
        })
        return
      }

      // Aquí se podrían agregar más validaciones o transformaciones
      resolve({
        isValid: true,
        file: file
      })
    })
  }

  /**
   * Convierte duración en segundos a formato legible
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const remainingMinutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${remainingMinutes}m`
    }
  }

  /**
   * Calcula la duración entre dos fechas
   */
  static calculateDuration(startTime: Date, endTime: Date): string {
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationSeconds = Math.round(durationMs / 1000)
    return this.formatDuration(durationSeconds)
  }
} 