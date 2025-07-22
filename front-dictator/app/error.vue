<template>
  <div class="error-page">
    <!-- Main Content -->
    <main class="error-main">
      <div class="error-container">
        <!-- Error Card -->
        <div class="error-card">
          <!-- Header with Icon -->
          <div class="error-header">
            <div class="error-icon-container">
              <ExclamationTriangleIcon class="error-icon" />
            </div>
            <h1 class="error-title">
              <MicrophoneIcon class="brand-icon" />
              Oops! Página no encontrada
            </h1>
          </div>

          <!-- Error Details -->
          <div class="error-content">
            <div class="error-code">404</div>
            <h2 class="error-subtitle">La página que buscas no existe</h2>
            <p class="error-description">
              Parece que la página que intentas visitar no está disponible o ha sido movida. 
              No te preocupes, puedes regresar a transcribir con Scripter.ai.
            </p>

            <!-- Error Features Info -->
            <div class="error-features">
              <div class="feature-item">
                <MicrophoneIcon class="feature-icon" />
                <span>Transcripción en tiempo real</span>
              </div>
              <div class="feature-item">
                <FolderIcon class="feature-icon" />
                <span>Subida de archivos de audio</span>
              </div>
              <div class="feature-item">
                <ClipboardDocumentListIcon class="feature-icon" />
                <span>Historial de transcripciones</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="error-actions">
            <NuxtLink to="/dashboard" class="primary-action">
              <HomeIcon class="action-icon" />
              Ir al Dashboard
            </NuxtLink>
            <NuxtLink to="/" class="secondary-action">
              <ArrowPathIcon class="action-icon" />
              Página Principal
            </NuxtLink>
          </div>

          <!-- Additional Help -->
          <div class="error-help">
            <p class="help-text">
              ¿Necesitas ayuda? Regresa al dashboard para continuar transcribiendo con IA.
            </p>
          </div>
        </div>

        <!-- Background Animation -->
        <div class="background-animation">
          <div class="floating-icon floating-1">
            <MicrophoneIcon class="w-8 h-8 text-blue-300" />
          </div>
          <div class="floating-icon floating-2">
            <SpeakerWaveIcon class="w-6 h-6 text-blue-200" />
          </div>
          <div class="floating-icon floating-3">
            <DocumentTextIcon class="w-7 h-7 text-blue-250" />
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="error-footer">
      <div class="footer-content">
        <p class="footer-text">
          <MicrophoneIcon class="footer-icon" />
          Scripter.ai - AI-powered voice transcription platform
        </p>
        <p class="footer-copyright">© 2025 Juan Diaz</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  ExclamationTriangleIcon,
  MicrophoneIcon,
  HomeIcon,
  ArrowPathIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  SpeakerWaveIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

// SEO y meta tags para la página de error
useHead({
  title: 'Página no encontrada - Scripter.ai',
  meta: [
    { name: 'description', content: 'La página que buscas no existe. Regresa a Scripter.ai para continuar transcribiendo con IA.' }
  ]
})

// Prevent crawlers from indexing the error page
useSeoMeta({
  robots: 'noindex,nofollow'
})
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.error-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  z-index: 10;
}

.error-container {
  max-width: 600px;
  width: 100%;
  position: relative;
}

.error-card {
  background: white;
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.error-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #007bff 0%, #3b82f6 100%);
}

.error-header {
  margin-bottom: 2rem;
}

.error-icon-container {
  margin-bottom: 1rem;
}

.error-icon {
  width: 4rem;
  height: 4rem;
  color: #f59e0b;
  margin: 0 auto;
}

.error-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.brand-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
}

.error-content {
  margin-bottom: 2.5rem;
}

.error-code {
  font-size: 6rem;
  font-weight: 800;
  color: #3b82f6;
  line-height: 1;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.error-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.error-features {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin: 2rem 0;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.9rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.feature-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.primary-action,
.secondary-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.primary-action {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
}

.secondary-action {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  border: 2px solid #e9ecef;
}

.secondary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
  color: #3b82f6;
}

.action-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.error-help {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.help-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.error-footer {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.footer-content {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.footer-icon {
  width: 1rem;
  height: 1rem;
  color: #3b82f6;
}

.footer-copyright {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* Background Animation */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-icon {
  position: absolute;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.floating-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.floating-2 {
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.floating-3 {
  bottom: 30%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .error-main {
    padding: 1rem 0.5rem;
  }
  
  .error-card {
    padding: 2rem 1.5rem;
  }
  
  .error-code {
    font-size: 4rem;
  }
  
  .error-title {
    font-size: 1.25rem;
  }
  
  .error-subtitle {
    font-size: 1.25rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .feature-item {
    font-size: 0.8rem;
    padding: 0.6rem;
  }
}

@media (min-width: 640px) {
  .error-features {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .error-actions {
    flex-direction: row;
    justify-content: center;
  }
}

/* Animations */
.error-card {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-item {
  animation: fadeInScale 0.6s ease-out;
}

.feature-item:nth-child(1) { animation-delay: 0.2s; }
.feature-item:nth-child(2) { animation-delay: 0.4s; }
.feature-item:nth-child(3) { animation-delay: 0.6s; }

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Loading state for links */
.primary-action:active,
.secondary-action:active {
  transform: scale(0.98);
}
</style>
  