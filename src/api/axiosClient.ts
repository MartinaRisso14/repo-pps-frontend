import axios from 'axios';

declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

const api = axios.create({
  baseURL: (
    window.__APP_CONFIG__?.apiUrl ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el Bearer token automáticamente en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar tokens expirados o accesos no autorizados
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('usuNombre');
      localStorage.removeItem('idRol');
    }
    return Promise.reject(error);
  }
);

export default api;