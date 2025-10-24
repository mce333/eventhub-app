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

  return (
    <div className="bg-gradient-card rounded-xl p-6 border border-border">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Calendario</h3>
        
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
      <TooltipProvider>
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
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        w-full h-full rounded-md transition-all cursor-pointer
                        flex items-center justify-center text-sm
                        ${getCellStyle(day)}
                      `}
                    >
                      {day}
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

      {/* Legend - Simplified */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
          <span className="text-xs text-muted-foreground">Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/50" />
          <span className="text-xs text-muted-foreground">Reservado</span>
        </div>
      </div>
    </div>
  );
}
