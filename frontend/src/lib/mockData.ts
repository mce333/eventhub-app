import { User, UserRole } from '@/types/auth.types';
import { Event, EventClient } from '@/types/events';

// Mock User Roles
export const ROLES: UserRole[] = [
  { id: 1, name: 'admin', displayName: 'Administrador' },
  { id: 2, name: 'socio', displayName: 'Socio' },
  { id: 3, name: 'encargado_compras', displayName: 'Encargado de Compras' },
  { id: 4, name: 'servicio', displayName: 'Personal de Servicio' },
];

// Mock Users (Demo mode)
export interface MockUser extends User {
  password: string;
  assignedEventIds?: number[];
}

export const DEMO_USERS: MockUser[] = [
  {
    id: 1,
    email: 'admin@eventhub.com',
    password: 'admin123',
    name: 'Admin',
    last_name: 'Sistema',
    role: ROLES[0],
    phone: '+51 999 888 777',
    address: 'Oficina Central',
    document_type: 'DNI',
    document_number: '12345678',
    birth_date: '1990-01-01',
    gender: 'Masculino',
    nationality: 'Perú',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    assignedEventIds: [],
    is_verified: true,
    is_blocked: false,
  },
  {
    id: 2,
    email: 'coordinador@eventhub.com',
    password: 'coord123',
    name: 'Coordinador',
    last_name: 'General',
    role: ROLES[3], // servicio role que se usará para coordinadores
    phone: '+51 999 777 666',
    address: 'Lima',
    document_type: 'DNI',
    document_number: '23456789',
    birth_date: '1985-06-15',
    gender: 'Masculino',
    nationality: 'Perú',
    created_at: new Date('2024-01-05'),
    updated_at: new Date('2024-01-05'),
    assignedEventIds: [],
    is_verified: true,
    is_blocked: false,
  },
  {
    id: 3,
    email: 'compras@eventhub.com',
    password: 'compras123',
    name: 'Encargado',
    last_name: 'de Compras',
    role: ROLES[2],
    phone: '+51 999 666 555',
    address: 'Lima',
    document_type: 'DNI',
    document_number: '34567890',
    birth_date: '1992-03-20',
    gender: 'Masculino',
    nationality: 'Perú',
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10'),
    assignedEventIds: [],
    is_verified: true,
    is_blocked: false,
  },
];

// Mock Clients
export const MOCK_CLIENTS: EventClient[] = [
  { id: 1, name: 'Tech Corp', email: 'contact@techcorp.com', phone: '+34 912 345 678', company: 'Tech Corp S.L.' },
  { id: 2, name: 'María González', email: 'maria@email.com', phone: '+52 55 1234 5678', company: 'Eventos MG' },
  { id: 3, name: 'Carlos Ruiz', email: 'carlos@email.com', phone: '+54 11 2345 6789' },
];

// Mock Events - VACÍO, los eventos se crearán en localStorage
export const MOCK_EVENTS: Event[] = [];

// Función para inicializar eventos de ejemplo en localStorage (solo la primera vez)
export function initializeSampleEvents() {
  const existingEvents = localStorage.getItem('demo_events');
  const hasInitialized = localStorage.getItem('events_initialized');
  
  // Solo inicializar si no hay eventos y no se ha inicializado antes
  if (!hasInitialized) {
    console.log('Inicializando eventos de ejemplo...');
    localStorage.setItem('demo_events', '[]');
    localStorage.setItem('events_initialized', 'true');
  }
}

export const MOCK_DASHBOARD_DATA: Record<number, any> = {
  1: { // Admin
    totalEvents: 25,
    activeEvents: 8,
    totalRevenue: 145800,
    totalExpenses: 87200,
  },
  2: { // Socio - Same as admin
    totalEvents: 25,
    activeEvents: 8,
    totalRevenue: 145800,
    totalExpenses: 87200,
  },
};