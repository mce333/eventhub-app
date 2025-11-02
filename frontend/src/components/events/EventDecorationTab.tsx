import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Event } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { Sparkles, Edit2, Save, X, History } from 'lucide-react';
import { toast } from 'sonner';

interface EventDecorationTabProps {
  event: Event;
  onUpdate?: () => void;
}

interface PaymentRecord {
  id: number;
  monto: number;
  fecha: string;
  registradoPor: string;
  tipo: 'adelanto' | 'pago_completo';
}

export function EventDecorationTab({ event, onUpdate }: EventDecorationTabProps) {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    tipoPago: 'adelanto' | 'pago_completo';
    montoPago: number;
  }>({ tipoPago: 'adelanto', montoPago: 0 });

  const canEdit = userRole === 'admin';
  
  const totalProviderCost = event.decoration?.reduce((sum, item) => sum + (item.providerCost || 0), 0) || 0;
  const totalClientCost = event.decoration?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const totalProfit = totalClientCost - totalProviderCost;

  const getItemPayments = (item: any): PaymentRecord[] => {
    return item.pagos || [];
  };

  const getTotalPagado = (item: any): number => {
    const pagos = getItemPayments(item);
    return pagos.reduce((sum: number, pago: PaymentRecord) => sum + pago.monto, 0);
  };

  const getSaldoPendiente = (item: any): number => {
    return item.totalPrice - getTotalPagado(item);
  };

  const handleEditPayment = (index: number) => {
    const item = event.decoration![index];
    const saldoPendiente = getSaldoPendiente(item);
    setEditingIndex(index);
    setEditData({
      tipoPago: 'adelanto',
      montoPago: 0,
    });
  };

  const handleSavePayment = (index: number) => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    let eventIndex = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (eventIndex === -1) {
      storedEvents.push(JSON.parse(JSON.stringify(event)));
      eventIndex = storedEvents.length - 1;
    }
    
    if (eventIndex !== -1 && storedEvents[eventIndex].decoration) {
      const item = storedEvents[eventIndex].decoration[index];
      const saldoPendiente = getSaldoPendiente(item);
      
      // Validación
      if (editData.montoPago <= 0) {
        toast.error('El monto debe ser mayor a 0');
        return;
      }
      
      if (editData.tipoPago === 'pago_completo') {
        // Auto-rellenar con saldo pendiente
        editData.montoPago = saldoPendiente;
      }
      
      if (editData.montoPago > saldoPendiente) {
        toast.error(`El monto no puede ser mayor al saldo pendiente (S/ ${saldoPendiente.toFixed(2)})`);
        return;
      }
      
      // Crear registro de pago
      const newPayment: PaymentRecord = {
        id: Date.now(),
        monto: editData.montoPago,
        fecha: new Date().toLocaleString('es-ES'),
        registradoPor: `${user?.name} ${user?.last_name}`,
        tipo: editData.tipoPago,
      };
      
      // Inicializar array de pagos si no existe
      if (!item.pagos) {
        item.pagos = [];
      }
      
      // Agregar pago al historial
      item.pagos.push(newPayment);
      
      // Calcular total pagado
      const totalPagado = item.pagos.reduce((sum: number, p: PaymentRecord) => sum + p.monto, 0);
      
      // Actualizar estado según total pagado
      if (totalPagado >= item.totalPrice) {
        item.estado = 'completado';
      } else if (totalPagado > 0) {
        item.estado = 'en_proceso';
      } else {
        item.estado = 'pendiente';
      }
      
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      toast.success(`Pago registrado: S/ ${editData.montoPago.toFixed(2)}`);
      setEditingIndex(null);
      onUpdate?.();
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Pagado Completo</Badge>;
      case 'en_proceso':
        return <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/30">En Progreso</Badge>;
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
              {event.decoration.map((item, index) => {
                const totalPagado = getTotalPagado(item);
                const saldoPendiente = getSaldoPendiente(item);
                const pagos = getItemPayments(item);
                
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.item}</h4>
                          {getEstadoBadge(item.estado || 'pendiente')}
                        </div>
                        {item.supplier && (
                          <p className="text-sm text-muted-foreground">Proveedor: {item.supplier}</p>
                        )}
                      </div>
                      {canEdit && editingIndex !== index && item.estado !== 'completado' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayment(index)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Registrar Pago
                        </Button>
                      )}
                    </div>
                    
                    {editingIndex === index ? (
                      <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Tipo de Pago</Label>
                            <select
                              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                              value={editData.tipoPago}
                              onChange={(e) => {
                                const tipo = e.target.value as 'adelanto' | 'pago_completo';
                                setEditData({ 
                                  ...editData, 
                                  tipoPago: tipo,
                                  montoPago: tipo === 'pago_completo' ? saldoPendiente : 0
                                });
                              }}
                            >
                              <option value="adelanto">Adelanto</option>
                              <option value="pago_completo">Pago Completo</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Monto (S/)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editData.montoPago}
                              onChange={(e) => setEditData({ ...editData, montoPago: parseFloat(e.target.value) || 0 })}
                              className="h-9"
                              max={saldoPendiente}
                              disabled={editData.tipoPago === 'pago_completo'}
                            />
                          </div>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded text-sm">
                          <p className="text-xs text-muted-foreground">Saldo Pendiente:</p>
                          <p className="text-lg font-bold text-blue-600">S/ {saldoPendiente.toFixed(2)}</p>
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
                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
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
                        
                        {/* Payment Summary */}
                        <div className="pt-3 border-t">
                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div className="p-2 bg-green-500/10 rounded">
                              <p className="text-xs text-muted-foreground">Total Pagado</p>
                              <p className="text-lg font-bold text-green-600">S/ {totalPagado.toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-orange-500/10 rounded">
                              <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                              <p className="text-lg font-bold text-orange-600">S/ {saldoPendiente.toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-lg font-bold text-blue-600">S/ {item.totalPrice.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Payment History */}
                        {pagos.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <History className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-semibold">Historial de Pagos ({pagos.length})</p>
                            </div>
                            <div className="space-y-2">
                              {pagos.map((pago) => (
                                <div key={pago.id} className="p-2 bg-muted/50 rounded text-sm flex items-center justify-between">
                                  <div className="flex-1">
                                    <Badge variant="outline" className="text-xs mr-2">
                                      {pago.tipo === 'adelanto' ? 'Adelanto' : 'Pago Completo'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {pago.fecha} - {pago.registradoPor}
                                    </span>
                                  </div>
                                  <span className="font-bold text-green-600">S/ {pago.monto.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
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