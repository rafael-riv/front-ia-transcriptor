<template>
  <div>
    <h1>Welcome to Vocali</h1>
    <p>AI-powered voice transcription platform</p>
    
    <div class="actions">
      <NuxtLink to="/login" class="btn">Login</NuxtLink>
      <NuxtLink to="/register" class="btn">Register</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
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
