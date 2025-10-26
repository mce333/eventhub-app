import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Event } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { Sparkles, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface EventDecorationTabProps {
  event: Event;
  onUpdate?: () => void;
}

export function EventDecorationTab({ event, onUpdate }: EventDecorationTabProps) {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    estadoPago: 'pendiente' | 'adelanto' | 'pagado';
    montoPagado: number;
  }>({ estadoPago: 'pendiente', montoPagado: 0 });

  const canEdit = userRole === 'admin';
  
  const totalProviderCost = event.decoration?.reduce((sum, item) => sum + (item.providerCost || 0), 0) || 0;
  const totalClientCost = event.decoration?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const totalProfit = totalClientCost - totalProviderCost;

  const handleEditPayment = (index: number) => {
    const item = event.decoration![index];
    setEditingIndex(index);
    setEditData({
      estadoPago: (item as any).estadoPago || 'pendiente',
      montoPagado: (item as any).montoPagado || 0,
    });
  };

  const handleSavePayment = (index: number) => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    let eventIndex = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    // If event not in localStorage, add it first
    if (eventIndex === -1) {
      storedEvents.push({ ...event });
      eventIndex = storedEvents.length - 1;
    }
    
    if (eventIndex !== -1 && storedEvents[eventIndex].decoration) {
      // Update payment info
      (storedEvents[eventIndex].decoration[index] as any).estadoPago = editData.estadoPago;
      (storedEvents[eventIndex].decoration[index] as any).montoPagado = editData.montoPagado;
      (storedEvents[eventIndex].decoration[index] as any).updatedBy = `${user?.name} ${user?.last_name}`;
      (storedEvents[eventIndex].decoration[index] as any).updatedAt = new Date().toLocaleString('es-ES');
      
      // Determine estado based on payment
      let newEstado = 'pendiente';
      const totalCost = storedEvents[eventIndex].decoration[index].totalPrice;
      
      if (editData.montoPagado >= totalCost && editData.estadoPago === 'pagado') {
        newEstado = 'completado';
      } else if (editData.montoPagado > 0 || editData.estadoPago === 'adelanto') {
        newEstado = 'en_proceso';
      }
      
      storedEvents[eventIndex].decoration[index].estado = newEstado as any;
      
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      toast.success('Estado de pago actualizado');
      setEditingIndex(null);
      onUpdate?.();
    }
  };

  const getPaymentStatusBadge = (estadoPago: string) => {
    switch (estadoPago) {
      case 'pagado':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Pagado</Badge>;
      case 'adelanto':
        return <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/30">Adelanto Dado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-700 border-gray-500/30">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">S/ {totalProviderCost.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">S/ {totalClientCost.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-success/10 border-success/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ganancia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">S/ {totalProfit.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Items de Decoración
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.decoration && event.decoration.length > 0 ? (
            <div className="space-y-3">
              {event.decoration.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{item.item}</h4>
                        <Badge variant="outline" className={
                          item.estado === 'completado' ? 'bg-success/10 text-success border-success/20' :
                          item.estado === 'en_proceso' ? 'bg-warning/10 text-warning border-warning/20' :
                          'bg-muted/10 text-muted-foreground border-muted/20'
                        }>
                          {item.estado === 'completado' ? 'Completado' :
                           item.estado === 'en_proceso' ? 'En Progreso' : 'Pendiente'}
                        </Badge>
                        {getPaymentStatusBadge((item as any).estadoPago || 'pendiente')}
                      </div>
                      {item.supplier && (
                        <p className="text-sm text-muted-foreground">Proveedor: {item.supplier}</p>
                      )}
                    </div>
                    {canEdit && editingIndex !== index && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPayment(index)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar Pago
                      </Button>
                    )}
                  </div>
                  
                  {editingIndex === index ? (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Estado de Pago</Label>
                          <select
                            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                            value={editData.estadoPago}
                            onChange={(e) => setEditData({ ...editData, estadoPago: e.target.value as any })}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="adelanto">Adelanto Dado</option>
                            <option value="pagado">Pagado Completo</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Monto Pagado (S/)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editData.montoPagado}
                            onChange={(e) => setEditData({ ...editData, montoPagado: parseFloat(e.target.value) || 0 })}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSavePayment(index)} className="flex-1">
                          <Save className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)} className="flex-1">
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cantidad</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Costo Proveedor</p>
                          <p className="font-medium">S/ {(item.providerCost || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Costo Cliente</p>
                          <p className="font-medium">S/ {item.totalPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ganancia</p>
                          <p className="font-bold text-success">
                            S/ {(item.profit || (item.totalPrice - (item.providerCost || 0))).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {(item as any).montoPagado > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Monto Pagado:</span>
                            <span className="font-bold text-green-600">S/ {((item as any).montoPagado || 0).toFixed(2)}</span>
                          </div>
                          {(item as any).updatedBy && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Actualizado por: {(item as any).updatedBy} - {(item as any).updatedAt}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No hay decoración registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}