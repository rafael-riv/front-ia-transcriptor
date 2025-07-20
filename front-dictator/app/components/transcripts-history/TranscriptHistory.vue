<template>
  <div class="history-container">
    <!-- Header del Historial -->
    <div class="history-header">
      <div class="header-content">
        <h1 class="history-title">
          <ClipboardDocumentListIcon class="w-8 h-8 inline mr-2" />
          Historial de Transcripciones
          <span v-if="transcriptionHistory.count() > 0" class="count-badge">
            {{ transcriptionHistory.count() }}
          </span>
        </h1>
        
        <div class="header-actions">
          <button 
            @click="refreshHistory"
            :disabled="isLoading"
            class="action-btn refresh-btn"
            title="Actualizar historial"
          >
            <ArrowPathIcon v-if="isLoading" class="w-4 h-4 mr-1 animate-spin" />
            <ArrowPathIcon v-else class="w-4 h-4 mr-1" />
            Actualizar
          </button>
          
          <button 
            @click="showFilters = !showFilters"
            class="action-btn filter-btn"
            :class="{ active: showFilters }"
            title="Mostrar/ocultar filtros"
          >
            <MagnifyingGlassIcon class="w-4 h-4 mr-1" />
            Filtros
            </button>
        </div>
      </div>

      <!-- Estadísticas Rápidas -->
      <div class="stats-bar">
        <div class="stat-item">
          <DocumentIcon class="stat-icon w-6 h-6" />
          <div class="stat-info">
            <span class="stat-number">{{ statistics.totalDocuments }}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
        
        <div class="stat-item">
          <PencilIcon class="stat-icon w-6 h-6" />
          <div class="stat-info">
            <span class="stat-number">{{ transcriptionHistory.getTemporaryTranscriptions().length }}</span>
            <span class="stat-label">Temporales</span>
          </div>
        </div>
        
        <div class="stat-item">
          <ChartBarIcon class="stat-icon w-6 h-6" />
          <div class="stat-info">
            <span class="stat-number">{{ totalWords }}</span>
            <span class="stat-label">Palabras</span>
          </div>
        </div>
        
        <div class="stat-item">
          <LanguageIcon class="stat-icon w-6 h-6" />
          <div class="stat-info">
            <span class="stat-number">{{ totalCharacters }}</span>
            <span class="stat-label">Caracteres</span>
          </div>
        </div>
        
        <div class="stat-item">
          <CalculatorIcon class="stat-icon w-6 h-6" />
          <div class="stat-info">
            <span class="stat-number">{{ statistics.avgWordsPerDoc }}</span>
            <span class="stat-label">Promedio</span>
          </div>
        </div>
      </div>

      <!-- Panel de Filtros -->
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-row">
          <div class="filter-group">
            <label class="filter-label">
              <MagnifyingGlassIcon class="w-4 h-4 inline mr-1" />
              Buscar:
            </label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar en transcripciones..."
              class="filter-input"
            />
          </div>
          
          <div class="filter-group">
            <label class="filter-label">
              <FolderIcon class="w-4 h-4 inline mr-1" />
              Período:
            </label>
            <select v-model="filterType" class="filter-select">
              <option value="all">Todas</option>
              <option value="recent">Recientes (7 días)</option>
              <option value="old">Antiguas (>30 días)</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">
              <CalendarIcon class="w-4 h-4 inline mr-1" />
              Ordenar:
            </label>
            <select v-model="sortBy" class="filter-select">
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="longest">Más largas</option>
              <option value="shortest">Más cortas</option>
            </select>
          </div>
          
          <button 
            @click="clearFilters"
            class="action-btn clear-filters-btn"
            title="Limpiar filtros"
          >
            <SparklesIcon class="w-4 h-4 mr-1" />
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="history-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <ArrowPathIcon class="loading-spinner w-12 h-12 animate-spin text-blue-500" />
        <p>Cargando transcripciones...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="transcriptions.length === 0" class="empty-state">
        <InboxIcon class="empty-icon w-20 h-20 text-gray-400" />
        <h3>{{ searchQuery ? 'No se encontraron resultados' : 'No hay transcripciones aún' }}</h3>
        <p v-if="searchQuery" class="empty-subtitle">
          Intenta con otros términos de búsqueda
        </p>
        <p v-else class="empty-subtitle">
          ¡Comienza creando tu primera transcripción!
        </p>
        
        <div class="empty-actions">
          <NuxtLink to="/realtime" class="action-btn primary-btn">
            <MicrophoneIcon class="w-4 h-4 mr-1" />
            Transcripción en Vivo
          </NuxtLink>
          <NuxtLink to="/transcription" class="action-btn secondary-btn">
            <FolderIcon class="w-4 h-4 mr-1" />
            Subir Audio
          </NuxtLink>
        </div>
      </div>

      <!-- Lista de Transcripciones -->
      <div v-else class="transcriptions-grid">
        <TranscriptionHistoryItem
          v-for="(transcription, index) in transcriptions"
          :key="transcription.id"
          :item="transcription"
          :index="getGlobalIndex(index)"
          :is-loading="loadingItems.has(transcription.id)"
          @save="handleSaveItem"
          @copy="handleCopyText"
          @download="handleDownloadItem"
          @downloadJson="handleDownloadJsonItem"
          @share="handleShareItem"
          @update="handleUpdateItem"
          @duplicate="handleDuplicateItem"
          @delete="handleDeleteItem"
        />
      </div>

      <!-- Paginación -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination-info">
          Mostrando {{ paginationInfo.start }} - {{ paginationInfo.end }} de {{ paginationInfo.total }}
        </div>
        
        <div class="pagination-controls">
          <button 
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            class="pagination-btn"
            title="Primera página"
          >
            <ChevronDoubleLeftIcon class="w-4 h-4" />
          </button>
          
          <button 
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination-btn"
            title="Página anterior"
          >
            <ChevronLeftIcon class="w-4 h-4" />
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              class="pagination-btn page-number"
              :class="{ active: page === currentPage }"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
            title="Página siguiente"
          >
            <ChevronRightIcon class="w-4 h-4" />
          </button>
          
          <button 
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
            title="Última página"
          >
            <ChevronDoubleRightIcon class="w-4 h-4" />
          </button>
        </div>
        
        <div class="pagination-settings">
          <label class="pagination-label">Items por página:</label>
          <select v-model="itemsPerPage" class="pagination-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <!-- Acciones de Lote -->
      <div v-if="transcriptionHistory.count() > 0" class="bulk-actions">
        <div class="bulk-info">
          <WrenchScrewdriverIcon class="bulk-icon w-6 h-6" />
          <span class="bulk-text">Acciones en lote:</span>
              </div>
              
        <div class="bulk-buttons">
          <div class="export-group">
            <button 
              @click="exportAllToFile('txt')"
              class="action-btn export-btn"
              title="Exportar como archivo de texto"
            >
              <DocumentIcon class="w-4 h-4 mr-1" />
              Exportar TXT
            </button>
            
            <button 
              @click="exportAllToFile('json')"
              class="action-btn export-json-btn"
              title="Exportar con metadatos JSON"
            >
              <CodeBracketIcon class="w-4 h-4 mr-1" />
              Exportar JSON
            </button>
            
            <button 
              @click="exportAllToFile('csv')"
              class="action-btn export-csv-btn"
              title="Exportar como hoja de cálculo"
            >
              <TableCellsIcon class="w-4 h-4 mr-1" />
              Exportar CSV
            </button>
              </div>
              
                <button 
            v-if="transcriptionHistory.hasTemporary()"
            @click="saveAllTemporary"
            class="action-btn save-all-btn"
            :disabled="isSavingAll"
            title="Guardar todas las transcripciones temporales"
          >
            <ArrowPathIcon v-if="isSavingAll" class="w-4 h-4 mr-1 animate-spin" />
            <ServerIcon v-else class="w-4 h-4 mr-1" />
            Guardar Temporales
                </button>
          
                <button 
            @click="clearLocalHistory"
            class="action-btn danger-btn"
            title="Limpiar historial local (mantiene las guardadas)"
                >
            <TrashIcon class="w-4 h-4 mr-1" />
            Limpiar Local
                </button>
              </div>
            </div>
          </div>

    <!-- Notificación -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
        </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTranscriptionHistory, type TranscriptionItem, type FilterOptions } from '~/composables/useTranscriptionHistory'
