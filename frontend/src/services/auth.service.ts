import api from './api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth.types';
import { DEMO_USERS } from '@/lib/mockData';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// Simular delay de red
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 300));

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      
      const user = DEMO_USERS.find(
        u => u.email === credentials.email && u.password === credentials.password
      );

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      if (!user.is_verified) {
        throw new Error('Tu cuenta no está verificada. Por favor verifica tu email.');
      }

      if (user.is_blocked) {
        throw new Error('Tu cuenta ha sido bloqueada. Contacta al administrador.');
      }

      const { password, ...userWithoutPassword } = user;
      
      // Generar tokens simulados
      const mockToken = `demo_token_${user.id}_${Date.now()}`;
      const mockRefreshToken = `demo_refresh_${user.id}_${Date.now()}`;

      localStorage.setItem('access_token', mockToken);
      localStorage.setItem('refresh_token', mockRefreshToken);
      localStorage.setItem('demo_user', JSON.stringify(userWithoutPassword));

      return {
        access_token: mockToken,
        refresh_token: mockRefreshToken,
        user: userWithoutPassword,
      };
    }

    // Modo real con backend
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
    }

    return response.data;
  }

  async loginAsDemo(userId: number): Promise<AuthResponse> {
    await simulateNetworkDelay();
    
    const user = DEMO_USERS.find(u => u.id === userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.is_verified) {
      throw new Error('Tu cuenta no está verificada. Por favor verifica tu email.');
    }

    if (user.is_blocked) {
      throw new Error('Tu cuenta ha sido bloqueada. Contacta al administrador.');
    }

    const { password, ...userWithoutPassword } = user;
    
    const mockToken = `demo_token_${user.id}_${Date.now()}`;
    const mockRefreshToken = `demo_refresh_${user.id}_${Date.now()}`;

    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('refresh_token', mockRefreshToken);
    localStorage.setItem('demo_user', JSON.stringify(userWithoutPassword));

    return {
      access_token: mockToken,
      refresh_token: mockRefreshToken,
      user: userWithoutPassword,
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    if (isDemoMode) {
      throw new Error('El registro no está disponible en modo demo');
    }

    const response = await api.post<AuthResponse>('/auth/register', data);
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
    }

    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        const user = JSON.parse(demoUser);
        // Actualizar assignedEventIds desde demo_users si existe
        const storedUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const updatedUser = storedUsers.find((u: any) => u.id === user.id);
        if (updatedUser) {
          return { ...user, assignedEventIds: updatedUser.assignedEventIds || [] };
        }
        return user;
      }
      throw new Error('No hay sesión activa');
    }

    const response = await api.get<User>('/users/profile');
    return response.data;
  }

  async logout(): Promise<void> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('demo_user');
      return;
    }

    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isDemoMode(): boolean {
    return isDemoMode;
  }
}

export const authService = new AuthService();