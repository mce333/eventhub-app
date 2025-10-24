// Roles de personal con tarifas predeterminadas

export interface StaffRole {
  id: string;
  name: string;
  defaultRate: number;
  rateType: 'hourly' | 'perPlate';
  canHaveSystemAccess: boolean;
  description: string;
}

export const STAFF_ROLES: StaffRole[] = [
  {
    id: 'coordinador',
    name: 'Coordinador',
    defaultRate: 15,
    rateType: 'hourly',
    canHaveSystemAccess: true,
    description: 'Coordinador general del evento (puede tener acceso al sistema)',
  },
  {
    id: 'encargado_compras',
    name: 'Encargado de Compras',
    defaultRate: 10,
    rateType: 'hourly',
    canHaveSystemAccess: true,
    description: 'Encargado de compras y gastos (puede tener acceso al sistema)',
  },
  {
    id: 'mesero',
    name: 'Mesero',
    defaultRate: 10,
    rateType: 'hourly',
    canHaveSystemAccess: false,
    description: 'Mesero / Servicio de mesa',
  },
  {
    id: 'limpieza',
    name: 'Servicio de Limpieza',
    defaultRate: 15,
    rateType: 'hourly',
    canHaveSystemAccess: false,
    description: 'Personal de limpieza',
  },
  {
    id: 'servido',
    name: 'Servicio de Servido',
    defaultRate: 5,
    rateType: 'perPlate',
    canHaveSystemAccess: false,
    description: 'Personal de servido (tarifa por plato)',
  },
];

export function getStaffRole(roleId: string): StaffRole | undefined {
  return STAFF_ROLES.find(r => r.id === roleId);
}

export function canRoleHaveSystemAccess(roleId: string): boolean {
  const role = getStaffRole(roleId);
  return role?.canHaveSystemAccess || false;
}

export function getDefaultRate(roleId: string): number {
  const role = getStaffRole(roleId);
  return role?.defaultRate || 0;
}

export function getRateType(roleId: string): 'hourly' | 'perPlate' {
  const role = getStaffRole(roleId);
  return role?.rateType || 'hourly';
}
