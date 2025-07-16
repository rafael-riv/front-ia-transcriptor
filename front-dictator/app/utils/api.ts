export const API_BASE_URL = 'http://localhost:4000';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (import.meta.client) {
      const token = localStorage.getItem('auth-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async post<T>(endpoint: string, data: any, requiresAuth = false): Promise<T> {
    const headers = requiresAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
    
    return await $fetch<T>(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data,
    });
  }

  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    const headers = requiresAuth ? this.getAuthHeaders() : {};
    
    return await $fetch<T>(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers,
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData, requiresAuth = true): Promise<T> {
    const headers: Record<string, string> = {};
    
    if (requiresAuth && import.meta.client) {
      const token = localStorage.getItem('auth-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return await $fetch<T>(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  }
}

// Instancia global del cliente API
export const apiClient = new ApiClient(); 