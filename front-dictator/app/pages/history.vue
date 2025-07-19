<template>
  <div class="dashboard">
        <Header />
    <main class="dashboard-main">
       <TranscriptHistory/>
    </main>

  </div>
</template>

<script setup>
import TranscriptHistory from '~/components/transcripts-history/TranscriptHistory.vue'
import Header from '~/components/header/Header.vue'

// Middleware para proteger la ruta
definePageMeta({
  middleware: 'authenticated'
})


</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: row;
  gap: 2rem;
}

</style>
  