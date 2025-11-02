import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Event, EventStaff } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { Users, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createAuditLog } from '@/lib/auditLogger';
import { STAFF_ROLES, getDefaultRate } from '@/lib/staffRoles';

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
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [showExtraHoursForm, setShowExtraHoursForm] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    roleId: '',
    contact: '',
    hours: 0,
    hourlyRate: 0,
  });
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

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.roleId || !newStaff.contact) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (newStaff.hours <= 0 || newStaff.hourlyRate <= 0) {
      toast.error('Las horas y tarifa deben ser mayores a 0');
      return;
    }

    const selectedRole = STAFF_ROLES.find(r => r.id === newStaff.roleId);
    
    const staffMember: EventStaff = {
      name: newStaff.name,
      role: selectedRole?.name || newStaff.roleId,
      roleId: newStaff.roleId,
      contact: newStaff.contact,
      hours: newStaff.hours,
      hourlyRate: newStaff.hourlyRate,
      totalCost: newStaff.hours * newStaff.hourlyRate,
      hasSystemAccess: false,
    };

    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    let index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (index === -1) {
      storedEvents.push({ ...event });
      index = storedEvents.length - 1;
    }
    
    if (index !== -1) {
      if (!storedEvents[index].staff) {
        storedEvents[index].staff = [];
      }
      storedEvents[index].staff.push(staffMember);
      
      storedEvents[index].financial.totalExpenses += staffMember.totalCost;
      storedEvents[index].financial.balance -= staffMember.totalCost;
      
      const auditLog = createAuditLog(
        user!,
        'staff_added',
        `Personal agregado: ${newStaff.name} - ${selectedRole?.name}`,
        { staffName: newStaff.name, role: selectedRole?.name, totalCost: staffMember.totalCost }
      );
      if (!storedEvents[index].auditLogs) {
        storedEvents[index].auditLogs = [];
      }
      storedEvents[index].auditLogs.push(auditLog);
      
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      
      toast.success('Personal agregado exitosamente');
      setShowAddStaffForm(false);
      setNewStaff({ name: '', roleId: '', contact: '', hours: 0, hourlyRate: 0 });
      onUpdate?.();
    }
  };

  const handleAddExtraHours = (staffName: string) => {
    if (extraHoursData.hours <= 0 || extraHoursData.rate <= 0) {
      toast.error('Las horas y tarifa deben ser mayores a 0');
      return;
    }

    if (!extraHoursData.description) {
      toast.error('La descripción es requerida');
      return;
    }

    const extraHour: ExtraHours = {
      id: Date.now(),
      staffName: staffName,
      hours: extraHoursData.hours,
      rate: extraHoursData.rate,
      total: extraHoursData.hours * extraHoursData.rate,
      description: extraHoursData.description,
      fecha: new Date().toLocaleString('es-ES'),
      registradoPor: `${user?.name} ${user?.last_name}`,
    };

    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    let index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (index === -1) {
      storedEvents.push({ ...event });
      index = storedEvents.length - 1;
    }
    
    if (index !== -1) {
      if (!storedEvents[index].extraHours) {
        storedEvents[index].extraHours = [];
      }
      storedEvents[index].extraHours.push(extraHour);
      
      storedEvents[index].financial.totalExpenses += extraHour.total;
      storedEvents[index].financial.balance -= extraHour.total;
      
      const auditLog = createAuditLog(
        user!,
        'extra_hours_added',
        `Horas extras agregadas: ${staffName} - ${extraHoursData.hours}h × S/${extraHoursData.rate}`,
        { staffName, hours: extraHoursData.hours, rate: extraHoursData.rate, total: extraHour.total }
      );
      if (!storedEvents[index].auditLogs) {
        storedEvents[index].auditLogs = [];
      }
      storedEvents[index].auditLogs.push(auditLog);
      
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
      
      toast.success('Horas extras registradas');
      setShowExtraHoursForm(null);
      setExtraHoursData({ hours: 0, rate: 0, description: '' });
      onUpdate?.();
    }
  };

  const getStaffExtraHours = (staffName: string) => {
    return extraHoursList.filter(extra => extra.staffName === staffName);
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
            {canEdit && (
              <Button
                onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddStaffForm ? 'Cancelar' : 'Agregar Personal'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddStaffForm && (
            <Card className="mb-6 bg-muted/30">
              <CardContent className="pt-6 space-y-4">
                <h4 className="font-semibold text-lg">Agregar Nuevo Personal</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre *</Label>
                    <Input
                      placeholder="Juan Pérez"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Rol *</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={newStaff.roleId}
                      onChange={(e) => {
                        const roleId = e.target.value;
                        const defaultRate = getDefaultRate(roleId);
                        setNewStaff({ ...newStaff, roleId, hourlyRate: defaultRate });
                      }}
                    >
                      <option value="">Selecciona un rol</option>
                      {STAFF_ROLES.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Contacto *</Label>
                    <Input
                      placeholder="+51 999 999 999"
                      value={newStaff.contact}
                      onChange={(e) => setNewStaff({ ...newStaff, contact: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Horas *</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={newStaff.hours || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, hours: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Tarifa por Hora (S/) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="25.00"
                      value={newStaff.hourlyRate || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, hourlyRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Costo Total</Label>
                    <Input
                      type="number"
                      value={(newStaff.hours * newStaff.hourlyRate).toFixed(2)}
                      disabled
                      className="bg-muted font-bold"
                    />
                  </div>
                </div>

                <Button onClick={handleAddStaff} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Personal
                </Button>
              </CardContent>
            </Card>
          )}

          {event.staff && event.staff.length > 0 ? (
            <div className="space-y-3">
              {event.staff.map((person, index) => {
                const personExtraHours = getStaffExtraHours(person.name);
                const totalExtraHoursCost = personExtraHours.reduce((sum, extra) => sum + extra.total, 0);
                
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{person.name}</h4>
                          {personExtraHours.length > 0 && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                              {personExtraHours.length} horas extra{personExtraHours.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{person.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">S/ {(person.totalCost + totalExtraHoursCost).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          Base: S/ {person.totalCost.toLocaleString()}
                          {totalExtraHoursCost > 0 && ` + S/ ${totalExtraHoursCost.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
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

                    {personExtraHours.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-sm font-semibold text-orange-600">Horas Extras Registradas:</p>
                        {personExtraHours.map((extra) => (
                          <div key={extra.id} className="p-2 bg-orange-500/5 rounded border border-orange-500/20 text-sm">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{extra.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {extra.hours}h × S/ {extra.rate} = S/ {extra.total.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Por: {extra.registradoPor} - {extra.fecha}
                                </p>
                              </div>
                              <p className="font-bold text-orange-600">S/ {extra.total.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {canEdit && (
                      <div className="mt-3 pt-3 border-t">
                        {showExtraHoursForm === person.name ? (
                          <Card className="bg-muted/30">
                            <CardContent className="pt-4 space-y-3">
                              <h5 className="font-semibold text-sm">Registrar Horas Extras para {person.name}</h5>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Horas Extras *</Label>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    value={extraHoursData.hours || ''}
                                    onChange={(e) => setExtraHoursData({ ...extraHoursData, hours: parseFloat(e.target.value) || 0 })}
                                    placeholder="4"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Tarifa (S/) *</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={extraHoursData.rate || person.hourlyRate}
                                    onChange={(e) => setExtraHoursData({ ...extraHoursData, rate: parseFloat(e.target.value) || 0 })}
                                    placeholder={person.hourlyRate.toString()}
                                    className="h-8"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs">Descripción *</Label>
                                <Textarea
                                  value={extraHoursData.description}
                                  onChange={(e) => setExtraHoursData({ ...extraHoursData, description: e.target.value })}
                                  placeholder="Ej: Horas extras por extender el evento"
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>

                              {extraHoursData.hours > 0 && extraHoursData.rate > 0 && (
                                <div className="p-2 bg-orange-500/10 rounded text-sm">
                                  <p className="font-medium">Total: S/ {(extraHoursData.hours * extraHoursData.rate).toFixed(2)}</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAddExtraHours(person.name)} className="flex-1">
                                  Registrar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    setShowExtraHoursForm(null);
                                    setExtraHoursData({ hours: 0, rate: 0, description: '' });
                                  }}
                                  className="flex-1"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowExtraHoursForm(person.name);
                              setExtraHoursData({ hours: 0, rate: person.hourlyRate, description: '' });
                            }}
                            className="w-full"
                          >
                            <Clock className="h-3 w-3 mr-2" />
                            Agregar Horas Extras
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No hay personal asignado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
