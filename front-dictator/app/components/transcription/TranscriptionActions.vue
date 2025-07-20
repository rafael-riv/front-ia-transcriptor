<template>
  <div class="transcription-actions">
    <div class="actions-header">
      <h4 class="actions-title">
        <WrenchScrewdriverIcon class="w-5 h-5 inline mr-2" />
        Acciones Disponibles
      </h4>
      <span class="actions-subtitle">Elige qué hacer con tu transcripción</span>
    </div>

    <div class="actions-content">
      <!-- Acciones Principales -->
      <div class="action-group primary-group">
        <h5 class="group-title">
          <FireIcon class="w-4 h-4 inline mr-1" />
          Acciones Principales
        </h5>
        <div class="actions-grid">
          <button 
            @click="$emit('save', transcription)"
            :disabled="isLoading || !canSave"
            class="action-btn save-btn"
            title="Guardar transcripción permanentemente en el historial"
          >
            <span v-if="isLoading" class="btn-content">
              <ArrowPathIcon class="w-4 h-4 animate-spin mr-1" />
              Guardando...
            </span>
            <span v-else class="btn-content">
              <ServerIcon class="w-4 h-4 mr-1" />
              Guardar en Historial
            </span>
          </button>

          <button 
            @click="$emit('download', transcription)"
            class="action-btn download-btn"
            title="Descargar como archivo de texto"
          >
            <span class="btn-content">
              <FolderArrowDownIcon class="w-4 h-4 mr-1" />
              Descargar TXT
            </span>
          </button>

          <button 
            @click="$emit('copy', transcription.text)"
            :disabled="!transcription.text"
            class="action-btn copy-btn"
            title="Copiar texto al portapapeles"
          >
            <span class="btn-content">
              <ClipboardDocumentIcon class="w-4 h-4 mr-1" />
              Copiar Texto
            </span>
          </button>
        </div>
      </div>

      <!-- Acciones Secundarias -->
      <div class="action-group secondary-group">
        <h5 class="group-title">
          <CogIcon class="w-4 h-4 inline mr-1" />
          Opciones Adicionales
        </h5>
        <div class="actions-grid secondary">
          <button 
            @click="$emit('download-json', transcription)"
            class="action-btn json-btn"
            title="Descargar con metadatos completos en formato JSON"
          >
            <span class="btn-content">
              <CodeBracketIcon class="w-4 h-4 mr-1" />
              Descargar JSON
            </span>
          </button>

          <button 
            @click="$emit('share', transcription)"
            class="action-btn share-btn"
            title="Compartir transcripción usando Web Share API"
          >
            <span class="btn-content">
              <ShareIcon class="w-4 h-4 mr-1" />
              Compartir
            </span>
          </button>

          <button 
            @click="$emit('delete')"
            class="action-btn delete-btn"
            title="Eliminar esta transcripción"
          >
            <span class="btn-content">
              <TrashIcon class="w-4 h-4 mr-1" />
              Eliminar
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Información de Ayuda -->
    <div class="actions-info">
      <div class="info-item">
        <LightBulbIcon class="info-icon w-5 h-5" />
        <span class="info-text">
          <strong>Consejo:</strong> Guarda tu transcripción para acceder a ella desde cualquier dispositivo
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TranscriptionData } from './TranscriptionPreview.vue'
import { 
  WrenchScrewdriverIcon,
  FireIcon,
  ArrowPathIcon,
  ServerIcon,
  FolderArrowDownIcon,
  ClipboardDocumentIcon,
  CogIcon,
  CodeBracketIcon,
  ShareIcon,
  TrashIcon,
  LightBulbIcon
} from '@heroicons/vue/24/outline'

interface Props {
  transcription: TranscriptionData
  isLoading?: boolean
  canSave?: boolean
}

interface Emits {
  (e: 'save', transcription: TranscriptionData): void
  (e: 'download', transcription: TranscriptionData): void
  (e: 'download-json', transcription: TranscriptionData): void
  (e: 'copy', text: string): void
  (e: 'share', transcription: TranscriptionData): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  canSave: true
})

defineEmits<Emits>()
</script>

<style scoped>
.transcription-actions {
  @apply bg-gray-50 border-t border-gray-200 p-6 space-y-6;
}

.actions-header {
  @apply text-center space-y-1;
}

.actions-title {
  @apply text-lg font-semibold text-gray-800;
}

.actions-subtitle {
  @apply text-sm text-gray-600;
}

.actions-content {
  @apply space-y-6;
}

.action-group {
  @apply space-y-3;
}

.group-title {
  @apply text-sm font-semibold text-gray-700 flex items-center gap-2;
}

.actions-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-3;
}

.actions-grid.secondary {
  @apply md:grid-cols-3;
}

.action-btn {
  @apply flex items-center justify-center p-4 rounded-lg font-medium transition-all duration-200 border-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-content {
  @apply flex items-center justify-center gap-2 text-sm;
}

/* Estilos específicos para cada tipo de botón */
.save-btn {
  @apply bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300;
}

.save-btn:disabled {
  @apply bg-gray-100 text-gray-500 border-gray-200;
}

.download-btn {
  @apply bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300;
}

.copy-btn {
  @apply bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300;
}

.copy-btn:disabled {
  @apply bg-gray-100 text-gray-500 border-gray-200;
}

.json-btn {
  @apply bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300;
}

.share-btn {
  @apply bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:border-teal-300;
}

.delete-btn {
  @apply bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300;
}

.actions-info {
  @apply pt-4 border-t border-gray-200;
}

.info-item {
  @apply flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200;
}

.info-icon {
  @apply flex-shrink-0 text-blue-500;
}

.info-text {
  @apply text-sm text-blue-800 leading-relaxed;
}

/* Responsive */
@media (max-width: 768px) {
  .actions-grid {
    @apply grid-cols-1;
  }
  
  .action-btn {
    @apply p-3;
  }
  
  .btn-content {
    @apply text-base;
  }
}

/* Hover effects */
.action-btn:hover:not(:disabled) {
  @apply transform scale-105 shadow-md;
}

.action-btn:active:not(:disabled) {
  @apply transform scale-95;
}

/* Focus states */
.action-btn:focus {
  @apply outline-none ring-2 ring-offset-2;
}

.save-btn:focus {
  @apply ring-green-500;
}

.download-btn:focus {
  @apply ring-blue-500;
}

.copy-btn:focus {
  @apply ring-purple-500;
}

.json-btn:focus {
  @apply ring-indigo-500;
}

.share-btn:focus {
  @apply ring-teal-500;
}

.delete-btn:focus {
  @apply ring-red-500;
}
</style> 