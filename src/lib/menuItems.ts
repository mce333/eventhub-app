export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'principal' | 'entrada' | 'postre' | 'bebida';
}

export const MENU_ITEMS: MenuItem[] = [
  // Platos Principales
  { id: 'pollo-parrilla', name: 'Pollo a la Parrilla', price: 50, category: 'principal' },
  { id: 'carne-asada', name: 'Carne Asada', price: 60, category: 'principal' },
  { id: 'pescado-frito', name: 'Pescado Frito', price: 55, category: 'principal' },
  { id: 'lomo-saltado', name: 'Lomo Saltado', price: 65, category: 'principal' },
  { id: 'arroz-pollo', name: 'Arroz con Pollo', price: 45, category: 'principal' },
  { id: 'tallarines-rojos', name: 'Tallarines Rojos', price: 40, category: 'principal' },
  { id: 'ceviche', name: 'Ceviche', price: 70, category: 'principal' },
  { id: 'parrillada-mixta', name: 'Parrillada Mixta', price: 80, category: 'principal' },
];

export const LOCATIONS = [
  { value: 'solaz', label: 'Solaz' },
  { value: 'praga', label: 'Praga' },
];