export interface DecorationProvider {
  id: string;
  name: string;
}

export interface DecorationPackage {
  id: string;
  name: string;
  providerCost: number;
  clientCost: number;
  description: string;
}

export const DECORATION_PROVIDERS: DecorationProvider[] = [
  { id: 'jimmy', name: 'Jimmy' },
  { id: 'juan', name: 'Juan' },
  { id: 'maria', name: 'María Decoraciones' },
  { id: 'eventos-premium', name: 'Eventos Premium' },
];

export const DECORATION_PACKAGES: DecorationPackage[] = [
  {
    id: 'cumpleanos-completa',
    name: 'Decoración Completa de Cumpleaños',
    providerCost: 1500,
    clientCost: 2000,
    description: 'Incluye globos, centros de mesa, manteles y decoración temática',
  },
  {
    id: 'flores-especial',
    name: 'Decoración Especial con Flores',
    providerCost: 3000,
    clientCost: 4000,
    description: 'Arreglos florales premium, centros de mesa elegantes',
  },
  {
    id: 'boda-elegante',
    name: 'Decoración de Boda Elegante',
    providerCost: 4500,
    clientCost: 6000,
    description: 'Decoración completa para bodas con flores naturales y telas finas',
  },
  {
    id: 'tematica-infantil',
    name: 'Decoración Temática Infantil',
    providerCost: 1200,
    clientCost: 1800,
    description: 'Decoración con personajes, globos y elementos infantiles',
  },
];