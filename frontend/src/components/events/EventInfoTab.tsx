import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Event } from '@/types/events';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EventInfoTabProps {
  event: Event;
  isEditing: boolean;
  onUpdate: (event: Event) => void;
}

export function EventInfoTab({ event, isEditing, onUpdate }: EventInfoTabProps) {
  const { user } = useAuth();
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>({});

  const handleStartEdit = (cardId: string, initialData: any) => {
    setEditingCard(cardId);
    setTempData(initialData);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setTempData({});
  };

  const handleSaveEdit = (cardId: string, section: string) => {
    // Create audit log entry
    const auditEntry = {
      id: Date.now(),
      eventId: event.id,
      userId: user?.id || 1,
      userName: `${user?.name} ${user?.last_name}`,
      userRole: user?.role?.name || 'admin',
      action: 'updated' as const,
      section: section,
      description: `${section} actualizado`,
      timestamp: new Date().toISOString(),
      changes: tempData,
    };

    const updatedEvent = {
      ...event,
      ...tempData,
      auditLog: [...(event.auditLog || []), auditEntry],
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: Event) => e.id === event.id);
    if (index !== -1) {
      storedEvents[index] = updatedEvent;
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
    }

    onUpdate(updatedEvent);
    setEditingCard(null);
    setTempData({});
    toast.success(`${section} actualizado correctamente`);
  };

  const handleDeleteBeverage = (beverageIndex: number) => {
    if (!confirm('¿Estás seguro de eliminar esta bebida?')) return;

    try {
      const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const index = storedEvents.findIndex((e: Event) => e.id === event.id);
      
      if (index !== -1) {
        const beverageToDelete = storedEvents[index].beverages[beverageIndex];
        
        // Eliminar bebida del array
        const updatedBeverages = storedEvents[index].beverages.filter((_: any, idx: number) => idx !== beverageIndex);
        storedEvents[index].beverages = updatedBeverages;
        
        // Crear entrada de auditoría
        const auditEntry = {
          id: Date.now(),
          eventId: event.id,
          userId: user?.id || 1,
          userName: `${user?.name} ${user?.last_name}`,
          userRole: user?.role?.name || 'admin',
          action: 'deleted' as const,
          section: 'Detalles de Bebidas',
          description: `Bebida eliminada: ${beverageToDelete.tipo} (${beverageToDelete.cantidad} unidades)`,
          timestamp: new Date().toISOString(),
        };
        
        storedEvents[index].auditLog = [...(storedEvents[index].auditLog || []), auditEntry];
        storedEvents[index].updatedAt = new Date().toISOString();
        
        localStorage.setItem('demo_events', JSON.stringify(storedEvents));
        
        // Update local event state
        const updatedEvent = {
          ...event,
          beverages: updatedBeverages,
          auditLog: [...(event.auditLog || []), auditEntry],
          updatedAt: new Date().toISOString(),
        };
        
        onUpdate(updatedEvent);
        toast.success('Bebida eliminada correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar bebida:', error);
      toast.error('Error al eliminar la bebida');
    }
  };

  return (
    <div className="space-y-6">
      {/* Información General */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información General</CardTitle>
            {editingCard === 'general' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => handleSaveEdit('general', 'Información General')} className="bg-gradient-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => handleStartEdit('general', { name: event.name, date: event.date, location: event.location, description: event.description })} className="bg-gradient-primary">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Evento</Label>
              <Input
                value={editingCard === 'general' ? tempData.name : event.name}
                onChange={(e) => setTempData({ ...tempData, name: e.target.value })}
                disabled={editingCard !== 'general'}
                className={editingCard !== 'general' ? 'bg-muted' : ''}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input value={event.type} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={editingCard === 'general' ? tempData.date : event.date}
                onChange={(e) => setTempData({ ...tempData, date: e.target.value })}
                disabled={editingCard !== 'general'}
                className={editingCard !== 'general' ? 'bg-muted' : ''}
              />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input
                value={editingCard === 'general' ? tempData.location : event.location}
                onChange={(e) => setTempData({ ...tempData, location: e.target.value })}
                disabled={editingCard !== 'general'}
                className={editingCard !== 'general' ? 'bg-muted' : ''}
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={editingCard === 'general' ? (tempData.description || '') : (event.description || '')}
              onChange={(e) => setTempData({ ...tempData, description: e.target.value })}
              disabled={editingCard !== 'general'}
              className={editingCard !== 'general' ? 'bg-muted' : ''}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información del Cliente</CardTitle>
            {editingCard === 'cliente' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => handleSaveEdit('cliente', 'Información del Cliente')} className="bg-gradient-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => handleStartEdit('cliente', { client: event.client })} className="bg-gradient-primary">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input 
                value={editingCard === 'cliente' ? (tempData.client?.name || '') : (event.client?.name || '')} 
                onChange={(e) => setTempData({ ...tempData, client: { ...tempData.client, name: e.target.value } })}
                disabled={editingCard !== 'cliente'}
                className={editingCard !== 'cliente' ? 'bg-muted' : ''}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={editingCard === 'cliente' ? (tempData.client?.email || '') : (event.client?.email || '')} 
                onChange={(e) => setTempData({ ...tempData, client: { ...tempData.client, email: e.target.value } })}
                disabled={editingCard !== 'cliente'}
                className={editingCard !== 'cliente' ? 'bg-muted' : ''}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input 
                value={editingCard === 'cliente' ? (tempData.client?.phone || '') : (event.client?.phone || '')} 
                onChange={(e) => setTempData({ ...tempData, client: { ...tempData.client, phone: e.target.value } })}
                disabled={editingCard !== 'cliente'}
                className={editingCard !== 'cliente' ? 'bg-muted' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalles de Comida */}
      {event.serviceType === 'con_comida' && event.foodDetails && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalles de Comida</CardTitle>
              {editingCard === 'comida' ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={() => handleSaveEdit('comida', 'Detalles de Comida')} className="bg-gradient-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => handleStartEdit('comida', { foodDetails: event.foodDetails })} className="bg-gradient-primary">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Plato</Label>
                <Input 
                  value={editingCard === 'comida' ? (tempData.foodDetails?.tipoDePlato || '') : event.foodDetails.tipoDePlato} 
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Cantidad de Platos</Label>
                <Input 
                  type="number"
                  value={editingCard === 'comida' ? (tempData.foodDetails?.cantidadDePlatos || '') : event.foodDetails.cantidadDePlatos} 
                  onChange={(e) => setTempData({ ...tempData, foodDetails: { ...tempData.foodDetails, cantidadDePlatos: parseInt(e.target.value) || 0 } })}
                  disabled={editingCard !== 'comida'}
                  className={editingCard !== 'comida' ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label>Precio por Plato</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={editingCard === 'comida' ? (tempData.foodDetails?.precioPorPlato || '') : event.foodDetails.precioPorPlato} 
                  onChange={(e) => setTempData({ ...tempData, foodDetails: { ...tempData.foodDetails, precioPorPlato: parseFloat(e.target.value) || 0 } })}
                  disabled={editingCard !== 'comida'}
                  className={editingCard !== 'comida' ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label>Costo Total</Label>
                <Input
                  value={`S/ ${editingCard === 'comida' ? ((tempData.foodDetails?.cantidadDePlatos || 0) * (tempData.foodDetails?.precioPorPlato || 0)).toFixed(2) : (event.foodDetails.cantidadDePlatos * event.foodDetails.precioPorPlato).toFixed(2)}`}
                  disabled
                  className="font-bold bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalles de Bebidas */}
      {event.serviceType === 'con_comida' && event.beverages && event.beverages.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalles de Bebidas</CardTitle>
              {editingCard === 'bebidas' ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={() => handleSaveEdit('bebidas', 'Detalles de Bebidas')} className="bg-gradient-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => handleStartEdit('bebidas', { beverages: event.beverages })} className="bg-gradient-primary">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(editingCard === 'bebidas' ? (tempData.beverages || []) : event.beverages).map((bev, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold capitalize">{bev.tipo}</p>
                      <p className="text-sm text-muted-foreground">
                        {bev.tipo === 'gaseosa' || bev.tipo === 'agua' || bev.tipo === 'champan' || bev.tipo === 'vino'
                          ? `${bev.cantidad || 0} unidades × S/ ${bev.precioUnitario || 0}`
                          : bev.tipo === 'cerveza'
                          ? bev.modalidad === 'cover'
                            ? `Cover - ${bev.numeroCajas || 0} cajas × S/ ${bev.costoPorCaja || 0}`
                            : `Local - ${bev.cantidad || 0} cajas × S/ ${bev.costoCajaLocal || 0}`
                          : bev.tipo === 'coctel'
                          ? bev.modalidad === 'cover'
                            ? `Cover - ${bev.cantidad || 0} cócteles × S/ ${bev.costoPorCaja || 0}`
                            : `Local - ${bev.cantidad || 0} cócteles × S/ ${bev.costoCoctelLocal || 0}`
                          : ''
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">
                        S/ {
                          bev.tipo === 'gaseosa' || bev.tipo === 'agua' || bev.tipo === 'champan' || bev.tipo === 'vino'
                            ? ((bev.cantidad || 0) * (bev.precioUnitario || 0)).toFixed(2)
                            : bev.tipo === 'cerveza'
                            ? bev.modalidad === 'cover'
                              ? ((bev.numeroCajas || 0) * (bev.costoPorCaja || 0)).toFixed(2)
                              : ((bev.cantidad || 0) * (bev.costoCajaLocal || 0)).toFixed(2)
                            : bev.tipo === 'coctel'
                            ? bev.modalidad === 'cover'
                              ? ((bev.cantidad || 0) * (bev.costoPorCaja || 0)).toFixed(2)
                              : ((bev.cantidad || 0) * (bev.costoCoctelLocal || 0)).toFixed(2)
                            : '0.00'
                        }
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBeverage(idx)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Auditoría */}
      <Card>
        <CardHeader>
          <CardTitle>Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {event.auditLog && event.auditLog.length > 0 ? (
              event.auditLog.slice(-5).reverse().map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Por {log.userName} ({log.userRole}) - {new Date(log.timestamp).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">No hay registros de auditoría</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
