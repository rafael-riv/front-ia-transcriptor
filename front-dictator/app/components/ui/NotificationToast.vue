<template>
  <div 
    class="notification-toast"
    :class="[typeClass, { 'closing': isClosing }]"
    @click="handleClick"
  >
    <div class="toast-content">
      <component :is="iconByType" class="toast-icon w-5 h-5 flex-shrink-0" />
      <span class="toast-message">{{ message }}</span>
    </div>
    
    <button 
      @click.stop="closeToast"
      class="toast-close"
      title="Cerrar notificación"
    >
      <XMarkIcon class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface Props {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  clickable?: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 4000,
  clickable: true
})

const emit = defineEmits<Emits>()

const isClosing = ref(false)

const typeClass = computed(() => `toast-${props.type}`)

const iconByType = computed(() => {
  const iconComponents = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  }
  return iconComponents[props.type]
})

const closeToast = () => {
  isClosing.value = true
  setTimeout(() => {
    emit('close')
  }, 150) // Tiempo para la animación de cierre
}

const handleClick = () => {
  if (props.clickable) {
    closeToast()
  }
}

// Auto close después del duration especificado
onMounted(() => {
  if (props.duration > 0) {
    setTimeout(() => {
      closeToast()
    }, props.duration)
  }
})
</script>

<style scoped>
.notification-toast {
  @apply fixed top-4 right-4 z-50 bg-white border-l-4 rounded-lg shadow-lg p-4 max-w-sm cursor-pointer transition-all duration-300 ease-out;
  animation: slideIn 0.3s ease-out;
}

.notification-toast.closing {
  animation: slideOut 0.15s ease-in forwards;
}

.toast-content {
  @apply flex items-center gap-3;
}

.toast-icon {
  @apply flex-shrink-0;
}

.toast-message {
  @apply text-gray-800 font-medium leading-relaxed;
}

.toast-close {
  @apply absolute top-2 right-2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-lg font-bold p-1 rounded;
}

/* Variantes de tipo */
.toast-success {
  @apply border-green-500 bg-green-50;
}

.toast-success .toast-message {
  @apply text-green-800;
}

.toast-success .toast-icon {
  @apply text-green-600;
}

.toast-error {
  @apply border-red-500 bg-red-50;
}

.toast-error .toast-message {
  @apply text-red-800;
}

.toast-error .toast-icon {
  @apply text-red-600;
}

.toast-warning {
  @apply border-yellow-500 bg-yellow-50;
}

.toast-warning .toast-message {
  @apply text-yellow-800;
}

.toast-warning .toast-icon {
  @apply text-yellow-600;
}

.toast-info {
  @apply border-blue-500 bg-blue-50;
}

.toast-info .toast-message {
  @apply text-blue-800;
}

.toast-info .toast-icon {
  @apply text-blue-600;
}

/* Animaciones */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 640px) {
  .notification-toast {
    @apply left-4 right-4 max-w-none;
  }
}

/* Hover effects */
.notification-toast:hover {
  @apply shadow-xl;
}

.toast-close:hover {
  @apply bg-gray-200;
}
</style> 