import TranscriptionHistoryItem from '~/components/transcription/TranscriptionHistoryItem.vue'
import { 
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  PencilIcon,
  ChartBarIcon,
  LanguageIcon,
  CalculatorIcon,
  FolderIcon,
  CalendarIcon,
  SparklesIcon,
  InboxIcon,
  MicrophoneIcon,
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  WrenchScrewdriverIcon,
  CodeBracketIcon,
  TableCellsIcon,
  ServerIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

// Estados reactivos
const showFilters = ref(false)
const searchQuery = ref('')
const filterType = ref<'all' | 'recent' | 'old'>('all')
const sortBy = ref<'newest' | 'oldest' | 'longest' | 'shortest'>('newest')
const itemsPerPage = ref(10)
const loadingItems = ref(new Set<string>())
const isSavingAll = ref(false)
const notification = ref<{ message: string; type: string } | null>(null)

// Composable del historial con paginación del servidor
const transcriptionHistory = useTranscriptionHistory({
  autoLoad: true,
  initialPageSize: itemsPerPage.value,
  onError: (error) => showNotification(error, 'error'),
  onSuccess: (message) => showNotification(message, 'success')
})

const { 
  transcriptions, 
  pagination, 
  statistics, 
  currentFilters,
  isLoading, 
  loadPage,
  changePageSize,
  applyFilters,
  refresh
} = transcriptionHistory

// Computadas para usar las estadísticas del servidor
const totalWords = computed(() => statistics.value.totalWords)
const totalCharacters = computed(() => statistics.value.totalCharacters)

// Computadas para paginación (ahora vienen del servidor)
const currentPage = computed(() => pagination.value.currentPage)
const totalPages = computed(() => pagination.value.totalPages)

const paginationInfo = computed(() => ({
  start: pagination.value.startIndex,
  end: pagination.value.endIndex,
  total: pagination.value.totalCount
}))

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2
  const pages: number[] = []
  
  const start = Math.max(1, current - delta)
  const end = Math.min(total, current + delta)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Watchers para aplicar filtros automáticamente
watch([searchQuery, filterType, sortBy], async () => {
  await applyCurrentFilters()
})

watch(itemsPerPage, async (newValue) => {
  await changePageSize(newValue)
})

// Métodos
const applyCurrentFilters = async () => {
  const filters: FilterOptions = {
    search: searchQuery.value.trim() || undefined,
    type: filterType.value !== 'all' ? filterType.value : undefined,
    sortBy: sortBy.value
  }
  
  await applyFilters(filters)
}

const refreshHistory = async () => {
  await refresh()
}

const clearFilters = async () => {
  searchQuery.value = ''
  filterType.value = 'all'
  sortBy.value = 'newest'
  
  await applyFilters({})
}

const goToPage = async (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    await loadPage(page)
  }
}

