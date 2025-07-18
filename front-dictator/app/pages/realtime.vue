<template>
  <div>
    <h1>Página de Transcripción en Tiempo Real</h1>
    <TranscriptionLiveTranscription />
  </div>
</template>

<script setup lang="ts">
// El nombre del componente se auto-importa gracias a Nuxt 3
</script>

<style scoped>
.realtime-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
  border-radius: 15px;
  backdrop-filter: blur(10px);
}

.header-content h1 {
  margin: 0;
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.logout-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 107, 107, 0.8);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 107, 107, 1);
  transform: translateY(-2px);
}

.page-main {
  max-width: 1000px;
  margin: 0 auto 3rem auto;
}

.page-footer {
  max-width: 1200px;
  margin: 0 auto;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  color: #495057;
}

.info-card h3 {
  margin: 0 0 1rem 0;
  color: #667eea;
  font-size: 1.3rem;
  font-weight: 600;
}

.info-card ol,
.info-card ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-card li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.info-card strong {
  color: #495057;
}

/* Responsive Design */
@media (max-width: 768px) {
  .realtime-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .back-btn,
  .logout-btn {
    width: 100%;
    text-align: center;
  }
  
  .info-cards {
    grid-template-columns: 1fr;
  }
}
</style> 