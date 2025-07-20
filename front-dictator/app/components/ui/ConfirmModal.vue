<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header" :class="{ 'danger': danger }">
        <h3 class="modal-title">{{ title }}</h3>
        <button @click="$emit('cancel')" class="modal-close">✕</button>
      </div>
      
      <div class="modal-body">
        <p class="modal-message">{{ message }}</p>
        <slot></slot>
      </div>
      
      <div class="modal-footer">
        <button 
          @click="$emit('cancel')"
          class="modal-btn cancel-btn"
        >
          {{ cancelText }}
        </button>
        
        <button 
          @click="$emit('confirm')"
          class="modal-btn confirm-btn"
          :class="{ 'danger': danger }"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  danger: false
})

const emit = defineEmits<Emits>()

const handleOverlayClick = () => {
  // Solo cerrar si se hace clic directamente en el overlay
  emit('cancel')
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.modal-container {
  @apply bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50;
}

.modal-header.danger {
  @apply bg-red-50 border-red-200;
}

.modal-title {
  @apply text-xl font-semibold text-gray-800;
}

.modal-header.danger .modal-title {
  @apply text-red-800;
}

.modal-close {
  @apply text-gray-400 hover:text-gray-600 text-2xl font-bold bg-transparent border-none cursor-pointer;
}

.modal-body {
  @apply p-6;
}

.modal-message {
  @apply text-gray-700 leading-relaxed;
}

.modal-footer {
  @apply flex gap-3 p-6 pt-0;
}

.modal-btn {
  @apply flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 border cursor-pointer;
}

.cancel-btn {
  @apply bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200;
}

.confirm-btn {
  @apply bg-blue-500 text-white border-blue-500 hover:bg-blue-600;
}

.confirm-btn.danger {
  @apply bg-red-500 border-red-500 hover:bg-red-600;
}

@media (max-width: 640px) {
  .modal-footer {
    @apply flex-col;
  }
  
  .modal-btn {
    @apply w-full;
  }
}
</style> 