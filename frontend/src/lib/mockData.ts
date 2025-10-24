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

// Mock Events with expanded structure
export const MOCK_EVENTS: Event[] = [
  {
    id: 1,
    name: 'Conferencia Tech 2025',
    description: 'Conferencia anual de tecnología e innovación',
    type: 'conference',
    status: 'confirmed',
    date: '2025-01-15',
    endDate: '2025-01-15',
    location: 'Sala Principal',
    venue: 'Centro de Convenciones',
    attendees: 245,
    maxAttendees: 300,
    client: MOCK_CLIENTS[0],
    financial: {
      budget: 50000,
      totalIncome: 45000,
      totalExpenses: 28000,
      balance: 17000,
      advancePayment: 25000,
      pendingPayment: 20000,
    },
    expenses: [
      { 
        id: 1, 
        category: 'kiosco', 
        description: 'Bebidas y snacks', 
        amount: 1200, 
        date: '2025-01-10', 
        receipt: 'receipt1.pdf', 
        registeredBy: 4,
        registeredByName: 'Juan Pérez',
        paymentMethod: 'efectivo',
        status: 'approved',
      },
      { 
        id: 2, 
        category: 'decoracion', 
        description: 'Flores y centros de mesa', 
        amount: 800, 
        date: '2025-01-11', 
        receipt: 'receipt2.pdf', 
        registeredBy: 4,
        registeredByName: 'Juan Pérez',
        paymentMethod: 'tarjeta',
        status: 'approved',
      },
    ],
    decoration: [
      { id: 1, item: 'Flores naturales', quantity: 20, unitPrice: 25, totalPrice: 500, supplier: 'Floristería Central', notes: 'Rosas rojas', estado: 'completado' },
      { id: 2, item: 'Centros de mesa', quantity: 30, unitPrice: 15, totalPrice: 450, supplier: 'Decoraciones XYZ', notes: 'Estilo moderno', estado: 'completado' },
    ],
    furniture: [
      { id: 1, item: 'Mesas redondas', quantity: 30, condition: 'excelente', location: 'Almacén A', notes: 'Para 10 personas' },
      { id: 2, item: 'Sillas ejecutivas', quantity: 300, condition: 'bueno', location: 'Almacén B', notes: 'Con cojín' },
    ],
    staff: [
      { id: 1, name: 'Juan Pérez', role: 'Encargado de Compras', hours: 8, hourlyRate: 25, totalCost: 200, contact: '+51 999 111 222', userId: 4 },
      { id: 2, name: 'Ana García', role: 'Mesera', hours: 6, hourlyRate: 15, totalCost: 90, contact: '+51 999 333 444' },
    ],
    timeline: [
      { id: 1, date: '2024-12-01', title: 'Contrato firmado', description: 'Cliente firmó contrato', type: 'milestone', completed: true },
      { id: 2, date: '2024-12-15', title: 'Pago inicial', description: 'Recibido 50%', type: 'payment', completed: true },
    ],
    tags: ['tecnología', 'conferencia', 'innovación'],
    createdBy: 1,
    createdByName: 'Admin Sistema',
    createdAt: '2024-11-01',
    updatedAt: '2025-01-10',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  },
  {
    id: 2,
    name: 'Concierto Jazz Night',
    description: 'Noche de jazz con artistas internacionales',
    type: 'concert',
    status: 'confirmed',
    date: '2025-01-20',
    location: 'Auditorio Norte',
    venue: 'Teatro Principal',
    attendees: 180,
    maxAttendees: 200,
    client: MOCK_CLIENTS[1],
    financial: {
      budget: 35000,
      totalIncome: 32000,
      totalExpenses: 18000,
      balance: 14000,
      advancePayment: 18000,
      pendingPayment: 14000,
    },
    expenses: [
      { 
        id: 3, 
        category: 'pollo', 
        description: 'Catering - Pollo asado', 
        amount: 2500, 
        date: '2025-01-18', 
        receipt: 'receipt3.pdf', 
        registeredBy: 5,
        registeredByName: 'Jorge Ramírez',
        paymentMethod: 'transferencia',
        status: 'approved',
      },
    ],
    decoration: [
      { id: 3, item: 'Iluminación LED', quantity: 10, unitPrice: 80, totalPrice: 800, supplier: 'Luces Pro', notes: 'Colores cálidos', estado: 'pendiente' },
    ],
    furniture: [
      { id: 3, item: 'Sillas plegables', quantity: 200, condition: 'bueno', location: 'Almacén C', notes: 'Negras' },
    ],
    staff: [
      { id: 3, name: 'Jorge Ramírez', role: 'Encargado de Compras', hours: 10, hourlyRate: 30, totalCost: 300, contact: '+51 999 555 666', userId: 5 },
      { id: 4, name: 'Carlos López', role: 'Técnico de sonido', hours: 10, hourlyRate: 30, totalCost: 300, contact: '+51 999 777 888' },
    ],
    timeline: [
      { id: 3, date: '2024-12-10', title: 'Reserva confirmada', description: 'Venue reservado', type: 'milestone', completed: true },
    ],
    tags: ['música', 'jazz', 'concierto'],
    createdBy: 2,
    createdByName: 'Socio Principal',
    createdAt: '2024-11-15',
    updatedAt: '2025-01-12',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
  },
  {
    id: 3,
    name: 'Gala Benéfica Anual',
    description: 'Cena de gala para recaudación de fondos',
    type: 'corporate',
    status: 'confirmed',
    date: '2025-01-25',
    location: 'Salón Imperial',
    venue: 'Hotel Luxury',
    attendees: 420,
    maxAttendees: 500,
    client: MOCK_CLIENTS[2],
    financial: {
      budget: 80000,
      totalIncome: 75000,
      totalExpenses: 45000,
      balance: 30000,
      advancePayment: 40000,
      pendingPayment: 35000,
    },
    expenses: [
      { 
        id: 4, 
        category: 'verduras', 
        description: 'Ensaladas y guarniciones', 
        amount: 1800, 
        date: '2025-01-22', 
        receipt: 'receipt4.pdf', 
        registeredBy: 6,
        registeredByName: 'María López',
        paymentMethod: 'efectivo',
        status: 'approved',
      },
      { 
        id: 5, 
        category: 'kiosco', 
        description: 'Bebidas premium', 
        amount: 3500, 
        date: '2025-01-23', 
        receipt: 'receipt5.pdf', 
        registeredBy: 6,
        registeredByName: 'María López',
        paymentMethod: 'tarjeta',
        status: 'pending',
      },
    ],
    decoration: [
      { id: 4, item: 'Manteles de gala', quantity: 50, unitPrice: 30, totalPrice: 1500, supplier: 'Textiles Finos', notes: 'Color dorado', estado: 'completado' },
    ],
    furniture: [
      { id: 4, item: 'Mesas imperiales', quantity: 50, condition: 'excelente', location: 'Almacén Premium', notes: 'Para 10 personas' },
    ],
    staff: [
      { id: 5, name: 'María López', role: 'Encargada de Compras', hours: 12, hourlyRate: 35, totalCost: 420, contact: '+51 999 888 999', userId: 6 },
      { id: 6, name: 'Laura Martínez', role: 'Coordinadora de eventos', hours: 12, hourlyRate: 35, totalCost: 420, contact: '+51 999 777 888' },
    ],
    timeline: [
      { id: 4, date: '2024-11-20', title: 'Propuesta aceptada', description: 'Cliente aprobó presupuesto', type: 'milestone', completed: true },
    ],
    tags: ['gala', 'benéfica', 'corporativo'],
    createdBy: 1,
    createdByName: 'Admin Sistema',
    createdAt: '2024-10-15',
    updatedAt: '2025-01-14',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
  },
];

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