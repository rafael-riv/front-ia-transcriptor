<template>
  <div class="dashboard">
    <Header/>

    <!-- Main Content -->
    <main class="dashboard-main">
      <!-- Real-time Transcription Preview -->
      <section class="realtime-preview">
        <div class="section-card">
          <h2>
            <MicrophoneIcon class="w-8 h-8 inline mr-2" />
            Transcripción en Tiempo Real
          </h2>
          <p class="section-description">
            Habla al micrófono y obtén la transcripción instantánea usando IA
          </p>

          <div class="preview-features">
            <div class="feature-item">
              <BoltIcon class="feature-icon w-6 h-6" />
              <span>Transcripción instantánea</span>
            </div>
            <div class="feature-item">
              <ServerIcon class="feature-icon w-6 h-6" />
              <span>Guardado automático</span>
            </div>
          </div>

          <div class="preview-actions">
            <NuxtLink to="/realtime" class="realtime-link">
              <MicrophoneIcon class="w-5 h-5 mr-2" />
              Transcribir en Tiempo Real
            </NuxtLink>
          </div>
        </div>
      </section>
      <!--Upload file Preview -->
      <section class="upload-preview">
        <div class="section-card">
          <h2>
            <FolderIcon class="w-8 h-8 inline mr-2" />
            Subir Archivo de Audio
          </h2>
          <p class="section-description">
            Sube tu archivo de audio y obtendrás la transcripción automática usando IA
          </p>

          <div class="preview-features">
            <div class="feature-item">
              <PaperClipIcon class="feature-icon w-6 h-6" />
              <span>Subida de archivos</span>
            </div>
            <div class="feature-item">
              <MusicalNoteIcon class="feature-icon w-6 h-6" />
              <span>Múltiples formatos</span>
            </div>
          </div>

          <div class="preview-actions">
            <NuxtLink to="/transcription" class="upload-link">
              <FolderIcon class="w-5 h-5 mr-2" />
              Subir Archivo de Audio
            </NuxtLink>
          </div>
        </div>
      </section>
      <!--History file Preview -->
      <section class="history-preview">
        <div class="section-card">
          <h2>
            <ClipboardDocumentListIcon class="w-8 h-8 inline mr-2" />
            Historial de Transcripciones
          </h2>
          <p class="section-description">
            Accede a todas tus transcripciones anteriores, revisa fechas y gestiona tu contenido
          </p>

          <div class="preview-features">
            <div class="feature-item">
              <ClipboardDocumentListIcon class="feature-icon w-6 h-6" />
              <span>Ver todas las transcripciones</span>
            </div>
            <div class="feature-item">
              <FolderArrowDownIcon class="feature-icon w-6 h-6" />
              <span>Descargar como .txt</span>
            </div>
          </div>

          <div class="preview-actions">
            <NuxtLink to="/history" class="history-link">
              <ClipboardDocumentListIcon class="w-5 h-5 mr-2" />
              Ver Historial Completo
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <!-- Toast Notifications -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  MicrophoneIcon,
  BoltIcon,
  ServerIcon,
  FolderIcon,
  PaperClipIcon,
  MusicalNoteIcon,
  ClipboardDocumentListIcon,
  FolderArrowDownIcon
} from '@heroicons/vue/24/outline'
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.dashboard-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
}

.section-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  height: fit-content;
}

.section-card h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
}

.section-description {
  color: #666;
  margin-bottom: 2rem;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.file-input-container {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.file-label:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.file-label-text {
  color: #666;
  font-size: 1.1rem;
}

.file-selected {
  color: #28a745;
  font-weight: 600;
  font-size: 1.1rem;
}

.file-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.file-info p {
  margin: 0.25rem 0;
  color: #555;
}

.upload-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.upload-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.progress-container {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #34ce57);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  color: #666;
  font-weight: 500;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a6268;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-subtitle {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.transcriptions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transcription-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fafafa;
}

.transcription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.transcription-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.transcription-date {
  color: #888;
  font-size: 0.9rem;
}

.transcription-text {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  font-style: italic;
  color: #444;
  border-left: 4px solid #007bff;
}

.no-transcription {
  color: #dc3545;
  font-style: italic;
  margin: 1rem 0;
}

.transcription-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.copy-btn {
  background: #17a2b8;
  color: white;
}

.copy-btn:hover:not(:disabled) {
  background: #138496;
}

.copy-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.download-btn {
  background: #28a745;
  color: white;
}

.download-btn:hover {
  background: #218838;
}

.notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.notification.success {
  background: #28a745;
}

.notification.error {
  background: #dc3545;
}

.notification.info {
  background: #17a2b8;
}

@media (max-width: 1024px) {
  .dashboard-main {
    max-width: 1200px;
    gap: 1.2rem;
  }

  .section-card {
    padding: 1.5rem;
  }

  .feature-item {
    font-size: 0.85rem;
    padding: 0.7rem;
  }
}

@media (max-width: 900px) {
  .dashboard-main {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 0 0.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .user-actions {
    flex-direction: column;
  }

  .section-card {
    padding: 1.5rem;
  }

  .transcription-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .transcription-actions {
    flex-direction: column;
  }

  .notification {
    top: 1rem;
    right: 1rem;
    left: 1rem;
  }
}

/* Estilos para la sección de transcripción en tiempo real */
.realtime-preview {
  margin-bottom: 3rem;
}

.preview-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
  margin: 1.5rem 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.8rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.9rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.feature-icon {
  flex-shrink: 0;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

.realtime-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  color: white;
  text-decoration: none;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
  transition: all 0.3s ease;
}

.realtime-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
}

.upload-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  text-decoration: none;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
  transition: all 0.3s ease;
}

.upload-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(40, 167, 69, 0.4);
}

.history-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #6f42c1, #563d7c);
  color: white;
  text-decoration: none;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 8px 25px rgba(111, 66, 193, 0.3);
  transition: all 0.3s ease;
}

.history-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(111, 66, 193, 0.4);
}

.inline-preview {
  width: 100%;
  max-width: 600px;
}

@media (max-width: 900px) {
  .preview-features {
    grid-template-columns: 1fr;
  }

  .feature-item {
    font-size: 1rem;
    padding: 1rem;
  }
}
</style>