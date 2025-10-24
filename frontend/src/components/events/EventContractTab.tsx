import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Event } from '@/types/events';
import { FileText, Receipt } from 'lucide-react';

interface EventContractTabProps {
  event: Event;
}

export function EventContractTab({ event }: EventContractTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Precio Total</p>
              <p className="text-2xl font-bold">S/ {event.contract?.precioTotal?.toLocaleString() || '0'}</p>
            </div>
            <div className="p-4 bg-success/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Pago Adelantado</p>
              <p className="text-2xl font-bold text-success">
                S/ {event.contract?.pagoAdelantado?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-warning">
                S/ {event.contract?.saldoPendiente?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Foto del Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.contract?.fotoContrato ? (
            <div className="border rounded-lg overflow-hidden">
              <img
                src={event.contract.fotoContrato}
                alt="Contrato"
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No se ha subido foto del contrato</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recibos de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.contract?.recibos && event.contract.recibos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {event.contract.recibos.map((recibo, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={recibo}
                    alt={`Recibo ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed rounded-lg">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No se han subido recibos de pago</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}