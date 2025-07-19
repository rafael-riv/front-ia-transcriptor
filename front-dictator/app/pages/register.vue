<template>
  <div class="landing-container flex flex-col  md:flex-row items-center justify-around px-4 min-h-screen">
    <div class="text-center">
      <h1 class="text-4xl">Se parte de scripter.ai</h1>
      <p class="mb-6">AI-powered voice transcription platform</p>

      <span class="text-sky-600 mt-8">Tu nueva app para transcripciones y analisis en tiempo real</span>
      <p class="text-gray-600 mt-2">Crea tu cuenta y comienza a transcribir audio de forma rápida y sencilla</p>
      <p class="text-gray-600 mt-2">¡Es gratis!</p>
    </div>
    <div>
      <RegisterForm />

    </div>
  </div>
</template>

<script setup>
import RegisterForm from '~/components/auth/RegisterForm.vue';


// Meta para SEO
useHead({
  title: 'Registro - Vocali',
  meta: [
    { name: 'description', content: 'Crea tu cuenta en Vocali para comenzar a transcribir audio' }
  ]
})
</script>

<style scoped>

.landing-container{
    background: linear-gradient(135deg, #c7dcf7 0%, #78ade2 100%);
}
</style>