// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // CSS Configuration
  css: [
    '~/assets/css/main.css'
  ],
  
  // PostCSS Configuration
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  
  // Runtime Configuration
  runtimeConfig: {
    // Variables del servidor (privadas)
    backendUrl: process.env.NUXT_BACKEND_URL || 'http://localhost:4000',
    
    // Variables públicas (disponibles en el cliente)
    public: {
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
      socketioUrl: process.env.NUXT_PUBLIC_SOCKETIO_URL || 'http://localhost:4000',
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    }
  },
  
  // Meta tags globales
  app: {
    head: {
      title: 'Vocali - Transcripción de Voz con IA',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 
          name: 'description', 
          content: 'Plataforma de transcripción de voz con inteligencia artificial en tiempo real' 
        },
        { name: 'theme-color', content: '#3b82f6' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Google Fonts para mejorar la tipografía
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
        }
      ]
    }
  },
  
  // Configuración de construcción
  nitro: {
    compressPublicAssets: true,
  },
  
  // Configuración de TypeScript
  typescript: {
    strict: true,
    typeCheck: false
  }
})
