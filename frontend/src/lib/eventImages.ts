import { EventType } from '@/types/events';

// Imágenes predeterminadas por tipo de evento
export const EVENT_TYPE_IMAGES: Record<EventType, string> = {
  'quince_años': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
  'boda': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
  'cumpleaños': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
  'corporativo': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  'otro': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
};

// Función para obtener imagen por tipo de evento
export function getEventImageByType(eventType: EventType): string {
  return EVENT_TYPE_IMAGES[eventType] || EVENT_TYPE_IMAGES.otro;
}
