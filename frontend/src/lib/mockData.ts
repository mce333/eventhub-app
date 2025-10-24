import { User } from '@/types/auth.types';
import { Event, EventClient, EventExpense, EventDecoration, EventFurniture, EventStaff } from '@/types/events';

export interface MockUser extends User {
  password: string;
  assignedEventIds?: number[];
}

// Extended user list with service role users
export const DEMO_USERS: MockUser[] = [
  {
    id: 1,
    name: 'Admin',
    last_name: 'Sistema',
    email: 'admin@eventhub.com',
    password: 'Admin123!',
    is_verified: true,
    is_blocked: false,
    role: { id: 1, name: 'admin' },
    language: 'es',
    nationality: 'España',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    assignedEventIds: [],
  },
  {
    id: 2,
    name: 'Socio',
    last_name: 'Principal',
    email: 'socio@eventhub.com',
    password: 'Socio123!',
    is_verified: true,
    is_blocked: false,
    role: { id: 2, name: 'socio' },
    language: 'es',
    nationality: 'España',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    assignedEventIds: [],
  },
  {
    id: 3,
    name: 'Encargado',
    last_name: 'Compras',
    email: 'compras@eventhub.com',
    password: 'Compras123!',
    is_verified: true,
    is_blocked: false,
    role: { id: 3, name: 'encargado_compras' },
    language: 'es',
    nationality: 'España',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    assignedEventIds: [],
  },
  // Service role user - Solo Juan para pruebas
  {
    id: 4,
    name: 'Juan',
    last_name: 'Pérez',
    email: 'juan@eventhub.com',
    password: 'Juan123!',
    is_verified: true,
    is_blocked: false,
    role: { id: 4, name: 'servicio' },
    language: 'es',
    nationality: 'Perú',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    assignedEventIds: [],
  },
];

export interface DashboardMetrics {
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  totalExpenses: number;
  upcomingEvents: Array<{
    id: number;
    name: string;
    date: string;
    location: string;
    attendees: number;
    status: 'upcoming' | 'active' | 'completed';
  }>;
  recentActivity: Array<{
    id: number;
    type: 'event' | 'payment' | 'expense';
    description: string;
    date: string;
    amount?: number;
  }>;
  monthlyStats: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

// Mock Clients
export const MOCK_CLIENTS: EventClient[] = [
  { id: 1, name: 'Tech Corp', email: 'contact@techcorp.com', phone: '+34 912 345 678', company: 'Tech Corp S.L.' },
  { id: 2, name: 'María González', email: 'maria@email.com', phone: '+52 55 1234 5678', company: 'Eventos MG' },
  { id: 3, name: 'Carlos Ruiz', email: 'carlos@email.com', phone: '+54 11 2345 6789' },
];

// Mock Events - Vacío para empezar desde cero
export const MOCK_EVENTS: Event[] = [];

export const MOCK_DASHBOARD_DATA: Record<number, DashboardMetrics> = {
  1: { // Admin
    totalEvents: 25,
    activeEvents: 8,
    totalRevenue: 145800,
    totalExpenses: 87200,
    upcomingEvents: [
      { id: 1, name: 'Conferencia Tech 2025', date: '2025-01-15', location: 'Sala Principal', attendees: 245, status: 'upcoming' },
      { id: 2, name: 'Concierto Jazz Night', date: '2025-01-20', location: 'Auditorio Norte', attendees: 180, status: 'upcoming' },
      { id: 3, name: 'Gala Benéfica Anual', date: '2025-01-25', location: 'Salón Imperial', attendees: 420, status: 'upcoming' },
    ],
    recentActivity: [
      { id: 1, type: 'event', description: 'Nuevo evento creado: Conferencia Tech', date: '2025-01-10' },
      { id: 2, type: 'payment', description: 'Pago recibido', date: '2025-01-09', amount: 25000 },
      { id: 3, type: 'expense', description: 'Gasto registrado: Catering', date: '2025-01-08', amount: 2500 },
    ],
    monthlyStats: [
      { month: 'Ene', revenue: 12000, expenses: 7000 },
      { month: 'Feb', revenue: 15000, expenses: 8500 },
      { month: 'Mar', revenue: 18000, expenses: 9200 },
      { month: 'Abr', revenue: 14000, expenses: 7800 },
      { month: 'May', revenue: 16500, expenses: 8900 },
      { month: 'Jun', revenue: 19000, expenses: 10200 },
    ],
  },
  2: { // Socio - Same as admin
    totalEvents: 25,
    activeEvents: 8,
    totalRevenue: 145800,
    totalExpenses: 87200,
    upcomingEvents: [
      { id: 1, name: 'Conferencia Tech 2025', date: '2025-01-15', location: 'Sala Principal', attendees: 245, status: 'upcoming' },
      { id: 2, name: 'Concierto Jazz Night', date: '2025-01-20', location: 'Auditorio Norte', attendees: 180, status: 'upcoming' },
      { id: 3, name: 'Gala Benéfica Anual', date: '2025-01-25', location: 'Salón Imperial', attendees: 420, status: 'upcoming' },
    ],
    recentActivity: [
      { id: 1, type: 'event', description: 'Nuevo evento creado: Conferencia Tech', date: '2025-01-10' },
      { id: 2, type: 'payment', description: 'Pago recibido', date: '2025-01-09', amount: 25000 },
    ],
    monthlyStats: [
      { month: 'Ene', revenue: 12000, expenses: 7000 },
      { month: 'Feb', revenue: 15000, expenses: 8500 },
      { month: 'Mar', revenue: 18000, expenses: 9200 },
      { month: 'Abr', revenue: 14000, expenses: 7800 },
      { month: 'May', revenue: 16500, expenses: 8900 },
      { month: 'Jun', revenue: 19000, expenses: 10200 },
    ],
  },
  3: { // Encargado Compras - NO dashboard access
    totalEvents: 0,
    activeEvents: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    upcomingEvents: [],
    recentActivity: [],
    monthlyStats: [],
  },
};