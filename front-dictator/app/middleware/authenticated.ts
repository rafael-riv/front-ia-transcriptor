export default defineNuxtRouteMiddleware((to, from) => {
    // Verificar si hay token en localStorage
    if (import.meta.client) {
      const token = localStorage.getItem('auth-token');
      if (!token && to.path !== '/login' && to.path !== '/register') {
        return navigateTo('/login');
      }
    }
  }); 