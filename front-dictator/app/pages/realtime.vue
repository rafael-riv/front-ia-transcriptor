<template>
  <div class="dashboard">
    <Header />
    <main class="dashboard-main">
     
    <TranscriptionLiveTranscription />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  gap: 2rem;
}
</style> 