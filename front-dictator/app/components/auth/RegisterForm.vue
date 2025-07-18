<script setup lang="ts">
import { reactive } from 'vue';

interface RegisterResponse {
  token: string;
}

const credentials = reactive({ 
  email: '', 
  password: '',
  confirmPassword: ''
});

const loading = ref(false);
const errors = ref<string[]>([]);

const validateForm = () => {
  errors.value = [];
  
  if (!credentials.email || !credentials.password || !credentials.confirmPassword) {
    errors.value.push('Todos los campos son obligatorios');
  }
  
  if (credentials.password !== credentials.confirmPassword) {
    errors.value.push('Las contraseñas no coinciden');
  }
  
  if (credentials.password.length < 6) {
    errors.value.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  return errors.value.length === 0;
};

const handleRegister = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  errors.value = [];
  
  try {
    // Llamada al backend en localhost:4000
          const config = useRuntimeConfig()
      const backendUrl = config.public.backendUrl
      
      const response = await $fetch<RegisterResponse>(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        email: credentials.email,
        password: credentials.password
      }
    });
    
    // Guardar token si es necesario
    if (response.token && import.meta.client) {
      localStorage.setItem('auth-token', response.token);
    }
    
    alert('¡Cuenta creada exitosamente!');
    await navigateTo('/login');
    
  } catch (error: any) {
    console.error('Registration failed:', error);
    
    if (error.status === 400) {
      errors.value.push('El email ya está registrado');
    } else {
      errors.value.push('Error al crear la cuenta. Inténtalo de nuevo.');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="register-container">
    <form @submit.prevent="handleRegister" class="register-form">
      <h1>Registro en Vocali</h1>
      <p class="subtitle">Crea tu cuenta para empezar a transcribir</p>
      
      <!-- Mostrar errores -->
      <div v-if="errors.length > 0" class="error-container">
        <ul>
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </div>
      
      <div class="form-group">
        <label for="email">Email:</label>
        <input 
          id="email"
          v-model="credentials.email" 
          type="email" 
          required 
          placeholder="Ingresa tu email"
          :disabled="loading"
        />
      </div>
      
      <div class="form-group">
        <label for="password">Contraseña:</label>
        <input 
          id="password"
          v-model="credentials.password" 
          type="password" 
          required 
          placeholder="Mínimo 6 caracteres"
          :disabled="loading"
        />
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">Confirmar Contraseña:</label>
        <input 
          id="confirmPassword"
          v-model="credentials.confirmPassword" 
          type="password" 
          required 
          placeholder="Repite tu contraseña"
          :disabled="loading"
        />
      </div>
      
      <button type="submit" :disabled="loading" class="register-btn">
        {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
      </button>
      
      <p class="login-link">
        ¿Ya tienes cuenta? 
        <NuxtLink to="/login">Inicia sesión aquí</NuxtLink>
      </p>
    </form>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-form {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 450px;
}

.register-form h1 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 2rem;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.error-container {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.error-container ul {
  margin: 0;
  padding-left: 1rem;
  color: #c33;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.9rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.register-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: transform 0.2s ease;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.register-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.login-link {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
</style> 