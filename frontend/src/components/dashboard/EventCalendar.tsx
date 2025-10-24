import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Event } from '@/types/events';
import { MOCK_EVENTS } from '@/lib/mockData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventCalendarProps {
  events?: Event[];
}

export function EventCalendar({ events: propEvents }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  // Cargar eventos de localStorage y combinar con MOCK_EVENTS
  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const combined = [...MOCK_EVENTS, ...storedEvents];
    setAllEvents(propEvents || combined);
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
      return `bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 ${isToday ? 'ring-2 ring-primary' : ''}`;
    }
    
    return `bg-green-500/10 border-green-500/30 hover:bg-green-500/20 ${isToday ? 'ring-2 ring-primary' : ''}`;
  };

  const renderTooltipContent = (day: number) => {
    const date = new Date(year, month, day);
    const dateEvents = getEventsForDate(date);
    
    if (dateEvents.length === 0) {
      return (
        <div className="text-sm">
          <p className="font-semibold text-green-400">Fecha disponible</p>
          <p className="text-xs text-muted-foreground mt-1">Sin eventos programados</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 min-w-[200px]">
        {dateEvents.map(event => (
          <div key={event.id} className="text-sm space-y-1">
            <p className="font-semibold text-purple-400">{event.name}</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>👥 {event.attendees} personas</p>
              <p>💰 Adelanto: S/ {(event.financial?.advancePayment || 0).toLocaleString()}</p>
              <p>📍 {event.location}</p>
              {event.status === 'confirmed' && (
                <p className="text-green-400">✓ Confirmado</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gradient-card rounded-xl p-6 border border-border animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Calendario de Eventos</h3>
          </div>
          <p className="text-sm text-muted-foreground">Fechas disponibles y reservadas</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="min-w-[140px] text-center">
            <span className="font-semibold text-foreground">
              {monthNames[month]} {year}
            </span>
          </div>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-2">
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
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        w-full h-full rounded-lg border-2 transition-all cursor-pointer
                        flex items-center justify-center
                        ${getCellStyle(day)}
                      `}
                    >
                      <span className="text-sm font-medium">{day}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-popover border-border">
                    {renderTooltipContent(day)}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500/50" />
          <span className="text-xs text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500/20 border-2 border-purple-500/50" />
          <span className="text-xs text-muted-foreground">Reservado</span>
        </div>
      </div>
    </div>
  );
}