const getGlobalIndex = (localIndex: number): number => {
  return pagination.value.startIndex + localIndex - 1
}

// Handlers para eventos del componente item
const handleSaveItem = async (item: TranscriptionItem) => {
  loadingItems.value.add(item.id)
  try {
    const success = await transcriptionHistory.saveExistingItem(item)
    if (success) {
      showNotification('Transcripción guardada exitosamente', 'success')
    }
  } finally {
    loadingItems.value.delete(item.id)
  }
}

const handleCopyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showNotification('Texto copiado al portapapeles', 'success')
  } catch (error) {
    showNotification('Error al copiar el texto', 'error')
  }
}

const handleDownloadItem = (item: TranscriptionItem) => {
  if (!item.text) {
    showNotification('No hay texto para descargar', 'error')
    return
  }
  
  const blob = new Blob([item.text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${item.filename || `transcripcion_${new Date().toISOString().slice(0, 10)}`}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showNotification('Transcripción descargada', 'success')
}

const handleDownloadJsonItem = (item: any) => {
  const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${item.filename || `transcripcion_${new Date().toISOString().slice(0, 10)}`}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showNotification('Datos JSON descargados', 'success')
}

const handleShareItem = async (item: TranscriptionItem) => {
  if (!item._id) {
    showNotification('Solo se pueden compartir transcripciones guardadas', 'error')
    return
  }
  
  try {
    const shareUrl = `${window.location.origin}/transcriptions/${item._id}`
    await navigator.clipboard.writeText(shareUrl)
    showNotification('Enlace copiado al portapapeles', 'success')
  } catch (error) {
    showNotification('Error al generar enlace', 'error')
  }
}

const handleUpdateItem = async (item: TranscriptionItem) => {
  if (!item._id) {
    showNotification('Solo se pueden actualizar transcripciones guardadas', 'error')
    return
  }
  
  loadingItems.value.add(item.id)
  try {
    await refresh()
    showNotification('Transcripción actualizada', 'success')
  } catch (error) {
    showNotification('Error al actualizar', 'error')
  } finally {
    loadingItems.value.delete(item.id)
  }
}

const handleDuplicateItem = (item: TranscriptionItem) => {
  if (!item.text) {
    showNotification('No se puede duplicar una transcripción vacía', 'error')
    return
  }
  
  const duplicatedItem = transcriptionHistory.addLocalTranscription(
    item.text,
    new Date(),
    new Date()
  )
  
  showNotification('Transcripción duplicada como temporal', 'success')
  
  // Recargar la página actual para mostrar el duplicado
  refresh()
}

const handleDeleteItem = async (id: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta transcripción?')) {
    const item = transcriptionHistory.findById(id)
    
    if (item?._id) {
      // Es una transcripción del servidor
      const success = await transcriptionHistory.deleteServerItem(id)
      if (success) {
        showNotification('Transcripción eliminada del servidor', 'success')
      }
    } else {
      // Es una transcripción temporal
      const success = transcriptionHistory.deleteLocalItem(id)
      if (success) {
        showNotification('Transcripción temporal eliminada', 'success')
      }
    }
  }
}

// Acciones en lote
const exportAllToFile = (format: 'txt' | 'json' | 'csv' = 'txt') => {
  const exportData = transcriptionHistory.exportToFormat(format)
  
  if (!exportData) {
    return // El error ya se maneja en el composable
  }
  
  const blob = new Blob([exportData.content], { type: exportData.mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportData.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showNotification(`Historial exportado como ${format.toUpperCase()}`, 'success')
}

const saveAllTemporary = async () => {
  const temporaryItems = transcriptionHistory.getTemporaryTranscriptions()
  if (temporaryItems.length === 0) {
    showNotification('No hay transcripciones temporales para guardar', 'info')
    return
  }
  
  isSavingAll.value = true
  let savedCount = 0
  
  try {
    for (const item of temporaryItems) {
      const success = await transcriptionHistory.saveExistingItem(item)
      if (success) savedCount++
    }
    
    showNotification(`Se guardaron ${savedCount} de ${temporaryItems.length} transcripciones`, 'success')
  } finally {
    isSavingAll.value = false
  }
}

const clearLocalHistory = async () => {
  if (confirm('¿Estás seguro de que quieres limpiar el historial local? Las transcripciones guardadas se mantendrán.')) {
    const success = await transcriptionHistory.clearLocalHistory()
    if (success) {
      showNotification('Historial local limpiado', 'success')
    }
  }
}

const showNotification = (message: string, type: string = 'info') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 4000)
}

// Lifecycle
onMounted(() => {
  // El historial se carga automáticamente por el composable
})
</script>

<style scoped>
.history-container {
  @apply min-h-screen bg-gradient-to-br from-gray-50 to-gray-100;
}

.history-header {
  @apply bg-white shadow-lg border-b border-gray-200;
}

.header-content {
  @apply max-w-7xl mx-auto px-4 py-6 flex justify-between items-center;
}

.history-title {
  @apply text-3xl font-bold text-gray-800 flex items-center gap-3;
}

.count-badge {
  @apply bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-medium;
}

.header-actions {
  @apply flex gap-3;
}

.action-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-transparent cursor-pointer flex items-center gap-2;
}

