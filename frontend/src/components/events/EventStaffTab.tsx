import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { Users, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createAuditLog } from '@/lib/auditLogger';

interface EventStaffTabProps {
  event: Event;
  onUpdate?: () => void;
}

interface ExtraHours {
  id: number;
  staffName: string;
  hours: number;
  rate: number;
  total: number;
  description: string;
  fecha: string;
  registradoPor: string;
}

export function EventStaffTab({ event, onUpdate }: EventStaffTabProps) {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const [showExtraHoursForm, setShowExtraHoursForm] = useState(false);
  const [selectedStaffIndex, setSelectedStaffIndex] = useState<number | null>(null);
  const [extraHoursData, setExtraHoursData] = useState({
    hours: 0,
    rate: 0,
    description: '',
  });

  const canEdit = userRole === 'admin';
  const extraHoursList: ExtraHours[] = (event as any).extraHours || [];
  
  const totalCost = event.staff?.reduce((sum, person) => sum + person.totalCost, 0) || 0;
  const totalExtraHours = extraHoursList.reduce((sum, extra) => sum + extra.total, 0);
  const totalHours = event.staff?.reduce((sum, person) => sum + person.hours, 0) || 0;
  const totalExtraHoursCount = extraHoursList.reduce((sum, extra) => sum + extra.hours, 0);

  const handleAddExtraHours = () => {
    if (selectedStaffIndex === null) {
      toast.error('Selecciona un miembro del personal');
      return;
    }

    if (extraHoursData.hours <= 0 || extraHoursData.rate <= 0) {
      toast.error('Las horas y tarifa deben ser mayores a 0');
      return;
    }

    if (!extraHoursData.description) {
      toast.error('La descripción es requerida');
      return;
    }

    const staff = event.staff![selectedStaffIndex];
    const extraHour: ExtraHours = {
      id: Date.now(),
      staffName: staff.name,
      hours: extraHoursData.hours,
      rate: extraHoursData.rate,
      total: extraHoursData.hours * extraHoursData.rate,
      description: extraHoursData.description,
      fecha: new Date().toLocaleString('es-ES'),
      registradoPor: `${user?.name} ${user?.last_name}`,
    };

    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (index !== -1) {
      if (!storedEvents[index].extraHours) {
        storedEvents[index].extraHours = [];
      }
      storedEvents[index].extraHours.push(extraHour);
      
      // Update financial data
      storedEvents[index].financial.totalExpenses += extraHour.total;
      storedEvents[index].financial.balance -= extraHour.total;
      
      // Create audit log
      const auditLog = createAuditLog(
        user!,
        'extra_hours_added',
        `Horas extras agregadas: ${staff.name} - ${extraHoursData.hours}h × S/${extraHoursData.rate}`,
        { staffName: staff.name, hours: extraHoursData.hours, rate: extraHoursData.rate, total: extraHour.total }
      );
      if (!storedEvents[index].auditLogs) {
        storedEvents[index].auditLogs = [];
      }
      storedEvents[index].auditLogs.push(auditLog);
      
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      
      toast.success('Horas extras registradas');
      setShowExtraHoursForm(false);
      setSelectedStaffIndex(null);
      setExtraHoursData({ hours: 0, rate: 0, description: '' });
      onUpdate?.();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{event.staff?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHours}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas Extras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{totalExtraHoursCount}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">S/ {(totalCost + totalExtraHours).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              Base: S/ {totalCost.toLocaleString()} | Extras: S/ {totalExtraHours.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personal Asignado
            </CardTitle>
            {canEdit && event.staff && event.staff.length > 0 && (
              <Button
                onClick={() => setShowExtraHoursForm(!showExtraHoursForm)}
                size="sm"
                variant="outline"
              >
                <Clock className="h-4 w-4 mr-2" />
                {showExtraHoursForm ? 'Cancelar' : 'Agregar Horas Extras'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showExtraHoursForm && (
            <Card className="mb-6 bg-muted/30">
              <CardContent className="pt-6 space-y-4">
                <h4 className="font-semibold text-lg">Registrar Horas Extras</h4>
                
                <div>
                  <Label>Seleccionar Personal *</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={selectedStaffIndex ?? ''}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      setSelectedStaffIndex(idx);
                      // Auto-fill rate with the staff's hourly rate
                      if (!isNaN(idx) && event.staff?.[idx]) {
                        setExtraHoursData({ ...extraHoursData, rate: event.staff[idx].hourlyRate });
                      }
                    }}
                  >
                    <option value="">Selecciona un miembro del personal</option>
                    {event.staff?.map((person, index) => (
                      <option key={index} value={index}>
                        {person.name} - {person.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horas Extras *</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={extraHoursData.hours || ''}
                      onChange={(e) => setExtraHoursData({ ...extraHoursData, hours: parseFloat(e.target.value) || 0 })}
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <Label>Tarifa por Hora (S/) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={extraHoursData.rate || ''}
                      onChange={(e) => setExtraHoursData({ ...extraHoursData, rate: parseFloat(e.target.value) || 0 })}
                      placeholder="25.00"
                    />
                  </div>
                </div>

                <div>
                  <Label>Descripción *</Label>
                  <Textarea
                    value={extraHoursData.description}
                    onChange={(e) => setExtraHoursData({ ...extraHoursData, description: e.target.value })}
                    placeholder="Ej: Horas extras por extender el evento hasta las 2 AM"
                    rows={2}
                  />
                </div>

                {extraHoursData.hours > 0 && extraHoursData.rate > 0 && (
                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <p className="text-sm font-medium">Total a Registrar:</p>
                    <p className="text-2xl font-bold text-orange-600">
                      S/ {(extraHoursData.hours * extraHoursData.rate).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {extraHoursData.hours} horas × S/ {extraHoursData.rate}
                    </p>
                  </div>
                )}

                <Button onClick={handleAddExtraHours} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Horas Extras
                </Button>
              </CardContent>
            </Card>
          )}

          {event.staff && event.staff.length > 0 ? (
            <div className="space-y-3">
              {event.staff.map((person, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{person.name}</h4>
                      <p className="text-sm text-muted-foreground">{person.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">S/ {person.totalCost.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Costo base</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Horas Base</p>
                      <p className="font-medium">{person.hours}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tarifa/Hora</p>
                      <p className="font-medium">S/ {person.hourlyRate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contacto</p>
                      <p className="font-medium">{person.contact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No hay personal asignado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extra Hours History */}
      {extraHoursList.length > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              Historial de Horas Extras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extraHoursList.map((extra) => (
                <div key={extra.id} className="p-4 border rounded-lg bg-orange-500/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                          {extra.staffName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {extra.hours}h × S/ {extra.rate}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{extra.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">S/ {extra.total.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>Registrado por: {extra.registradoPor}</p>
                    <p>{extra.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}