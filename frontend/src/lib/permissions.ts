import { User } from '@/types/auth.types';
import { Event } from '@/types/events';

export type UserRole = 'admin' | 'socio' | 'coordinador' | 'encargado_compras' | 'servicio';

export interface Permission {
  canViewDashboard: boolean;
  canViewEvents: boolean;
  canCreateEvent: boolean;
  canEditEvent: boolean;
  canDeleteEvent: boolean;
  canViewClients: boolean;
  canManageClients: boolean;
  canViewFinancial: boolean;
  canViewReports: boolean;
  canViewStatistics: boolean;
  canManageUsers: boolean;
  canRegisterExpenses: boolean;
  canViewAllExpenses: boolean;
  canViewDecoration: boolean;
  canEditDecoration: boolean;
  canViewFurniture: boolean;
  canEditFurniture: boolean;
  canViewStaff: boolean;
  canManageStaff: boolean;
  canViewSpaces: boolean;
  canManageSpaces: boolean;
  canViewWarehouse: boolean;
  canManageWarehouse: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    canViewDashboard: true,
    canViewEvents: true,
    canCreateEvent: true,
    canEditEvent: true,
    canDeleteEvent: true,
    canViewClients: true,
    canManageClients: true,
    canViewFinancial: true,
    canViewReports: true,
    canViewStatistics: true,
    canManageUsers: true,
    canRegisterExpenses: true,
    canViewAllExpenses: true,
    canViewDecoration: true,
    canEditDecoration: true,
    canViewFurniture: true,
    canEditFurniture: true,
    canViewStaff: true,
    canManageStaff: true,
    canViewSpaces: true,
    canManageSpaces: true,
    canViewWarehouse: true,
    canManageWarehouse: true,
  },
  socio: {
    canViewDashboard: true,
    canViewEvents: true,
    canCreateEvent: true,
    canEditEvent: true,
    canDeleteEvent: true,
    canViewClients: true,
    canManageClients: true,
    canViewFinancial: true,
    canViewReports: true,
    canViewStatistics: true,
    canManageUsers: false,
    canRegisterExpenses: true,
    canViewAllExpenses: true,
    canViewDecoration: true,
    canEditDecoration: true,
    canViewFurniture: true,
    canEditFurniture: true,
    canViewStaff: true,
    canManageStaff: true,
    canViewSpaces: true,
    canManageSpaces: true,
    canViewWarehouse: false,
    canManageWarehouse: false,
  },
  coordinador: {
    canViewDashboard: false,
    canViewEvents: true, // Solo eventos asignados
    canCreateEvent: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canViewClients: false,
    canManageClients: false,
    canViewFinancial: false,
    canViewReports: false,
    canViewStatistics: false,
    canManageUsers: false,
    canRegisterExpenses: true, // Solo para eventos asignados
    canViewAllExpenses: false,
    canViewDecoration: false,
    canEditDecoration: false,
    canViewFurniture: false,
    canEditFurniture: false,
    canViewStaff: false,
    canManageStaff: false,
    canViewSpaces: false,
    canManageSpaces: false,
    canViewWarehouse: true, // SÍ tiene acceso a almacén (pero solo su historial)
    canManageWarehouse: true,
  },
  encargado_compras: {
    canViewDashboard: false,
    canViewEvents: true,
    canCreateEvent: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canViewClients: false,
    canManageClients: false,
    canViewFinancial: false,
    canViewReports: false,
    canViewStatistics: false,
    canManageUsers: false,
    canRegisterExpenses: true,
    canViewAllExpenses: false,
    canViewDecoration: false,
    canEditDecoration: false,
    canViewFurniture: false,
    canEditFurniture: false,
    canViewStaff: false,
    canManageStaff: false,
    canViewSpaces: false,
    canManageSpaces: false,
    canViewWarehouse: false,
    canManageWarehouse: false,
  },
  servicio: {
    canViewDashboard: false,
    canViewEvents: true, // Only assigned events
    canCreateEvent: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canViewClients: false,
    canManageClients: false,
    canViewFinancial: false,
    canViewReports: false,
    canViewStatistics: false,
    canManageUsers: false,
    canRegisterExpenses: true, // Only for assigned events
    canViewAllExpenses: false,
    canViewDecoration: false,
    canEditDecoration: false,
    canViewFurniture: false,
    canEditFurniture: false,
    canViewStaff: false,
    canManageStaff: false,
    canViewSpaces: false,
    canManageSpaces: false,
    canViewWarehouse: true,
    canManageWarehouse: true,
  },
};

export function getUserRole(user: { role?: { name?: string } } | null): UserRole {
  if (!user || !user.role || !user.role.name) {
    return 'servicio';
  }
  
  const roleName = user.role.name;
  if (roleName === 'admin' || roleName === 'socio' || roleName === 'coordinador' || roleName === 'encargado_compras' || roleName === 'servicio') {
    return roleName as UserRole;
  }
  
  return 'servicio';
}

export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, keyof Permission> = {
    '/': 'canViewDashboard',
    '/eventos': 'canViewEvents',
    '/finanzas': 'canViewFinancial',
    '/clientes': 'canViewClients',
    '/estadisticas': 'canViewStatistics',
    '/almacen': 'canViewWarehouse',
    '/configuracion': 'canManageUsers',
  };

  const permission = routePermissions[route];
  return permission ? hasPermission(role, permission) : false;
}

// Check if user can view a specific event
export function canViewEvent(user: User | null, event: Event): boolean {
  if (!user) return false;
  
  const role = getUserRole(user);
  
  // Admin y Socio pueden ver todos los eventos
  if (role === 'admin' || role === 'socio') {
    return true;
  }
  
  // Coordinador, Encargado de Compras y Servicio solo ven eventos asignados
  if (role === 'coordinador' || role === 'encargado_compras' || role === 'servicio') {
    const assignedEventIds = (user as any).assignedEventIds || [];
    return assignedEventIds.includes(event.id);
  }
  
  return false;
}

// Check if user can edit expenses for a specific event
export function canEditExpenses(user: User | null, event: Event): boolean {
  if (!user) return false;
  
  const role = getUserRole(user);
  
  // Admin and Socio can edit (but will be flagged as suspicious)
  if (role === 'admin' || role === 'socio') {
    return true;
  }
  
  // Coordinador, Encargado Compras y Servicio pueden editar solo eventos asignados
  if (role === 'coordinador' || role === 'encargado_compras' || role === 'servicio') {
    const assignedEventIds = (user as any).assignedEventIds || [];
    return assignedEventIds.includes(event.id);
  }
  
  return false;
}

// Check if an expense edit is suspicious (admin/socio editing expenses)
export function isSuspiciousExpenseEdit(user: User | null): boolean {
  if (!user) return false;
  const role = getUserRole(user);
  return role === 'admin' || role === 'socio';
}

// Get service users (for staff selection)
export function getServiceUsers(allUsers: User[]): User[] {
  return allUsers.filter(user => user.role?.name === 'servicio');
}