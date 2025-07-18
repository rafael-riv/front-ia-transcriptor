interface AuthResponse {
  token: string;
  user?: any;
}

export function useUserSession() {
    const loggedIn = ref(false);
    const user = ref<any>(null);
    const token = ref<string | null>(null);
    
    // Inicializar estado desde localStorage
    onMounted(() => {
      if (import.meta.client) {
        const savedToken = localStorage.getItem('auth-token');
        if (savedToken) {
          token.value = savedToken;
          loggedIn.value = true;
          // Aquí podrías validar el token con el backend
        }
      }
    });
    
    const login = async (creds: { email: string; password: string }) => {
      try {
        const config = useRuntimeConfig()
        const backendUrl = config.public.backendUrl || 'http://localhost:4000'
        
        const response = await $fetch<AuthResponse>(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: creds
        });
        
        if (response.token) {
          token.value = response.token;
          loggedIn.value = true;
          localStorage.setItem('auth-token', response.token);
          
          if (response.user) {
            user.value = response.user;
          }
        }
        
        return response;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    };
  
    const loggingOut = async () => {
      try {
        // Opcional: llamar al endpoint de logout del backend
        // await $fetch('http://localhost:4000/api/auth/logout', { 
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${token.value}`
        //   }
        // });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Limpiar estado local siempre
        loggedIn.value = false;
        user.value = null;
        token.value = null;
        localStorage.removeItem('auth-token');
      }
    };
    
    const getAuthHeaders = () => {
      return {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      };
    };
  
    return { 
      login, 
      loggingOut, 
      loggedIn,
      user,
      token,
      getAuthHeaders
    };
  }
