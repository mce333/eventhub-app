import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Eye, Clock } from 'lucide-react';
import { Event } from '@/types/events';
import { MOCK_EVENTS } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CreateEventModal } from '@/components/events/CreateEventModal';
import { ReserveDateModal } from '@/components/events/ReserveDateModal';

interface EventCalendarProps {
  events?: Event[];
}

export function EventCalendar({ events: propEvents }: EventCalendarProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);

  // Cargar eventos de localStorage
  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    console.log('📅 Calendario: eventos cargados:', storedEvents.length);
    setAllEvents(propEvents || storedEvents);
  }, [propEvents]);

  // Obtener eventos del mes actual
  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = date.toISOString().split('T')[0];
    return allEvents.filter(event => event.date === dateStr);
  };

  // Obtener información del mes
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Cambiar mes
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generar días del calendario
  const calendarDays: (number | null)[] = [];
  
  // Agregar espacios vacíos antes del primer día
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Agregar días del mes
  for (let day = 1; day <= totalDays; day++) {
    calendarDays.push(day);
  }

  const getCellStyle = (day: number | null) => {
    if (day === null) return 'invisible';
    
    const date = new Date(year, month, day);
    const dateEvents = getEventsForDate(date);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (dateEvents.length > 0) {
      // Verificar si es reserva rápida o evento completo
      const hasReservation = dateEvents.some(e => e.tags?.includes('reserva'));
      const hasFullEvent = dateEvents.some(e => !e.tags?.includes('reserva'));
      
      if (hasFullEvent) {
        // Rojo = Evento completo confirmado
        return `bg-red-600/40 border-2 border-red-500 hover:bg-red-600/60 ${isToday ? 'ring-2 ring-yellow-400' : ''}`;
      } else if (hasReservation) {
        // Naranja = Solo reserva rápida
        return `bg-orange-600/40 border-2 border-orange-500 hover:bg-orange-600/60 ${isToday ? 'ring-2 ring-yellow-400' : ''}`;
      }
    }
    
    // Verde = Disponible
    return `bg-green-600/30 border border-green-500/60 hover:bg-green-600/40 ${isToday ? 'ring-2 ring-yellow-400' : ''}`;
  };

  const renderTooltipContent = (day: number) => {
    const date = new Date(year, month, day);
    const dateEvents = getEventsForDate(date);
    
    if (dateEvents.length === 0) {
      return (
        <div className="text-sm">
          <p className="font-semibold">Disponible</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 min-w-[180px]">
        {dateEvents.map(event => (
          <div key={event.id} className="text-sm space-y-0.5">
            <p className="font-semibold">{event.name}</p>
            <div className="text-xs text-muted-foreground">
              <p>{event.attendees} personas</p>
              <p>S/ {(event.financial?.advancePayment || 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDayContent = (day: number) => {
    const date = new Date(year, month, day);
    const dateEvents = getEventsForDate(date);
    const hasEvents = dateEvents.length > 0;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            className={`
              w-full h-full rounded-md transition-all cursor-pointer
              flex items-center justify-center text-sm font-medium
              ${getCellStyle(day)}
            `}
          >
            {day}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="center">
          <div className="p-4 space-y-3">
            {/* Fecha */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <p className="font-semibold">{`${day} de ${monthNames[month]}, ${year}`}</p>
            </div>

            {hasEvents ? (
              /* Fecha ocupada - mostrar eventos y botón ver detalles */
              <>
                <div className="space-y-2">
                  {dateEvents.map(event => (
                    <div key={event.id} className="p-3 bg-muted/50 rounded-lg space-y-1">
                      <p className="font-medium text-sm">{event.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{event.attendees} personas</span>
                        <span>S/ {(event.financial?.advancePayment || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {dateEvents.length === 1 && (
                  <Button
                    onClick={() => navigate(`/eventos/${dateEvents[0].id}`)}
                    className="w-full"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                )}

                {dateEvents.length > 1 && (
                  <Button
                    onClick={() => navigate('/eventos')}
                    className="w-full"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Todos los Eventos
                  </Button>
                )}
              </>
            ) : (
              /* Fecha disponible - mostrar opciones */
              <>
                <div className="py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Fecha disponible</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setSelectedDate(date);
                      setShowCreateModal(true);
                    }}
                    className="w-full bg-primary"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Evento Completo
                  </Button>

                  <Button
                    onClick={() => {
                      setSelectedDate(date);
                      setShowReserveModal(true);
                    }}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Reservar Fecha Rápida
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Puedes crear un evento completo o hacer una reserva rápida
                </p>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <>
      <div className="bg-gradient-card rounded-xl p-6 border border-border">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Calendario Interactivo</h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="min-w-[120px] text-center">
              <span className="text-sm font-medium text-foreground">
                {monthNames[month]} {year}
              </span>
            </div>
            
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week days header */}
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div key={index} className="aspect-square">
              {day !== null ? (
                renderDayContent(day)
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-600/40 border-2 border-green-500" />
            <span className="text-xs text-muted-foreground">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-600/40 border-2 border-orange-500" />
            <span className="text-xs text-muted-foreground">Reservado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-600/40 border-2 border-red-500" />
            <span className="text-xs text-muted-foreground">Confirmado</span>
          </div>
        </div>
      </div>

      {/* Modales */}
      <CreateEventModal 
        open={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false);
          setSelectedDate(null);
        }} 
      />
      
      <ReserveDateModal
        open={showReserveModal}
        onClose={() => {
          setShowReserveModal(false);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
      />
    </>
  );
}
