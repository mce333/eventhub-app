import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash,
  Copy,
  MoreVertical,
  Info,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOCK_EVENTS } from '@/lib/mockData';
import { Event, EventStatus, EventType } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole, hasPermission, canViewEvent } from '@/lib/permissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import { ChatbotHelper } from '@/components/dashboard/ChatbotHelper';

const statusConfig: Record<EventStatus, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-muted/10 text-muted-foreground border-muted/20' },
  confirmed: { label: 'Confirmado', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  in_progress: { label: 'En Progreso', color: 'bg-warning/10 text-warning border-warning/20' },
  completed: { label: 'Completado', color: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function Eventos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole(user);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreate = hasPermission(userRole, 'canCreateEvent');
  const canEdit = hasPermission(userRole, 'canEditEvent');
  const canDelete = hasPermission(userRole, 'canDeleteEvent');
  const canViewFinancial = hasPermission(userRole, 'canViewFinancial');
  const isEncargadoCompras = userRole === 'encargado_compras';
  const isServicio = userRole === 'servicio';

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    // Cargar SOLO eventos guardados en localStorage
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    
    console.log('📊 Eventos cargados desde localStorage:', storedEvents.length);
    
    // Filter events based on user role
    let filteredEvents = storedEvents;
    
    if (isServicio && user) {
      // Service users only see events they're assigned to
      filteredEvents = storedEvents.filter(event => canViewEvent(user, event));
      console.log('🔒 Eventos filtrados para servicio:', filteredEvents.length);
    }
    
    setEvents(filteredEvents);
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats
  const stats = {
    total: events.length,
    confirmed: events.filter((e) => e.status === 'confirmed').length,
    inProgress: events.filter((e) => e.status === 'in_progress').length,
    totalBudget: events.reduce((sum, e) => sum + e.financial.budget, 0),
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este evento?')) {
      // Eliminar de localStorage
      const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const updatedEvents = storedEvents.filter((e: Event) => e.id !== id);
      localStorage.setItem('demo_events', JSON.stringify(updatedEvents));
      
      // Recargar eventos
      loadEvents();
      toast.success('Evento eliminado correctamente');
    }
  };

  const handleDuplicate = (event: Event) => {
    const newEvent = {
      ...event,
      id: Date.now(),
      name: `${event.name} (Copia)`,
      status: 'draft' as EventStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    localStorage.setItem('demo_events', JSON.stringify(updatedEvents));
    toast.success('Evento duplicado correctamente');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {isEncargadoCompras ? 'Registrar Gastos' : isServicio ? 'Mis Eventos Asignados' : 'Gestión de Eventos'}
                </h1>
                <p className="text-muted-foreground">
                  {isEncargadoCompras
                    ? 'Selecciona un evento para registrar gastos'
                    : isServicio
                    ? 'Eventos donde estás asignado como personal de servicio'
                    : 'Administra y organiza todos tus eventos'}
                </p>
              </div>
              {canCreate && (
                <Button 
                  className="bg-gradient-primary hover:opacity-90 transition-opacity"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Evento
                </Button>
              )}
            </div>

            {/* Service User Alert */}
            {isServicio && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Mostrando solo eventos donde estás asignado como personal. Puedes registrar gastos en estos eventos.
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Cards - Only for Admin/Socio */}
            {!isEncargadoCompras && !isServicio && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Eventos</p>
                        <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Confirmados</p>
                        <p className="text-3xl font-bold text-foreground">{stats.confirmed}</p>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <Users className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">En Progreso</p>
                        <p className="text-3xl font-bold text-foreground">{stats.inProgress}</p>
                      </div>
                      <div className="p-3 bg-warning/10 rounded-lg">
                        <Calendar className="w-6 h-6 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Presupuesto Total</p>
                        <p className="text-3xl font-bold text-foreground">
                          S/ {stats.totalBudget.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-success/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card className="bg-gradient-card border-border animate-fade-in">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EventStatus | 'all')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as EventType | 'all')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="quince_años">15 Años</SelectItem>
                      <SelectItem value="boda">Boda</SelectItem>
                      <SelectItem value="cumpleaños">Cumpleaños</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="bg-gradient-card border-border hover:border-primary/50 transition-all animate-fade-in-up cursor-pointer group"
                  onClick={() => navigate(`/eventos/${event.id}`)}
                >
                  {event.imageUrl && (
                    <div className="h-48 overflow-hidden rounded-t-xl">
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {event.name}
                        </h3>
                        <Badge variant="outline" className={cn('text-xs', statusConfig[event.status].color)}>
                          {statusConfig[event.status].label}
                        </Badge>
                      </div>
                      {!isEncargadoCompras && !isServicio && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/eventos/${event.id}`);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalle
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                toast.info('Función en desarrollo');
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(event);
                            }}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(event.id);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>
                          {event.attendees} / {event.maxAttendees} personas
                        </span>
                      </div>
                      {canViewFinancial && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>S/ {event.financial.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {(isEncargadoCompras || isServicio) && (
                      <Button className="w-full mt-4" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/eventos/${event.id}`);
                      }}>
                        Registrar Gastos
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <Card className="bg-gradient-card border-border">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron eventos</h3>
                  <p className="text-muted-foreground">
                    {isServicio 
                      ? 'No tienes eventos asignados actualmente'
                      : 'Intenta ajustar los filtros o crea un nuevo evento'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal 
        open={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false);
          loadEvents();
        }} 
      />

      {/* Chatbot Helper */}
      <ChatbotHelper />
    </div>
  );
}
}