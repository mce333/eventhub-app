import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Event } from '@/types/events';
import { Users } from 'lucide-react';

interface EventStaffTabProps {
  event: Event;
}

export function EventStaffTab({ event }: EventStaffTabProps) {
  const totalCost = event.staff?.reduce((sum, person) => sum + person.totalCost, 0) || 0;
  const totalHours = event.staff?.reduce((sum, person) => sum + person.hours, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
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
              Total Horas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHours}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">S/ {totalCost.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personal Asignado
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      <p className="text-xs text-muted-foreground">Costo total</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Horas</p>
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
    </div>
  );
}