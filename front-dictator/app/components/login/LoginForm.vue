<script setup lang="ts">
import { reactive } from 'vue';
import { useUserSession } from '../../composables/useUserSession';

const { login } = useUserSession();
const credentials = reactive({ email: '', password: '' });

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
    try {
        await login(credentials)
        alert('¡Login exitoso!')
        await navigateTo('/dashboard')
    } catch (error) {
        console.error('Login failed:', error)
        alert('Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="max-w-sm mx-auto p-6">
        <form @submit.prevent="handleLogin" class="login-form">
            <h1>Login to Vocali</h1>

            <div class="form-group">
                <label for="email">Email:</label>
                <input id="email" v-model="credentials.email" type="email" required placeholder="Enter your email" />
            </div>

            <div class="form-group">
                <label for="password">Password:</label>
                <input id="password" v-model="credentials.password" type="password" required
                    placeholder="Enter your password" />
            </div>

            <button type="submit" :disabled="loading" class="login-btn">
                {{ loading ? 'Logging in...' : 'Login' }}
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
  max-width: 400px;
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
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.login-btn:hover {
  background: #0056b3;
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
  color: #007bff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
