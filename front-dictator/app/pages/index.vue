<template>
  <div class="landing-container flex flex-col  md:flex-row items-center justify-around px-4 min-h-screen">
    <div class="text-center">
      <h1 class="text-4xl">Bienvenido a scripter.ai</h1>
      <p class="mb-6">AI-powered voice transcription platform</p>

      <span class="text-sky-600 mt-8">Tu nueva app para transcripciones y analisis en tiempo real</span>
    </div>
    <div class="login-container">
      <LoginForm />
    </div>
  </div>
</template>

<style scoped>

.landing-container{
    background: linear-gradient(135deg, #c7dcf7 0%, #78ade2 100%);
}
.actions {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
</style>
