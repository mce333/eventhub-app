import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { Event, EventStatus } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole, hasPermission, canViewEvent, canEditExpenses } from '@/lib/permissions';
import { toast } from 'sonner';
import { EventInfoTab } from '@/components/events/EventInfoTab';
import { EventContractTab } from '@/components/events/EventContractTab';
import { EventDecorationTab } from '@/components/events/EventDecorationTab';
import { EventStaffTab } from '@/components/events/EventStaffTab';
import { EventExpensesTab } from '@/components/events/EventExpensesTab';
import { EventGalleryTab } from '@/components/events/EventGalleryTab';

const statusConfig: Record<EventStatus, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-muted/10 text-muted-foreground border-muted/20' },
  confirmed: { label: 'Confirmado', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  in_progress: { label: 'En Progreso', color: 'bg-warning/10 text-warning border-warning/20' },
  completed: { label: 'Completado', color: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function EventoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = getUserRole(user);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Event | null>(null);

  const canEdit = hasPermission(userRole, 'canEditEvent');
  const canViewFinancial = hasPermission(userRole, 'canViewFinancial');
  const isEncargadoCompras = userRole === 'encargado_compras';
  const isServicio = userRole === 'servicio';

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = () => {
    // Buscar en demo_events primero
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    
    // Combinar con MOCK_EVENTS
    const allEvents = [...MOCK_EVENTS, ...storedEvents];
    
    const foundEvent = allEvents.find(e => e.id === parseInt(id || '0'));
    
    if (foundEvent) {
      // Check if user has permission to view this event
      if (!canViewEvent(user, foundEvent)) {
        toast.error('No tienes permiso para ver este evento');
        navigate('/eventos');
        return;
      }
      
      setEvent(foundEvent);
      setEditedEvent(foundEvent);
    } else {
      toast.error('Evento no encontrado');
      navigate('/eventos');
    }
  };

  const handleSave = () => {
    if (!editedEvent) return;

    const storedEvents = localStorage.getItem('demo_events');
    if (storedEvents) {
      const events: Event[] = JSON.parse(storedEvents);
      const index = events.findIndex(e => e.id === editedEvent.id);
      
      if (index !== -1) {
        // Add audit log entry
        const updatedEvent = {
          ...editedEvent,
          updatedAt: new Date().toISOString(),
          auditLog: [
            ...(editedEvent.auditLog || []),
            {
              id: Date.now(),
              eventId: editedEvent.id,
              userId: user?.id || 1,
              userName: `${user?.name} ${user?.last_name}`,
              userRole: user?.role?.name || 'admin',
              action: 'updated' as const,
              section: 'evento',
              description: 'Información del evento actualizada',
              timestamp: new Date().toISOString(),
              changes: {},
            },
          ],
        };

        events[index] = updatedEvent;
        localStorage.setItem('demo_events', JSON.stringify(events));
        setEvent(updatedEvent);
        setIsEditing(false);
        toast.success('Evento actualizado correctamente');
      }
    }
  };

  const handleCancel = () => {
    setEditedEvent(event);
    setIsEditing(false);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8 flex items-center justify-center">
            <p className="text-muted-foreground">Cargando evento...</p>
          </main>
        </div>
      </div>
    );
  }

  // Determine default tab based on user role
  const defaultTab = isEncargadoCompras || isServicio ? 'expenses' : 'info';

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/eventos')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={statusConfig[event.status].color}>
                      {statusConfig[event.status].label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {canEdit && !isEncargadoCompras && !isServicio && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} className="bg-gradient-primary">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} className="bg-gradient-primary">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Service User Info Alert */}
            {isServicio && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Estás asignado a este evento como personal de servicio. Puedes registrar gastos en la pestaña "Gastos".
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Cards */}
            {canViewFinancial && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Presupuesto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">S/ {event.financial.budget.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ingresos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-success">
                      S/ {event.financial.totalIncome.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Gastos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-destructive">
                      S/ {event.financial.totalExpenses.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${event.financial.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                      S/ {event.financial.balance.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className={isEncargadoCompras || isServicio ? "grid w-full grid-cols-1" : "grid w-full grid-cols-6"}>
                {!isEncargadoCompras && !isServicio && (
                  <>
                    <TabsTrigger value="info">Información</TabsTrigger>
                    <TabsTrigger value="contract">Contrato</TabsTrigger>
                    <TabsTrigger value="decoration">Decoración</TabsTrigger>
                    <TabsTrigger value="staff">Personal</TabsTrigger>
                  </>
                )}
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
                {!isEncargadoCompras && !isServicio && (
                  <TabsTrigger value="gallery">Galería</TabsTrigger>
                )}
              </TabsList>

              {!isEncargadoCompras && !isServicio && (
                <>
                  <TabsContent value="info">
                    <EventInfoTab
                      event={isEditing ? editedEvent! : event}
                      isEditing={isEditing}
                      onUpdate={setEditedEvent}
                    />
                  </TabsContent>

                  <TabsContent value="contract">
                    <EventContractTab event={event} />
                  </TabsContent>

                  <TabsContent value="decoration">
                    <EventDecorationTab event={event} />
                  </TabsContent>

                  <TabsContent value="staff">
                    <EventStaffTab event={event} />
                  </TabsContent>
                </>
              )}

              <TabsContent value="expenses">
                <EventExpensesTab event={event} onUpdate={loadEvent} />
              </TabsContent>

              {!isEncargadoCompras && !isServicio && (
                <TabsContent value="gallery">
                  <EventGalleryTab event={event} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}