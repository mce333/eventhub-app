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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGarantiaDevolucion, setShowGarantiaDevolucion] = useState(false);
  const [newIncome, setNewIncome] = useState({
    tipo: 'kiosco' as 'kiosco' | 'horas_extras',
    monto: 0,
    descripcion: '',
    horasExtras: 0,
    precioPorHora: 0,
    metodoPago: 'efectivo',
  });
  const [devolucionData, setDevolucionData] = useState({
    montoDescontado: 0,
    motivoDescuento: '',
  });

  const canEdit = userRole === 'admin' || userRole === 'servicio';
  const isCoordinador = userRole === 'servicio';

  // Cargar ingresos del evento
  const ingresos: Income[] = (event as any).ingresos || [];
  const garantiaInfo = event.contract?.garantia || 0;
  const garantiaDevuelta = (event as any).garantiaDevuelta || null;
  
  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0) + 
    (event.financial?.advancePayment || 0) + 
    garantiaInfo;

  const handleAddIncome = () => {
    if (!newIncome.descripcion) {
      toast.error('La descripción es requerida');
      return;
    }

    let montoFinal = 0;
    
    if (newIncome.tipo === 'horas_extras') {
      if (newIncome.horasExtras <= 0 || newIncome.precioPorHora <= 0) {
        toast.error('Completa horas y precio por hora');
        return;
      }
      montoFinal = newIncome.horasExtras * newIncome.precioPorHora;
    } else {
      if (newIncome.monto <= 0) {
        toast.error('El monto es requerido');
        return;
      }
      montoFinal = newIncome.monto;
    }

    const income: Income = {
      id: Date.now(),
      tipo: newIncome.tipo,
      monto: montoFinal,
      descripcion: newIncome.descripcion,
      horasExtras: newIncome.tipo === 'horas_extras' ? newIncome.horasExtras : undefined,
      precioPorHora: newIncome.tipo === 'horas_extras' ? newIncome.precioPorHora : undefined,
      metodoPago: newIncome.tipo === 'horas_extras' ? newIncome.metodoPago : undefined,
      fecha: new Date().toLocaleString('es-ES'),
      registradoPor: `${user?.name} ${user?.last_name}`,
      registradoRol: user?.role?.displayName || 'Usuario',
    };

    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (index !== -1) {
      storedEvents[index].ingresos = [...(storedEvents[index].ingresos || []), income];
      storedEvents[index].financial.totalIncome += income.monto;
      storedEvents[index].financial.balance += income.monto;
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      
      toast.success('Ingreso registrado');
      setShowAddForm(false);
      setNewIncome({ tipo: 'kiosco', monto: 0, descripcion: '', horasExtras: 0, precioPorHora: 0, metodoPago: 'efectivo' });
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

  // Si es Coordinador, solo mostrar formulario de llenado
  if (isCoordinador) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Ingreso Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Ingreso *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={newIncome.tipo}
                onChange={(e) => setNewIncome({ ...newIncome, tipo: e.target.value as any })}
              >
                <option value="kiosco">Kiosco</option>
                <option value="horas_extras">Horas Extras</option>
              </select>
            </div>

            <div>
              <Label>Descripción *</Label>
              <Textarea
                placeholder="Ej: Venta de 20 cervezas"
                value={newIncome.descripcion}
                onChange={(e) => setNewIncome({ ...newIncome, descripcion: e.target.value })}
                rows={2}
              />
            </div>

            {newIncome.tipo === 'kiosco' ? (
              <div>
                <Label>Monto (S/) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newIncome.monto || ''}
                  onChange={(e) => setNewIncome({ ...newIncome, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número de Horas *</Label>
                    <Input
                      type="number"
                      value={newIncome.horasExtras || ''}
                      onChange={(e) => setNewIncome({ ...newIncome, horasExtras: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Precio por Hora (S/) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newIncome.precioPorHora || ''}
                      onChange={(e) => setNewIncome({ ...newIncome, precioPorHora: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Método de Pago *</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newIncome.metodoPago}
                    onChange={(e) => setNewIncome({ ...newIncome, metodoPago: e.target.value })}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="yape">Yape/Plin</option>
                  </select>
                </div>

                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">Total a Registrar:</p>
                  <p className="text-2xl font-bold text-primary">
                    S/ {(newIncome.horasExtras * newIncome.precioPorHora).toFixed(2)}
                  </p>
                </div>
              </>
            )}

            <Button onClick={handleAddIncome} className="w-full bg-gradient-primary">
              Registrar Ingreso
            </Button>
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
            {ingresos.length + 1} registros de ingresos
          </p>
        </CardContent>
      </Card>

      {/* Adelanto Inicial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pago Adelantado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
            <div>
              <p className="font-medium">Adelanto Inicial</p>
              <p className="text-xs text-muted-foreground">Registrado al crear el evento</p>
            </div>
            <p className="text-xl font-bold text-green-600">S/ {(event.financial?.advancePayment || 0).toLocaleString()}</p>
          </div>
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

            {!garantiaDevuelta && canEdit && event.status === 'completed' && (
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

      {/* Ingresos Adicionales (Kiosco, Horas Extras) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ingresos Adicionales</CardTitle>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddForm ? 'Cancelar' : 'Agregar'}
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent className="space-y-4 border-t pt-4">
            <div>
              <Label>Descripción *</Label>
              <Textarea
                placeholder="Ej: Venta de 20 cervezas"
                value={newIncome.descripcion}
                onChange={(e) => setNewIncome({ ...newIncome, descripcion: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label>Tipo de Ingreso *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={newIncome.tipo}
                onChange={(e) => setNewIncome({ ...newIncome, tipo: e.target.value as any })}
              >
                <option value="kiosco">Kiosco</option>
                <option value="horas_extras">Horas Extras</option>
              </select>
            </div>

            {newIncome.tipo === 'kiosco' ? (
              <div>
                <Label>Monto (S/) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newIncome.monto || ''}
                  onChange={(e) => setNewIncome({ ...newIncome, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número de Horas *</Label>
                    <Input
                      type="number"
                      value={newIncome.horasExtras || ''}
                      onChange={(e) => setNewIncome({ ...newIncome, horasExtras: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Precio por Hora (S/) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newIncome.precioPorHora || ''}
                      onChange={(e) => setNewIncome({ ...newIncome, precioPorHora: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Método de Pago *</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newIncome.metodoPago}
                    onChange={(e) => setNewIncome({ ...newIncome, metodoPago: e.target.value })}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="yape">Yape/Plin</option>
                  </select>
                </div>

                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">Total a Registrar:</p>
                  <p className="text-2xl font-bold text-primary">
                    S/ {(newIncome.horasExtras * newIncome.precioPorHora).toFixed(2)}
                  </p>
                </div>
              </>
            )}

            <Button onClick={handleAddIncome} className="w-full bg-gradient-primary">
              Registrar Ingreso
            </Button>
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

      {/* Adelanto Inicial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pago Adelantado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
            <div>
              <p className="font-medium">Adelanto Inicial</p>
              <p className="text-xs text-muted-foreground">Registrado al crear el evento</p>
            </div>
            <p className="text-xl font-bold text-green-600">S/ {(event.financial?.advancePayment || 0).toLocaleString()}</p>
          </div>
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

      {/* Ingresos Adicionales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ingresos Adicionales (Kiosco & Horas Extras)</CardTitle>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddForm ? 'Cancelar' : 'Agregar'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {showAddForm && (
            <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Ej: Venta de 20 cervezas"
                  value={newIncome.descripcion}
                  onChange={(e) => setNewIncome({ ...newIncome, descripcion: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Tipo de Ingreso *</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={newIncome.tipo}
                  onChange={(e) => setNewIncome({ ...newIncome, tipo: e.target.value as any })}
                >
                  <option value="kiosco">Kiosco</option>
                  <option value="horas_extras">Horas Extras</option>
                </select>
              </div>

              {newIncome.tipo === 'kiosco' ? (
                <div>
                  <Label>Monto (S/) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newIncome.monto || ''}
                    onChange={(e) => setNewIncome({ ...newIncome, monto: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Número de Horas *</Label>
                      <Input
                        type="number"
                        value={newIncome.horasExtras || ''}
                        onChange={(e) => setNewIncome({ ...newIncome, horasExtras: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Precio por Hora (S/) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newIncome.precioPorHora || ''}
                        onChange={(e) => setNewIncome({ ...newIncome, precioPorHora: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Método de Pago *</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={newIncome.metodoPago}
                      onChange={(e) => setNewIncome({ ...newIncome, metodoPago: e.target.value })}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="yape">Yape/Plin</option>
                    </select>
                  </div>

                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium">Total a Registrar:</p>
                    <p className="text-2xl font-bold text-primary">
                      S/ {(newIncome.horasExtras * newIncome.precioPorHora).toFixed(2)}
                    </p>
                  </div>
                </>
              )}

              <Button onClick={handleAddIncome} className="w-full bg-gradient-primary">
                Registrar Ingreso
              </Button>
            </div>
          )}

          {/* Lista de Ingresos */}
          {ingresos.length > 0 ? (
            <div className="space-y-3">
              {ingresos.map((income) => (
                <div key={income.id} className="p-4 border rounded-lg bg-green-500/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2 capitalize">
                        {income.tipo === 'kiosco' ? 'Kiosco' : 'Horas Extras'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{income.descripcion}</p>
                      {income.tipo === 'horas_extras' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {income.horasExtras} horas × S/ {income.precioPorHora} ({income.metodoPago})
                        </p>
                      )}
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
            !showAddForm && (
              <div className="py-8 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay ingresos adicionales registrados</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
