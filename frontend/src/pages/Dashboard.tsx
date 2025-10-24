import { Calendar, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EventCard } from "@/components/dashboard/EventCard";
import { EventCalendar } from "@/components/dashboard/EventCalendar";
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
                value={dashboardData.totalEvents}
                change="+12% vs mes anterior"
                changeType="positive"
                icon={Calendar}
                trend="up"
              />
              <MetricCard
                title="Ingresos Totales"
                value={`€${dashboardData.totalRevenue.toLocaleString()}`}
                change="+8.2% vs mes anterior"
                changeType="positive"
                icon={DollarSign}
                trend="up"
              />
              <MetricCard
                title="Eventos Activos"
                value={dashboardData.activeEvents}
                change="+5.4% vs mes anterior"
                changeType="positive"
                icon={Users}
                trend="up"
              />
              <MetricCard
                title="Ocupación Media"
                value="87%"
                change="-2.1% vs mes anterior"
                changeType="negative"
                icon={TrendingUp}
                trend="down"
              />
            </div>

            {/* Chart Section */}
            <StatChart data={dashboardData.monthlyStats} />

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
                {dashboardData.upcomingEvents.map((event) => (
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
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}