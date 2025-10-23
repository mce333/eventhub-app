import api from './api';
import { User } from '@/types/auth.types';
import { MOCK_DASHBOARD_DATA } from '@/lib/mockData';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// Simular delay de red
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 300));

class UsersService {
  async getProfile(): Promise<User> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        return JSON.parse(demoUser);
      }
      throw new Error('No hay sesión activa');
    }

    const response = await api.get<User>('/users/profile');
    return response.data;
  }

  async getDashboardMetrics(userId: number) {
    if (isDemoMode) {
      await simulateNetworkDelay();
      return MOCK_DASHBOARD_DATA[userId] || MOCK_DASHBOARD_DATA[2];
    }

    const response = await api.get(`/users/${userId}/dashboard`);
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        const user = JSON.parse(demoUser);
        const updatedUser = { ...user, ...data };
        localStorage.setItem('demo_user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error('No hay sesión activa');
    }

    const response = await api.patch<User>('/users/profile', data);
    return response.data;
  }

  async getAllUsers(): Promise<User[]> {
    if (isDemoMode) {
      throw new Error('Esta función no está disponible en modo demo');
    }

    const response = await api.get<User[]>('/users');
    return response.data;
  }
}

export const usersService = new UsersService();