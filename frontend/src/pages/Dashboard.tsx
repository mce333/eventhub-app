import { Calendar, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EventCard } from "@/components/dashboard/EventCard";
import { EventCalendar } from "@/components/dashboard/EventCalendar";
import { ChatbotHelper } from "@/components/dashboard/ChatbotHelper";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_DASHBOARD_DATA, MOCK_EVENTS } from "@/lib/mockData";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRole, hasPermission } from "@/lib/permissions";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole(user);

  // Redirect Encargado de Compras to /eventos
  useEffect(() => {
    if (!hasPermission(userRole, 'canViewDashboard')) {
      navigate('/eventos');
    }
  }, [userRole, navigate]);

  const dashboardData = MOCK_DASHBOARD_DATA[user?.id || 1];

  // Calcular métricas actualizadas
  const metrics = useMemo(() => {
    // Cargar eventos de localStorage y combinar con MOCK_EVENTS
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const allEvents = [...MOCK_EVENTS, ...storedEvents];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Eventos de este mes
    const eventosEsteMes = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).length;
    
    // Eventos realizados (completados)
    const eventosRealizados = allEvents.filter(event => event.status === 'completed').length;
    
    // Eventos por realizar (confirmados o en progreso)
    const eventosPorRealizar = allEvents.filter(event => 
      event.status === 'confirmed' || event.status === 'in_progress'
    ).length;
    
    // Calcular ingresos del mes
    const ingresosEventosRealizados = allEvents
      .filter(event => event.status === 'completed')
      .reduce((sum, event) => sum + (event.financial?.totalIncome || 0), 0);
    
    const adelantosEventosPorRealizar = allEvents
      .filter(event => event.status === 'confirmed' || event.status === 'in_progress')
      .reduce((sum, event) => sum + (event.financial?.advancePayment || 0), 0);
    
    const ingresosTotalesMes = ingresosEventosRealizados + adelantosEventosPorRealizar;
    
    return {
      eventosEsteMes,
      eventosRealizados,
      eventosPorRealizar,
      ingresosTotalesMes,
      ingresosEventosRealizados,
      adelantosEventosPorRealizar
    };
  }, []);

  if (!hasPermission(userRole, 'canViewDashboard')) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Bienvenido al Panel de Control
              </h1>
              <p className="text-muted-foreground">
                Gestiona tus eventos y visualiza el rendimiento de tu local
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Eventos Este Mes"
                value={metrics.eventosEsteMes}
                icon={Calendar}
                trend="up"
              />
              <MetricCard
                title="Eventos Realizados"
                value={metrics.eventosRealizados}
                icon={CheckCircle2}
                trend="up"
              />
              <MetricCard
                title="Eventos por Realizar"
                value={metrics.eventosPorRealizar}
                icon={Clock}
                trend="up"
              />
              <MetricCard
                title="Ingresos del Mes"
                value={`S/ ${metrics.ingresosTotalesMes.toLocaleString()}`}
                change={`Realizados: S/ ${metrics.ingresosEventosRealizados.toLocaleString()}`}
                extraInfo={`Adelantos: S/ ${metrics.adelantosEventosPorRealizar.toLocaleString()}`}
                icon={DollarSign}
                trend="up"
              />
            </div>

            {/* Calendar Section */}
            <EventCalendar />

            {/* Upcoming Events */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Próximos Eventos</h2>
                <button 
                  onClick={() => navigate('/eventos')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Ver todos
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0 ? (
                  dashboardData.upcomingEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      title={event.name}
                      date={new Date(event.date).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                      time="10:00 - 18:00"
                      location={event.location}
                      attendees={event.attendees}
                      capacity={event.attendees + 50}
                      status={event.status}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay eventos próximos</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Chatbot Helper */}
      <ChatbotHelper />
    </div>
  );
}