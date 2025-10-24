import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types/events';
import { Sparkles } from 'lucide-react';

interface EventDecorationTabProps {
  event: Event;
}

export function EventDecorationTab({ event }: EventDecorationTabProps) {
  const totalProviderCost = event.decoration?.reduce((sum, item) => sum + (item.providerCost || 0), 0) || 0;
  const totalClientCost = event.decoration?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const totalProfit = totalClientCost - totalProviderCost;

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
                    <div>
                      <h4 className="font-semibold">{item.item}</h4>
                      {item.supplier && (
                        <p className="text-sm text-muted-foreground">Proveedor: {item.supplier}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={
                      item.estado === 'completado' ? 'bg-success/10 text-success border-success/20' :
                      item.estado === 'en_proceso' ? 'bg-warning/10 text-warning border-warning/20' :
                      'bg-muted/10 text-muted-foreground border-muted/20'
                    }>
                      {item.estado === 'completado' ? 'Completado' :
                       item.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                    </Badge>
                  </div>
                  
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