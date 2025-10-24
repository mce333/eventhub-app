export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  user?: User;
}

export interface User {
  id: number;
  name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  is_verified: boolean;
  created_at: string;
}

export interface DashboardData {
  user: User;
  stats?: {
    totalEvents: number;
    totalRevenue: number;
    activeClients: number;
    averageOccupancy: number;
  };
  upcomingEvents?: Array<{
    id: number;
    title: string;
    date: string;
    location: string;
    attendees: number;
    capacity: number;
  }>;
}