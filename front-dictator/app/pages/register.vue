<template>
  <div>
    <RegisterForm />
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
  