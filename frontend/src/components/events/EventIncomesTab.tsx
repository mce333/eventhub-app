import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Event } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { DollarSign, Plus, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface EventIncomesTabProps {
  event: Event;
  onUpdate: () => void;
}

interface Income {
  id: number;
  tipo: 'adelanto' | 'pago_final' | 'kiosco' | 'horas_extras' | 'garantia';
  monto: number;
  descripcion: string;
  horasExtras?: number;
  precioPorHora?: number;
  metodoPago?: string;
  fecha: string;
  registradoPor: string;
  registradoRol: string;
}

interface GarantiaDevolucion {
  id: number;
  montoDevuelto: number;
  montoDescontado: number;
  motivoDescuento: string;
  fecha: string;
  registradoPor: string;
}

export function EventIncomesTab({ event, onUpdate }: EventIncomesTabProps) {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const [showAddAdelanto, setShowAddAdelanto] = useState(false);
  const [showAddKiosco, setShowAddKiosco] = useState(false);
  const [showAddHorasExtras, setShowAddHorasExtras] = useState(false);
  const [showGarantiaDevolucion, setShowGarantiaDevolucion] = useState(false);
  
  const [newAdelanto, setNewAdelanto] = useState({
    monto: 0,
    descripcion: '',
  });
  
  const [newKiosco, setNewKiosco] = useState({
    monto: 0,
    descripcion: '',
  });
  
  const [newHorasExtras, setNewHorasExtras] = useState({
    horasExtras: 0,
    precioPorHora: 0,
    descripcion: '',
    metodoPago: 'efectivo',
  });
  
  const [devolucionData, setDevolucionData] = useState({
    montoDescontado: 0,
    motivoDescuento: '',
  });

  const canEdit = userRole === 'admin' || userRole === 'servicio';
  const isCoordinador = userRole === 'coordinador';

  // Cargar ingresos del evento
  const ingresos: Income[] = (event as any).ingresos || [];
  const garantiaInfo = event.contract?.garantia || 0;
  const garantiaDevuelta = (event as any).garantiaDevuelta || null;
  
  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0) + 
    (event.financial?.advancePayment || 0) + 
    garantiaInfo;

  const handleAddAdelanto = () => {
    if (!newAdelanto.descripcion) {
      toast.error('La descripción es requerida');
      return;
    }
    if (newAdelanto.monto <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    
    const totalAdelantos = (event.financial?.advancePayment || 0) + ingresos.filter(i => i.tipo === 'adelanto').reduce((sum, i) => sum + i.monto, 0);
    const saldoPendiente = (event.contract?.precioTotal || 0) - totalAdelantos;
    
    if (newAdelanto.monto > saldoPendiente) {
      toast.error(`El adelanto no puede ser mayor al saldo pendiente (S/ ${saldoPendiente.toFixed(2)})`);
      return;
    }

    const income: Income = {
      id: Date.now(),
      tipo: 'adelanto',
      monto: newAdelanto.monto,
      descripcion: newAdelanto.descripcion,
      fecha: new Date().toLocaleString('es-ES'),
      registradoPor: `${user?.name} ${user?.last_name}`,
      registradoRol: user?.role?.displayName || 'Usuario',
    };

    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: any) => e.id === event.id);
    
    if (index !== -1) {
      storedEvents[index].ingresos = [...(storedEvents[index].ingresos || []), income];
      storedEvents[index].financial.totalIncome += income.monto;
      storedEvents[index].financial.balance += income.monto;
      storedEvents[index].contract.saldoPendiente -= income.monto;
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      
      toast.success('Adelanto registrado correctamente');
      setShowAddAdelanto(false);
      setNewAdelanto({ monto: 0, descripcion: '' });
      onUpdate();
    }
  };

  const handleAddKiosco = () => {
    if (!newKiosco.descripcion) {
      toast.error('La descripción es requerida');
      return;
    }
    if (newKiosco.monto <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    const income: Income = {
      id: Date.now(),
      tipo: 'kiosco',
      monto: newKiosco.monto,
      descripcion: newKiosco.descripcion,
      fecha: new Date().toLocaleString('es-ES'),
      registradoPor: `${user?.name} ${user?.last_name}`,
      registradoRol: user?.role?.displayName || 'Usuario',
    };

    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: any) => e.id === event.id);
    
    if (index !== -1) {
      storedEvents[index].ingresos = [...(storedEvents[index].ingresos || []), income];
      storedEvents[index].financial.totalIncome += income.monto;
      storedEvents[index].financial.balance += income.monto;
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      
      toast.success('Ingreso de kiosco registrado');
      setShowAddKiosco(false);
      setNewKiosco({ monto: 0, descripcion: '' });
      onUpdate();
    }
  };

  const handleAddHorasExtras = () => {
    if (newHorasExtras.horasExtras <= 0 || newHorasExtras.precioPorHora <= 0) {
      toast.error('Completa horas y precio por hora');
      return;
    }

    const income: Income = {
      id: Date.now(),
      tipo: 'horas_extras',
      monto: newHorasExtras.horasExtras * newHorasExtras.precioPorHora,
      descripcion: `${newHorasExtras.horasExtras} horas extras a S/ ${newHorasExtras.precioPorHora}/h`,
      horasExtras: newHorasExtras.horasExtras,
      precioPorHora: newHorasExtras.precioPorHora,
      metodoPago: newHorasExtras.metodoPago,
      fecha: new Date().toLocaleString('es-ES'),
      registradoPor: `${user?.name} ${user?.last_name}`,
      registradoRol: user?.role?.displayName || 'Usuario',
    };

    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: any) => e.id === event.id);
    
    if (index !== -1) {
      storedEvents[index].ingresos = [...(storedEvents[index].ingresos || []), income];
      storedEvents[index].financial.totalIncome += income.monto;
      storedEvents[index].financial.balance += income.monto;
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      
      toast.success('Horas extras registradas');
      setShowAddHorasExtras(false);
      setNewHorasExtras({ horasExtras: 0, precioPorHora: 0, descripcion: '', metodoPago: 'efectivo' });
      onUpdate();
    }
  };

  const handleDevolucionGarantia = () => {
    if (!garantiaInfo) {
      toast.error('No hay garantía registrada');
      return;
    }

    const montoDevuelto = garantiaInfo - devolucionData.montoDescontado;

    const devolucion: GarantiaDevolucion = {
      id: Date.now(),
      montoDevuelto,
      montoDescontado: devolucionData.montoDescontado,
      motivoDescuento: devolucionData.motivoDescuento,
      fecha: new Date().toLocaleString('es-ES'),
      registradoPor: `${user?.name} ${user?.last_name}`,
    };

    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (index !== -1) {
      storedEvents[index].garantiaDevuelta = devolucion;
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      
      toast.success('Devolución de garantía registrada');
      setShowGarantiaDevolucion(false);
      setDevolucionData({ montoDescontado: 0, motivoDescuento: '' });
      onUpdate();
    }
  };

  // Si es Coordinador
  if (isCoordinador) {
    return (
      <div className="space-y-6">
        {/* Ingresos Kiosco */}
        <Card className="border-2 border-cyan-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ingresos Kiosco</CardTitle>
              <Button
                onClick={() => setShowAddKiosco(!showAddKiosco)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddKiosco ? 'Cancelar' : 'Agregar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddKiosco && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label>Descripción *</Label>
                  <Textarea
                    placeholder="Ej: Venta de 20 cervezas"
                    value={newKiosco.descripcion}
                    onChange={(e) => setNewKiosco({ ...newKiosco, descripcion: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Monto (S/) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newKiosco.monto || ''}
                    onChange={(e) => setNewKiosco({ ...newKiosco, monto: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={handleAddKiosco} className="w-full bg-gradient-primary">
                  Registrar Ingreso
                </Button>
              </div>
            )}

            {/* Lista de Kiosco */}
            {ingresos.filter(i => i.tipo === 'kiosco').length > 0 ? (
              <div className="space-y-3">
                {ingresos.filter(i => i.tipo === 'kiosco').map((income) => (
                  <div key={income.id} className="p-4 border rounded-lg bg-green-500/5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{income.descripcion}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">S/ {income.monto.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <p>Registrado por: {income.registradoPor} ({income.registradoRol})</p>
                      <p>{income.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No hay ingresos de kiosco registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Horas Extras */}
        <Card className="border-2 border-purple-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Horas Extras</CardTitle>
              <Button
                onClick={() => setShowAddHorasExtras(!showAddHorasExtras)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddHorasExtras ? 'Cancelar' : 'Agregar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddHorasExtras && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número de Horas *</Label>
                    <Input
                      type="number"
                      value={newHorasExtras.horasExtras || ''}
                      onChange={(e) => setNewHorasExtras({ ...newHorasExtras, horasExtras: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Precio por Hora (S/) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newHorasExtras.precioPorHora || ''}
                      onChange={(e) => setNewHorasExtras({ ...newHorasExtras, precioPorHora: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Método de Pago *</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newHorasExtras.metodoPago}
                    onChange={(e) => setNewHorasExtras({ ...newHorasExtras, metodoPago: e.target.value })}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="yape">Yape/Plin</option>
                  </select>
                </div>
                {newHorasExtras.horasExtras > 0 && newHorasExtras.precioPorHora > 0 && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium">Total a Registrar:</p>
                    <p className="text-2xl font-bold text-primary">
                      S/ {(newHorasExtras.horasExtras * newHorasExtras.precioPorHora).toFixed(2)}
                    </p>
                  </div>
                )}
                <Button onClick={handleAddHorasExtras} className="w-full bg-gradient-primary">
                  Registrar Horas Extras
                </Button>
              </div>
            )}

            {/* Lista de Horas Extras */}
            {ingresos.filter(i => i.tipo === 'horas_extras').length > 0 ? (
              <div className="space-y-3">
                {ingresos.filter(i => i.tipo === 'horas_extras').map((income) => (
                  <div key={income.id} className="p-4 border rounded-lg bg-green-500/5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{income.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {income.horasExtras}h × S/ {income.precioPorHora} ({income.metodoPago})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">S/ {income.monto.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <p>Registrado por: {income.registradoPor} ({income.registradoRol})</p>
                      <p>{income.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No hay horas extras registradas</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista completa para Admin
  return (
    <div className="space-y-6">
      {/* Resumen de Ingresos */}
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Total de Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">S/ {totalIngresos.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {ingresos.length + (garantiaInfo > 0 ? 2 : 1)} registros de ingresos
          </p>
        </CardContent>
      </Card>

      {/* Adelantos */}
      <Card className="border-2 border-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Adelantos</CardTitle>
            {canEdit && (
              <Button
                onClick={() => setShowAddAdelanto(!showAddAdelanto)}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddAdelanto ? 'Cancelar' : 'Agregar Adelanto'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form to Add Adelanto */}
          {showAddAdelanto && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Ej: Segundo adelanto del cliente"
                  value={newAdelanto.descripcion}
                  onChange={(e) => setNewAdelanto({ ...newAdelanto, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>Monto (S/) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newAdelanto.monto || ''}
                  onChange={(e) => setNewAdelanto({ ...newAdelanto, monto: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo pendiente: S/ {((event.contract?.precioTotal || 0) - (event.financial?.advancePayment || 0) - ingresos.filter(i => i.tipo === 'adelanto').reduce((sum, i) => sum + i.monto, 0)).toFixed(2)}
                </p>
              </div>
              <Button onClick={handleAddAdelanto} className="w-full bg-gradient-primary">
                Registrar Adelanto
              </Button>
            </div>
          )}
          
          {/* Adelanto Inicial */}
          <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
            <div>
              <p className="font-medium">Adelanto Inicial</p>
              <p className="text-xs text-muted-foreground">Registrado al crear el evento</p>
            </div>
            <p className="text-xl font-bold text-green-600">S/ {(event.financial?.advancePayment || 0).toLocaleString()}</p>
          </div>

          {/* Additional Advances */}
          {ingresos.filter(i => i.tipo === 'adelanto').map((adelanto) => (
            <div key={adelanto.id} className="flex items-center justify-between p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <div>
                <p className="font-medium">Adelanto Adicional</p>
                <p className="text-xs text-muted-foreground">{adelanto.descripcion}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por: {adelanto.registradoPor} - {adelanto.fecha}
                </p>
              </div>
              <p className="text-lg font-bold text-green-600">S/ {adelanto.monto.toLocaleString()}</p>
            </div>
          ))}

          {/* Total Advances Summary */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Adelantos:</p>
              <p className="text-xl font-bold text-green-600">
                S/ {((event.financial?.advancePayment || 0) + ingresos.filter(i => i.tipo === 'adelanto').reduce((sum, i) => sum + i.monto, 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancelación Total */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="text-base text-blue-600">Cancelación Total del Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-blue-500/10 rounded">
              <p className="text-xs text-muted-foreground">Monto Total</p>
              <p className="text-lg font-bold text-blue-600">S/ {(event.contract?.precioTotal || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded">
              <p className="text-xs text-muted-foreground">Total Adelantos</p>
              <p className="text-lg font-bold text-green-600">
                S/ {((event.financial?.advancePayment || 0) + ingresos.filter(i => i.tipo === 'adelanto').reduce((sum, i) => sum + i.monto, 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded">
              <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
              <p className="text-lg font-bold text-orange-600">
                S/ {((event.contract?.precioTotal || 0) - (event.financial?.advancePayment || 0) - ingresos.filter(i => i.tipo === 'adelanto').reduce((sum, i) => sum + i.monto, 0)).toLocaleString()}
              </p>
            </div>
          </div>

          {canEdit && !ingresos.find(i => i.tipo === 'pago_final') && (
            <Button
              onClick={() => {
                const saldoPendiente = (event.contract?.precioTotal || 0) - (event.financial?.advancePayment || 0) - ingresos.filter(i => i.tipo === 'adelanto').reduce((sum, i) => sum + i.monto, 0);
                
                if (saldoPendiente <= 0) {
                  toast.error('El contrato ya está completamente pagado');
                  return;
                }

                const income = {
                  id: Date.now(),
                  tipo: 'pago_final' as const,
                  monto: saldoPendiente,
                  descripcion: 'Cancelación total del contrato',
                  fecha: new Date().toLocaleString('es-ES'),
                  registradoPor: `${user?.name} ${user?.last_name}`,
                  registradoRol: user?.role?.displayName || 'Usuario',
                };

                const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
                const index = storedEvents.findIndex((e: any) => e.id === event.id);
                
                if (index !== -1) {
                  storedEvents[index].ingresos = [...(storedEvents[index].ingresos || []), income];
                  storedEvents[index].financial.totalIncome += income.monto;
                  storedEvents[index].financial.balance += income.monto;
                  storedEvents[index].contract.saldoPendiente = 0;
                  localStorage.setItem('demo_events', JSON.stringify(storedEvents));
                  
                  toast.success(`Cancelación total registrada: S/ ${saldoPendiente.toFixed(2)}`);
                  onUpdate();
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Registrar Cancelación Total (S/ {((event.contract?.precioTotal || 0) - (event.financial?.advancePayment || 0) - ingresos.filter(i => i.tipo === 'adelanto').reduce((sum, i) => sum + i.monto, 0)).toFixed(2)})
            </Button>
          )}

          {ingresos.find(i => i.tipo === 'pago_final') && (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="font-semibold text-green-600 mb-2">✓ Contrato Pagado Completamente</p>
              {(() => {
                const pagoFinal = ingresos.find(i => i.tipo === 'pago_final');
                return pagoFinal ? (
                  <p className="text-sm text-muted-foreground">
                    Cancelación total de S/ {pagoFinal.monto.toLocaleString()} registrada por {pagoFinal.registradoPor} el {pagoFinal.fecha}
                  </p>
                ) : null;
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Garantía */}
      {garantiaInfo > 0 && (
        <Card className="border-2 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
              <Shield className="h-5 w-5" />
              Garantía
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg">
              <div>
                <p className="font-medium">Monto de Garantía</p>
                <p className="text-xs text-muted-foreground">Depositado por el cliente</p>
              </div>
              <p className="text-xl font-bold text-yellow-600">S/ {garantiaInfo.toLocaleString()}</p>
            </div>

            {!garantiaDevuelta && event.status === 'completed' && (
              <div>
                {!showGarantiaDevolucion ? (
                  <Button 
                    onClick={() => setShowGarantiaDevolucion(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Registrar Devolución de Garantía
                  </Button>
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <Label>Monto Descontado (S/)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={devolucionData.montoDescontado || ''}
                          onChange={(e) => setDevolucionData({ ...devolucionData, montoDescontado: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Motivo del Descuento</Label>
                        <Textarea
                          placeholder="Ej: Daños en sillas, limpieza adicional"
                          value={devolucionData.motivoDescuento}
                          onChange={(e) => setDevolucionData({ ...devolucionData, motivoDescuento: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium">Monto a Devolver:</p>
                        <p className="text-2xl font-bold text-green-600">
                          S/ {(garantiaInfo - devolucionData.montoDescontado).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleDevolucionGarantia} className="flex-1">
                          Confirmar Devolución
                        </Button>
                        <Button variant="outline" onClick={() => setShowGarantiaDevolucion(false)} className="flex-1">
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {garantiaDevuelta && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <AlertDescription className="space-y-2">
                  <p className="font-semibold text-green-600">✓ Garantía Devuelta</p>
                  <div className="text-sm space-y-1">
                    <p>Monto devuelto: S/ {garantiaDevuelta.montoDevuelto.toFixed(2)}</p>
                    <p>Monto descontado: S/ {garantiaDevuelta.montoDescontado.toFixed(2)}</p>
                    {garantiaDevuelta.motivoDescuento && (
                      <p>Motivo: {garantiaDevuelta.motivoDescuento}</p>
                    )}
                    <p className="text-xs text-muted-foreground pt-2">
                      Por: {garantiaDevuelta.registradoPor} - {garantiaDevuelta.fecha}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Horas Extras */}
      <Card className="border-2 border-purple-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Horas Extras</CardTitle>
            <Button
              onClick={() => setShowAddHorasExtras(!showAddHorasExtras)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddHorasExtras ? 'Cancelar' : 'Agregar'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {showAddHorasExtras && (
            <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Ej: Horas extras de DJ"
                  value={newHorasExtras.descripcion}
                  onChange={(e) => setNewHorasExtras({ ...newHorasExtras, descripcion: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número de Horas *</Label>
                  <Input
                    type="number"
                    value={newHorasExtras.horasExtras || ''}
                    onChange={(e) => setNewHorasExtras({ ...newHorasExtras, horasExtras: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Precio por Hora (S/) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newHorasExtras.precioPorHora || ''}
                    onChange={(e) => setNewHorasExtras({ ...newHorasExtras, precioPorHora: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Método de Pago *</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={newHorasExtras.metodoPago}
                  onChange={(e) => setNewHorasExtras({ ...newHorasExtras, metodoPago: e.target.value })}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="yape">Yape/Plin</option>
                </select>
              </div>

              {newHorasExtras.horasExtras > 0 && newHorasExtras.precioPorHora > 0 && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">Total a Registrar:</p>
                  <p className="text-2xl font-bold text-primary">
                    S/ {(newHorasExtras.horasExtras * newHorasExtras.precioPorHora).toFixed(2)}
                  </p>
                </div>
              )}

              <Button onClick={handleAddHorasExtras} className="w-full bg-gradient-primary">
                Registrar Horas Extras
              </Button>
            </div>
          )}

          {/* Lista de Horas Extras */}
          {ingresos.filter(i => i.tipo === 'horas_extras').length > 0 ? (
            <div className="space-y-3">
              {ingresos.filter(i => i.tipo === 'horas_extras').map((income) => (
                <div key={income.id} className="p-4 border rounded-lg bg-green-500/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{income.descripcion}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {income.horasExtras}h × S/ {income.precioPorHora} ({income.metodoPago})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">S/ {income.monto.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>Registrado por: {income.registradoPor} ({income.registradoRol})</p>
                    <p>{income.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">No hay horas extras registradas</p>
          )}
        </CardContent>
      </Card>

      {/* Ingresos Kiosco */}
      <Card className="border-2 border-cyan-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ingresos Kiosco</CardTitle>
            <Button
              onClick={() => setShowAddKiosco(!showAddKiosco)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddKiosco ? 'Cancelar' : 'Agregar'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {showAddKiosco && (
            <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Ej: Venta de 20 cervezas"
                  value={newKiosco.descripcion}
                  onChange={(e) => setNewKiosco({ ...newKiosco, descripcion: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Monto (S/) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newKiosco.monto || ''}
                  onChange={(e) => setNewKiosco({ ...newKiosco, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <Button onClick={handleAddKiosco} className="w-full bg-gradient-primary">
                Registrar Ingreso
              </Button>
            </div>
          )}

          {/* Lista de Ingresos Kiosco */}
          {ingresos.filter(i => i.tipo === 'kiosco').length > 0 ? (
            <div className="space-y-3">
              {ingresos.filter(i => i.tipo === 'kiosco').map((income) => (
                <div key={income.id} className="p-4 border rounded-lg bg-green-500/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{income.descripcion}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">S/ {income.monto.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>Registrado por: {income.registradoPor} ({income.registradoRol})</p>
                    <p>{income.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">No hay ingresos de kiosco registrados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
