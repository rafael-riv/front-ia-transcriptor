<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <CheckCircleIcon class="w-6 h-6 inline mr-2 text-green-600" />
          {{ title }}
        </h3>
        <button @click="$emit('close')" class="modal-close">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
      
      <div class="modal-body">
        <p class="modal-message">{{ message }}</p>
        <slot></slot>
      </div>
      
      <div class="modal-footer">
        <div class="actions-grid">
          <button 
            v-for="action in actions"
            :key="action.action"
            @click="handleAction(action.action)"
            class="action-btn"
            :class="{ 'primary': action.primary }"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface Action {
  label: string
  action: string
  primary?: boolean
}

interface Props {
  title: string
  message: string
  actions?: Action[]
}

interface Emits {
  (e: 'close'): void
  (e: 'action', action: string): void
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [{ label: 'Cerrar', action: 'close' }]
})

const emit = defineEmits<Emits>()

const handleOverlayClick = () => {
  emit('close')
}

const handleAction = (action: string) => {
  emit('action', action)
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.modal-container {
  @apply bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex justify-between items-center p-6 border-b border-green-200 bg-green-50;
}

.modal-title {
  @apply text-xl font-semibold text-green-800;
}

.modal-close {
  @apply text-green-400 hover:text-green-600 text-2xl font-bold bg-transparent border-none cursor-pointer;
}

.modal-body {
  @apply p-6;
}

.modal-message {
  @apply text-gray-700 leading-relaxed mb-4;
}

.modal-footer {
  @apply p-6 pt-0;
}

.actions-grid {
  @apply flex gap-3;
}

.action-btn {
  @apply flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 border cursor-pointer text-center;
}

.action-btn:not(.primary) {
  @apply bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200;
}

.action-btn.primary {
  @apply bg-green-500 text-white border-green-500 hover:bg-green-600;
}

@media (max-width: 640px) {
  .actions-grid {
    @apply flex-col;
  }
  
  .action-btn {
    @apply w-full;
  }
}
</style> 