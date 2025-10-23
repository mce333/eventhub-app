import { Event, CreateEventDTO, UpdateEventDTO, EventFilters } from '@/types/events';
import { MOCK_EVENTS } from '@/lib/mockData';
import api from './api';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// Simular delay de red
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 300));

class EventsService {
  private events: Event[] = [...MOCK_EVENTS];

  async getAll(filters?: EventFilters): Promise<Event[]> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      
      let filtered = [...this.events];

      // Aplicar filtros
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          e => e.name.toLowerCase().includes(search) ||
               e.description.toLowerCase().includes(search) ||
               e.location.toLowerCase().includes(search)
        );
      }

      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(e => e.status === filters.status);
      }

      if (filters?.type && filters.type !== 'all') {
        filtered = filtered.filter(e => e.type === filters.type);
      }

      if (filters?.dateFrom) {
        filtered = filtered.filter(e => e.date >= filters.dateFrom!);
      }

      if (filters?.dateTo) {
        filtered = filtered.filter(e => e.date <= filters.dateTo!);
      }

      // Ordenar
      if (filters?.sortBy) {
        filtered.sort((a, b) => {
          let aVal: string | number;
          let bVal: string | number;
          
          switch (filters.sortBy) {
            case 'date':
              aVal = new Date(a.date).getTime();
              bVal = new Date(b.date).getTime();
              break;
            case 'name':
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case 'attendees':
              aVal = a.attendees;
              bVal = b.attendees;
              break;
            case 'budget':
              aVal = a.financial.budget;
              bVal = b.financial.budget;
              break;
            default:
              return 0;
          }

          const order = filters.sortOrder === 'desc' ? -1 : 1;
          return aVal > bVal ? order : aVal < bVal ? -order : 0;
        });
      }

      return filtered;
    }

    const response = await api.get<Event[]>('/events', { params: filters });
    return response.data;
  }

  async getById(id: number): Promise<Event> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      const event = this.events.find(e => e.id === id);
      if (!event) {
        throw new Error('Evento no encontrado');
      }
      return event;
    }

    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  }

  async create(data: CreateEventDTO): Promise<Event> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      
      const newEvent: Event = {
        id: Math.max(...this.events.map(e => e.id)) + 1,
        name: data.name,
        description: data.description,
        type: data.type,
        status: 'draft',
        date: data.date,
        endDate: data.endDate,
        location: data.location,
        venue: data.venue,
        attendees: 0,
        maxAttendees: data.maxAttendees,
        client: {
          id: data.clientId,
          name: 'Cliente Demo',
          email: 'cliente@demo.com',
          phone: '+34 600 000 000',
        },
        financial: {
          budget: data.budget,
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          advancePayment: 0,
          pendingPayment: data.budget,
        },
        expenses: [],
        decoration: [],
        furniture: [],
        staff: [],
        timeline: [],
        tags: [],
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.events.push(newEvent);
      return newEvent;
    }

    const response = await api.post<Event>('/events', data);
    return response.data;
  }

  async update(id: number, data: UpdateEventDTO): Promise<Event> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      
      const index = this.events.findIndex(e => e.id === id);
      if (index === -1) {
        throw new Error('Evento no encontrado');
      }

      this.events[index] = {
        ...this.events[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return this.events[index];
    }

    const response = await api.patch<Event>(`/events/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      
      const index = this.events.findIndex(e => e.id === id);
      if (index === -1) {
        throw new Error('Evento no encontrado');
      }

      this.events.splice(index, 1);
      return;
    }

    await api.delete(`/events/${id}`);
  }

  async duplicate(id: number): Promise<Event> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      
      const original = this.events.find(e => e.id === id);
      if (!original) {
        throw new Error('Evento no encontrado');
      }

      const duplicated: Event = {
        ...original,
        id: Math.max(...this.events.map(e => e.id)) + 1,
        name: `${original.name} (Copia)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.events.push(duplicated);
      return duplicated;
    }

    const response = await api.post<Event>(`/events/${id}/duplicate`);
    return response.data;
  }

  async updateStatus(id: number, status: Event['status']): Promise<Event> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      
      const index = this.events.findIndex(e => e.id === id);
      if (index === -1) {
        throw new Error('Evento no encontrado');
      }

      this.events[index] = {
        ...this.events[index],
        status,
        updatedAt: new Date().toISOString(),
      };

      return this.events[index];
    }

    const response = await api.patch<Event>(`/events/${id}/status`, { status });
    return response.data;
  }

  async getByUserId(userId: number): Promise<Event[]> {
    if (isDemoMode) {
      await simulateNetworkDelay();
      return this.events.filter(e => e.createdBy === userId);
    }

    const response = await api.get<Event[]>(`/users/${userId}/events`);
    return response.data;
  }
}

export const eventsService = new EventsService();