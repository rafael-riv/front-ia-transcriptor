<template>
  <div class="progress-container">
    <div class="progress-header">
      <h4 class="progress-title">{{ stage }}</h4>
      <span class="progress-percentage">{{ progress }}%</span>
    </div>
    
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: `${progress}%` }"
        :class="progressBarClass"
      ></div>
    </div>
    
    <div class="progress-info">
      <span class="progress-message">{{ message }}</span>
      <span class="progress-eta" v-if="estimatedTime">
        <ClockIcon class="w-4 h-4 inline mr-1" />
        {{ estimatedTime }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ClockIcon } from '@heroicons/vue/24/outline'

interface Props {
  progress: number
  stage: string
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: ''
})

// Computadas
const progressBarClass = computed(() => {
  if (props.progress < 30) return 'progress-uploading'
  if (props.progress < 60) return 'progress-processing'
  if (props.progress < 90) return 'progress-transcribing'
  return 'progress-completing'
})

const estimatedTime = computed(() => {
  if (props.progress < 10) return '2-3 minutos'
  if (props.progress < 30) return '1-2 minutos'
  if (props.progress < 60) return '30-60 segundos'
  if (props.progress < 90) return '10-30 segundos'
  return 'Casi listo...'
})
</script>

<style scoped>
.progress-container {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mt-6;
}

.progress-header {
  @apply flex justify-between items-center mb-4;
}

.progress-title {
  @apply text-lg font-semibold text-blue-800;
}

.progress-percentage {
  @apply text-xl font-bold text-blue-600;
}

.progress-bar {
  @apply w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4;
}

.progress-fill {
  @apply h-full transition-all duration-500 ease-out;
}

.progress-uploading {
  @apply bg-gradient-to-r from-yellow-400 to-orange-500;
}

.progress-processing {
  @apply bg-gradient-to-r from-blue-400 to-blue-600;
}

.progress-transcribing {
  @apply bg-gradient-to-r from-purple-400 to-purple-600;
}

.progress-completing {
  @apply bg-gradient-to-r from-green-400 to-green-600;
}

.progress-info {
  @apply flex justify-between items-center text-sm;
}

.progress-message {
  @apply text-blue-700 font-medium;
}

.progress-eta {
  @apply text-blue-600 bg-blue-100 px-2 py-1 rounded;
}

@media (max-width: 640px) {
  .progress-info {
    @apply flex-col items-start gap-2;
  }
}
</style> 