import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, UtensilsCrossed, Sparkles, PieChart } from 'lucide-react';
import { Event } from '@/types/events';

export default function Estadisticas() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = () => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    setEvents(storedEvents);

    // Calcular estadísticas
    const completedEvents = storedEvents.filter((e: Event) => e.status === 'completed');
    
    if (completedEvents.length === 0) {
      setStats(null);
      return;
    }

    // Análisis de rentabilidad
    const profitabilityAnalysis = completedEvents.map((event: Event) => {
      const ingresos = event.financial?.totalIncome || 0;
      const gastos = event.financial?.totalExpenses || 0;
      const ganancia = ingresos - gastos;
      const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0;
      
      return {
        id: event.id,
        nombre: event.name,
        tipo: event.type,
        ingresos,
        gastos,
        ganancia,
        margen,
        asistentes: event.attendees,
      };
    });

    // Ordenar por margen de ganancia
    const sorted = [...profitabilityAnalysis].sort((a, b) => b.margen - a.margen);
    const masRentable = sorted[0];
    const menosRentable = sorted[sorted.length - 1];

    // Análisis de distribución de gastos (promedio)
    const totalGastos = completedEvents.reduce((sum: number, e: Event) => sum + (e.financial?.totalExpenses || 0), 0);
    const avgGastos = totalGastos / completedEvents.length;

    // Calcular porcentajes de gastos por categoría (estimación)
    const gastosPersonal = completedEvents.reduce((sum: number, e: Event) => {
      const staffCost = (e.staff || []).reduce((s, p) => s + (p.totalCost || 0), 0);
      return sum + staffCost;
    }, 0);

    const gastosComida = completedEvents.reduce((sum: number, e: Event) => {
      if (e.serviceType === 'con_comida' && e.foodDetails) {
        return sum + (e.foodDetails.cantidadDePlatos * e.foodDetails.precioPorPlato * 0.7); // Estimado 70% del precio es costo
      }
      return sum;
    }, 0);

    const gastosDecoracion = completedEvents.reduce((sum: number, e: Event) => {
      return sum + ((e.decoration || []).reduce((s, d) => s + (d.providerCost || 0), 0));
    }, 0);

    const gastosOtros = totalGastos - gastosPersonal - gastosComida - gastosDecoracion;

    const distribucionGastos = [
      { categoria: 'Personal', monto: gastosPersonal, porcentaje: (gastosPersonal / totalGastos) * 100 },
      { categoria: 'Comida', monto: gastosComida, porcentaje: (gastosComida / totalGastos) * 100 },
      { categoria: 'Decoración', monto: gastosDecoracion, porcentaje: (gastosDecoracion / totalGastos) * 100 },
      { categoria: 'Otros', monto: gastosOtros, porcentaje: (gastosOtros / totalGastos) * 100 },
    ].filter(item => item.monto > 0);

    setStats({
      masRentable,
      menosRentable,
      distribucionGastos,
      profitabilityAnalysis: sorted, // Guardar para usar en la tabla
      totalEventosCompletados: completedEvents.length,
      promedioGanancia: sorted.reduce((sum, e) => sum + e.ganancia, 0) / sorted.length,
      promedioMargen: sorted.reduce((sum, e) => sum + e.margen, 0) / sorted.length,
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Estadísticas y Análisis</h1>
              <p className="text-muted-foreground">Optimiza tus costos y aumenta la rentabilidad</p>
            </div>

            {stats ? (
              <>
                {/* Resumen General */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Promedio de Ganancia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">S/ {stats.promedioGanancia.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Por evento completado</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Margen Promedio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600">{stats.promedioMargen.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground mt-1">De rentabilidad</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Analizados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">{stats.totalEventosCompletados}</p>
                      <p className="text-sm text-muted-foreground mt-1">Completados</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparación de Rentabilidad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Más Rentable */}
                  <Card className="border-2 border-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-5 w-5" />
                        Evento Más Rentable
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-lg font-semibold">{stats.masRentable.nombre}</p>
                        <Badge variant="outline" className="mt-1 capitalize">{stats.masRentable.tipo}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Ingresos</p>
                          <p className="font-semibold text-green-600">S/ {stats.masRentable.ingresos.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gastos</p>
                          <p className="font-semibold text-red-600">S/ {stats.masRentable.gastos.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ganancia</p>
                          <p className="font-semibold text-green-600">S/ {stats.masRentable.ganancia.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Margen</p>
                          <p className="font-semibold text-green-600">{stats.masRentable.margen.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          <strong>Por qué fue rentable:</strong> Alto margen de ganancia del {stats.masRentable.margen.toFixed(1)}% con {stats.masRentable.asistentes} asistentes.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Menos Rentable */}
                  <Card className="border-2 border-orange-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <TrendingDown className="h-5 w-5" />
                        Evento Menos Rentable
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-lg font-semibold">{stats.menosRentable.nombre}</p>
                        <Badge variant="outline" className="mt-1 capitalize">{stats.menosRentable.tipo}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Ingresos</p>
                          <p className="font-semibold text-green-600">S/ {stats.menosRentable.ingresos.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gastos</p>
                          <p className="font-semibold text-red-600">S/ {stats.menosRentable.gastos.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ganancia</p>
                          <p className="font-semibold">{stats.menosRentable.ganancia >= 0 ? 'S/' : '-S/'} {Math.abs(stats.menosRentable.ganancia).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Margen</p>
                          <p className="font-semibold">{stats.menosRentable.margen.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          <strong>Áreas de mejora:</strong> Considera optimizar costos para mejorar el margen de ganancia.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Distribución de Gastos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Distribución Promedio de Gastos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.distribucionGastos.map((item: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{item.categoria}</span>
                            <span className="text-sm font-semibold">{item.porcentaje.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                item.categoria === 'Personal' ? 'bg-blue-600' :
                                item.categoria === 'Comida' ? 'bg-orange-600' :
                                item.categoria === 'Decoración' ? 'bg-purple-600' :
                                'bg-gray-600'
                              }`}
                              style={{ width: `${item.porcentaje}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            S/ {item.monto.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm font-semibold mb-2">💡 Recomendaciones:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {stats.distribucionGastos[0]?.porcentaje > 40 && (
                          <li>• El {stats.distribucionGastos[0].categoria} representa más del 40% de tus gastos. Considera negociar mejores tarifas.</li>
                        )}
                        <li>• Compara estos porcentajes con eventos similares para identificar oportunidades de ahorro.</li>
                        <li>• Eventos con margen superior al 40% son altamente rentables.</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabla de Todos los Eventos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparativa de Eventos Completados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Evento</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ingresos</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Gastos</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ganancia</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Margen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.profitabilityAnalysis.map((event: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4 text-sm font-medium">{event.nombre}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="capitalize text-xs">{event.tipo}</Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                                S/ {event.ingresos.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-medium text-red-600">
                                S/ {event.gastos.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-semibold">
                                S/ {event.ganancia.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-right">
                                <Badge
                                  variant="outline"
                                  className={event.margen > 40 ? 'bg-green-500/10 text-green-600' : event.margen > 20 ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'}
                                >
                                  {event.margen.toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay eventos completados para analizar</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las estadísticas se generarán automáticamente cuando tengas eventos completados
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
