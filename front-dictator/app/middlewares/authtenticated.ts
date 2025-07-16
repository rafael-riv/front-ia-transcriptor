import { useUserSession } from "~/composables/useUserSession";

export default defineNuxtRouteMiddleware((to, from) => {
    const { loggedIn } = useUserSession(); // si usas módulos como nuxt-auth-utils
    if (!loggedIn.value && to.path !== '/login') {
      return navigateTo('/login');
    }
  });