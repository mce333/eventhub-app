export type EventType = 'quince_años' | 'boda' | 'cumpleaños' | 'corporativo' | 'otro';
export type EventStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceType = 'con_comida' | 'solo_alquiler';
export type PaymentType = 'cover' | 'compra_local';
export type TimelineType = 'milestone' | 'payment' | 'meeting' | 'task';
export type ExpenseCategory = 'kiosco' | 'pollo' | 'verduras' | 'decoracion' | 'mobiliario' | 'personal' | 'salchichas' | 'papas' | 'cerveza' | 'vigilancia' | 'limpieza' | 'otros';

export interface EventClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  tipoCliente?: 'individual' | 'corporativo';
  last_name?: string;
  address?: string;
  document_type?: string;
  document_number?: string;
}

export interface FoodDetails {
  tipoDePlato: string;
  cantidadDePlatos: number;
  precioPorPlato: number;
  incluyeCerveza: boolean;
  numeroCajasCerveza?: number;
  costoPorCaja?: number;
  tipoDePago: PaymentType;
}

export interface BeverageItem {
  id: number;
  tipo: 'gaseosa' | 'agua' | 'champan' | 'vino' | 'cerveza' | 'coctel';
  litros?: number;
  cantidad?: number; // Cantidad de unidades/cajas/cocteles
  precioUnitario?: number; // Precio por unidad para gaseosa/agua/champan/vino
  numeroCajas?: number;
  modalidad?: 'cover' | 'compra_local';
  costoPorCaja?: number;
  costoCajaLocal?: number;
  costoCajaCliente?: number;
  costoCoctelLocal?: number;
  costoCoctelCliente?: number;
  utilidad?: number;
}

export interface RentalDetails {
  cantidadMesas: number;
  cantidadVasos: number;
  incluyeDecoracion: boolean;
  incluyeVigilancia: boolean;
}

export interface EventContract {
  precioTotal: number;
  pagoAdelantado: number;
  saldoPendiente: number;
  garantia?: number;
  presupuestoAsignado?: number;
  contratoFoto?: string;
  recibos: string[]; // URLs de recibos
}

export interface EventFinancial {
  budget: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  advancePayment: number;
  pendingPayment: number;
}

export interface EventTimeline {
  id: number;
  date: string;
  title: string;
  description: string;
  type: TimelineType;
  completed: boolean;
}

export interface EventExpense {
  id: number;
  category: ExpenseCategory;
  description: string;
  cantidad: number;
  costoUnitario: number;
  amount: number;
  date: string;
  receipt?: string;
  registeredBy: number; // User ID
  registeredByName: string;
  registeredAt: string;
  isPredetermined: boolean; // Si fue calculado automáticamente
}

export interface EventDecoration {
  id: number;
  item: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier?: string;
  providerCost?: number; // Costo con proveedor
  profit?: number; // Utilidad
  estado: 'pendiente' | 'comprado' | 'instalado';
  estadoPago?: 'pendiente' | 'adelanto' | 'pagado'; // Estado de pago
  montoPagado?: number; // Monto pagado (adelanto o completo)
  notes?: string;
}

export interface EventFurniture {
  id: number;
  item: string;
  quantity: number;
  condition: 'excelente' | 'bueno' | 'regular' | 'malo';
  location: string;
  notes?: string;
}

export interface EventStaff {
  id?: number;
  name: string;
  role: string;
  roleId?: string; // ID del rol predeterminado
  hours?: number;
  plates?: number; // Para servicio de servido (tarifa por plato)
  hourlyRate: number;
  totalCost: number;
  contact: string;
  userId?: number; // ID del usuario del sistema si tiene acceso
  hasSystemAccess?: boolean; // Indica si se le dará acceso al sistema
  systemEmail?: string; // Email para acceso al sistema
  systemPassword?: string; // Contraseña temporal
}

export interface AuditLog {
  id: number;
  eventId: number;
  userId: number;
  userName: string;
  userRole: string;
  action: 'created' | 'updated' | 'deleted';
  section: 'evento' | 'contrato' | 'decoracion' | 'personal' | 'gastos';
  description: string;
  timestamp: string;
  isSuspicious: boolean; // Si Admin/Socio modificó gastos
  changes?: Record<string, { before: unknown; after: unknown }>;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  type: EventType;
  status: EventStatus;
  eventCategory?: 'evento' | 'reserva'; // Nueva categoría para diferenciar eventos de reservas
  date: string;
  endDate?: string;
  location: string;
  venue: string;
  attendees: number;
  maxAttendees: number;
  
  // Tipo de servicio
  serviceType: ServiceType;
  foodDetails?: FoodDetails;
  beverages?: BeverageItem[];
  rentalDetails?: RentalDetails;
  
  // Cliente y contrato
  client: EventClient;
  contract: EventContract;
  financial: EventFinancial;
  
  // Módulos
  expenses?: EventExpense[];
  decoration?: EventDecoration[];
  furniture?: EventFurniture[];
  staff?: EventStaff[];
  timeline?: EventTimeline[];
  auditLog?: AuditLog[];
  
  tags?: string[];
  notes?: string;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}

export interface EventFilters {
  search?: string;
  status?: EventStatus | 'all';
  type?: EventType | 'all';
  serviceType?: ServiceType | 'all';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'name' | 'attendees' | 'budget';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateEventDTO {
  // Paso 1: Básico
  name: string;
  type: EventType;
  date: string;
  maxAttendees: number;
  
  // Paso 2: Servicio
  serviceType: ServiceType;
  foodDetails?: FoodDetails;
  rentalDetails?: RentalDetails;
  
  // Paso 3: Cliente
  client: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Paso 4: Contrato
  contract: {
    precioTotal: number;
    pagoAdelantado: number;
    contratoFoto?: File;
    recibos?: File[];
  };
  
  // Paso 5: Decoración (opcional)
  decoration?: Omit<EventDecoration, 'id'>[];
  
  // Paso 6: Personal (opcional)
  staff?: Omit<EventStaff, 'id'>[];
  
  description?: string;
  location?: string;
  venue?: string;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {
  status?: EventStatus;
  attendees?: number;
}

export interface PredeterminedExpense {
  category: ExpenseCategory;
  description: string;
  cantidad: number;
  baseUnit: string; // 'platos', 'personas', etc.
}