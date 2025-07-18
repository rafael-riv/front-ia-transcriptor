// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  runtimeConfig: {
    // Variables del servidor (privadas)
    backendUrl: process.env.NUXT_BACKEND_URL || 'http://localhost:4000',
    
    // Variables públicas (disponibles en el cliente)
    public: {
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
      socketioUrl: process.env.NUXT_PUBLIC_SOCKETIO_URL || 'http://localhost:4000',
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    }
  }
})
