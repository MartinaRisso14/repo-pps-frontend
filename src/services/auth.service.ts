import api from '../api/axiosClient';

export interface LoginResponse {
  access_token: string;
  usuario: {
    usuCodigo: number;
    usuNombre: string;
    apeNom: string;
    idRol: number;
    email: string;
    debeCambiarPassword?: boolean;
  };
}

export const authService = {
  login: async (usuNombre: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { usuNombre, password });
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
    }
    return data;
  },

  solicitarRecuperacion: async (email: string) => {
    const { data } = await api.post('/auth/recuperar-password', { email });
    return data;
  },

  resetPassword: async (token: string, nuevaPassword: string) => {
    const { data } = await api.post('/auth/reset-password', { token, nuevaPassword });
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
  },

  getUsuarioActual: () => {
    const userStr = localStorage.getItem('usuario');
    return userStr ? JSON.parse(userStr) : null;
  },
};

