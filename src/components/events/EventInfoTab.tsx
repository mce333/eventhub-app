import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Event } from '@/types/events';

interface EventInfoTabProps {
  event: Event;
  isEditing: boolean;
  onUpdate: (event: Event) => void;
}

export function EventInfoTab({ event, isEditing, onUpdate }: EventInfoTabProps) {
  const handleChange = (field: keyof Event, value: any) => {
    onUpdate({ ...event, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Evento</Label>
              <Input
                value={event.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input value={event.type} disabled />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={event.date}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input
                value={event.location}
                onChange={(e) => handleChange('location', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Capacidad Máxima</Label>
              <Input
                type="number"
                value={event.maxAttendees}
                onChange={(e) => handleChange('maxAttendees', parseInt(e.target.value))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Asistentes Confirmados</Label>
              <Input
                type="number"
                value={event.attendees}
                onChange={(e) => handleChange('attendees', parseInt(e.target.value))}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={event.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input value={event.client?.name || ''} disabled={!isEditing} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={event.client?.email || ''} disabled={!isEditing} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={event.client?.phone || ''} disabled={!isEditing} />
            </div>
          </div>
        </CardContent>
      </Card>

      {event.serviceType === 'con_comida' && event.foodDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles de Comida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Plato</Label>
                <Input value={event.foodDetails.tipoDePlato} disabled />
              </div>
              <div>
                <Label>Cantidad de Platos</Label>
                <Input value={event.foodDetails.cantidadDePlatos} disabled />
              </div>
              <div>
                <Label>Precio por Plato</Label>
                <Input value={`S/ ${event.foodDetails.precioPorPlato}`} disabled />
              </div>
              <div>
                <Label>Costo Total</Label>
                <Input
                  value={`S/ ${(event.foodDetails.cantidadDePlatos * event.foodDetails.precioPorPlato).toFixed(2)}`}
                  disabled
                  className="font-bold"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {event.auditLog?.slice(-5).reverse().map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{log.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Por {log.userName} ({log.userRole}) - {new Date(log.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}