.refresh-btn {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.filter-btn {
  @apply bg-blue-50 text-blue-700 hover:bg-blue-100;
}

.filter-btn.active {
  @apply bg-blue-500 text-white;
}

.stats-bar {
  @apply bg-gray-50 border-t border-gray-200 px-4 py-4;
}

.stats-bar {
  @apply flex flex-wrap gap-4 max-w-7xl mx-auto;
}

.stat-item {
  @apply flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm;
}

.stat-icon {
  @apply flex-shrink-0 text-blue-600;
}

.stat-info {
  @apply flex flex-col;
}

.stat-number {
  @apply text-xl font-bold text-gray-800;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.filters-panel {
  @apply bg-blue-50 border-t border-blue-200 px-4 py-4;
}

.filters-row {
  @apply max-w-7xl mx-auto flex flex-wrap gap-4 items-end;
}

.filter-group {
  @apply flex flex-col gap-1;
}

.filter-label {
  @apply text-sm font-medium text-gray-700;
}

.filter-input, .filter-select {
  @apply px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.clear-filters-btn {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

.history-content {
  @apply max-w-7xl mx-auto px-4 py-8;
}

.loading-state, .empty-state {
  @apply text-center py-16;
}

.loading-spinner {
  @apply mb-4;
}

.empty-icon {
  @apply mb-4;
}

.empty-state h3 {
  @apply text-xl font-semibold text-gray-800 mb-2;
}

.empty-subtitle {
  @apply text-gray-600 mb-6;
}

.empty-actions {
  @apply flex gap-4 justify-center;
}

.primary-btn {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.secondary-btn {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

.transcriptions-grid {
  @apply grid gap-6 mb-8;
}

.pagination-container {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.pagination-info {
  @apply text-sm text-gray-600 mb-4 text-center;
}

.pagination-controls {
  @apply flex justify-center items-center gap-2 mb-4;
}

.pagination-btn {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors cursor-pointer;
}

.pagination-btn:hover:not(:disabled) {
  @apply bg-gray-50;
}

.pagination-btn:disabled {
  @apply bg-gray-100 text-gray-400 cursor-not-allowed;
}

.page-number.active {
  @apply bg-blue-500 text-white border-blue-500;
}

.pagination-settings {
  @apply flex justify-center items-center gap-2;
}

.pagination-label {
  @apply text-sm font-medium text-gray-700;
}

.pagination-select {
  @apply px-2 py-1 border border-gray-300 rounded text-sm;
}

.bulk-actions {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-wrap justify-between items-center gap-4;
}

.bulk-info {
  @apply flex items-center gap-2 text-gray-700 font-medium;
}

.bulk-icon {
  @apply flex-shrink-0 text-gray-600;
}

.bulk-buttons {
  @apply flex gap-3;
}

.export-group {
  @apply flex gap-2 flex-wrap;
}

.export-btn {
  @apply bg-green-50 text-green-700 hover:bg-green-100;
}

.export-json-btn {
  @apply bg-indigo-50 text-indigo-700 hover:bg-indigo-100;
}

.export-csv-btn {
  @apply bg-orange-50 text-orange-700 hover:bg-orange-100;
}

.save-all-btn {
  @apply bg-purple-50 text-purple-700 hover:bg-purple-100;
}

.danger-btn {
  @apply bg-red-50 text-red-700 hover:bg-red-100;
}

.notification {
  @apply fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 font-medium text-white;
}

.notification.success {
  @apply bg-green-500;
}

.notification.error {
  @apply bg-red-500;
}

.notification.info {
  @apply bg-blue-500;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col gap-4;
  }
  
  .stats-bar {
    @apply grid grid-cols-2 gap-3;
  }
  
  .filters-row {
    @apply flex-col items-stretch;
  }
  
  .transcriptions-grid {
    @apply gap-4;
  }
  
  .pagination-controls {
    @apply flex-wrap;
  }
  
  .bulk-actions {
    @apply flex-col;
  }
  
  .bulk-buttons {
    @apply w-full justify-center;
  }
  
  .export-group {
    @apply w-full justify-center;
  }
}

@media (max-width: 640px) {
  .stats-bar {
    @apply grid-cols-1;
  }
  
  .history-content {
    @apply px-2;
  }
}
</style>
  
  
  