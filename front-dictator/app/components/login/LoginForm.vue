<script setup lang="ts">
import { reactive } from 'vue';
import { useUserSession } from '../../composables/useUserSession';

const { login } = useUserSession();
const credentials = reactive({ email: '', password: '' });
const errors = ref<string[]>([]);



async function onSubmit() {
  try {
    await login(credentials);
    navigateTo('/');
  } catch {
    alert('Credenciales incorrectas');
  }
}

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  errors.value = [];
  try {
    await login(credentials)
    navigateTo('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
    errors.value.push('Error al iniciar sesión. Verifica tus credenciales.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-max mx-auto p-4">
    <form @submit.prevent="handleLogin" class="login-form">
      <h1>Sign in</h1>

      <div v-if="errors.length > 0" class="error-container">
        <ul>
          <li class="text-red-500" v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <div class="form-group">
        <label for="email">Email:</label>
        <input id="email" v-model="credentials.email" type="email" required placeholder="Enter your email"  :class="{ 'input-error': errors.length>0 }"/>
      </div>

      <div class="form-group">
        <label for="password">Password:</label>
        <input id="password" v-model="credentials.password" type="password" required
          placeholder="Enter your password" :class="{ 'input-error': errors.length>0}"/>
      </div>

      <button type="submit" :disabled="loading" class="login-btn">
        {{ loading ? 'Loging in...' : 'Login' }}
      </button>

      <p class="register-link">
        Don't have an account?
        <NuxtLink to="/register">Register here</NuxtLink>
      </p>
    </form>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-width: 350px;
}

.login-form h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: transform 0.2s ease;
}

.login-btn:hover {
  background: #764ba2;
}

.login-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  color: #666;
}

.register-link a {
  color: #764ba2;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}
.input-error {
  border-color: red !important;
}
</style>
