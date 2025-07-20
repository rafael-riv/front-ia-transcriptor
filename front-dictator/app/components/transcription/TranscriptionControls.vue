<template>
  <div class="controls-section">
    <div class="main-controls">
      <button 
        @click="handleMainAction"
        class="main-action-btn"
        :class="buttonState.class"
        :disabled="disabled"
      >
        <PlayCircleIcon v-if="!isTranscribing" class="w-10 h-10 text-white" />
        <PlayCircleIcon v-else-if="isPaused" class="w-10 h-10 text-white" />
        <PauseCircleIcon v-else class="animate-pulse w-10 h-10 text-red-500" />
        <span class="sr-only">{{ buttonState.label }}</span>
      </button>

      <button 
        @click="handleStopAction"
        :disabled="!isTranscribing || disabled"
        class="stop-btn"
      >
        Finalizar Transcripción
      </button>
    </div>

    <div class="status-section">
      <p>
        <strong>Estado:</strong>
        <span :class="statusClass">{{ status }}</span>
      </p>
      
      <div v-if="showDuration && sessionDuration > 0" class="duration-info">
        <span>
          <ClockIcon class="w-4 h-4 inline mr-1" />
          Duración: {{ formatDuration(sessionDuration) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlayCircleIcon, PauseCircleIcon } from '@heroicons/vue/24/solid'
import { ClockIcon } from '@heroicons/vue/24/outline'

interface Props {
  isTranscribing: boolean
  isPaused: boolean
  isConnected: boolean
  status: string
  statusClass: string
  buttonState: {
    label: string
    class: string
  }
  sessionDuration?: number
  disabled?: boolean
  showDuration?: boolean
}

interface Emits {
  (e: 'main-action'): void
  (e: 'stop'): void
}

const props = withDefaults(defineProps<Props>(), {
  sessionDuration: 0,
  disabled: false,
  showDuration: true
})

const emit = defineEmits<Emits>()

const handleMainAction = () => {
  if (!props.disabled) {
    emit('main-action')
  }
}

const handleStopAction = () => {
  if (!props.disabled) {
    emit('stop')
  }
}

const formatDuration = (seconds: number): string => {
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
</script>

<style scoped>
.controls-section {
  @apply bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6;
}

.main-controls {
  @apply flex items-center gap-4 mb-4;
}

.main-action-btn {
  @apply flex items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 w-16 h-16 border-none cursor-pointer;
}

.main-action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.main-action-btn:not(:disabled):hover {
  @apply transform -translate-y-1 shadow-xl;
}

.stop-btn {
  @apply px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors duration-200 border-none cursor-pointer;
}

.stop-btn:disabled {
  @apply bg-gray-300 cursor-not-allowed;
}

.status-section {
  @apply flex items-center justify-between flex-wrap gap-2;
}

.status-section p {
  @apply text-sm font-medium text-gray-700 m-0;
}

.duration-info {
  @apply text-sm text-gray-600;
}

/* Classes para estados de status */
:deep(.status-recording) {
  @apply text-green-600 font-bold;
}

:deep(.status-paused) {
  @apply text-orange-500 font-bold;
}

:deep(.status-error) {
  @apply text-red-600 font-bold;
}

:deep(.status-stopped) {
  @apply text-gray-600;
}

@media (max-width: 640px) {
  .main-controls {
    @apply flex-col items-stretch gap-3;
  }
  
  .main-action-btn {
    @apply w-14 h-14 self-center;
  }
  
  .status-section {
    @apply flex-col items-start;
  }
}
</style> 