import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Minus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { useNavigate } from 'react-router-dom';

interface WarehouseCategory {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  ubicacion: string;
  historial: HistoryEntry[];
  imagen?: string;
}

interface HistoryEntry {
  id: number;
  tipo: 'agregar' | 'quitar' | 'ajuste';
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  motivo: string;
  registradoPor: string;
  registradoRol: string;
  fecha: string;
}

const CATEGORIAS_INICIALES: WarehouseCategory[] = [
  { 
    id: 'sillas', 
    nombre: 'Sillas', 
    cantidad: 0, 
    unidad: 'unidades', 
    ubicacion: 'Almacén Principal', 
    historial: [],
    imagen: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400'
  },
  { 
    id: 'mesas', 
    nombre: 'Mesas', 
    cantidad: 0, 
    unidad: 'unidades', 
    ubicacion: 'Almacén Principal', 
    historial: [],
    imagen: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400'
  },
  { 
    id: 'vasos', 
    nombre: 'Vasos', 
    cantidad: 0, 
    unidad: 'unidades', 
    ubicacion: 'Almacén Principal', 
    historial: [],
    imagen: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'
  },
  { 
    id: 'platos', 
    nombre: 'Platos', 
    cantidad: 0, 
    unidad: 'unidades', 
    ubicacion: 'Almacén Principal', 
    historial: [],
    imagen: 'https://images.unsplash.com/photo-1578643463396-0997cb5328e1?w=400'
  },
  { 
    id: 'manteleria', 
    nombre: 'Mantelería', 
    cantidad: 0, 
    unidad: 'unidades', 
    ubicacion: 'Almacén Principal', 
    historial: [],
    imagen: 'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?w=400'
  },
  { 
    id: 'decoracion', 
    nombre: 'Decoración', 
    cantidad: 0, 
    unidad: 'piezas', 
    ubicacion: 'Almacén Principal', 
    historial: [],
    imagen: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400'
  },
];

export default function Almacen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole(user);
  const [categories, setCategories] = useState<WarehouseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustData, setAdjustData] = useState({
    tipo: 'agregar' as 'agregar' | 'quitar',
    cantidad: 0,
    motivo: '',
  });

  // Solo Coordinador y Admin pueden acceder
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'coordinador') {
      toast.error('No tienes permiso para acceder al almacén');
      navigate('/');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    loadWarehouse();
  }, []);

  const loadWarehouse = () => {
    const stored = localStorage.getItem('warehouse_categories');
    if (stored) {
      setCategories(JSON.parse(stored));
    } else {
      // Inicializar con categorías predeterminadas
      setCategories(CATEGORIAS_INICIALES);
      localStorage.setItem('warehouse_categories', JSON.stringify(CATEGORIAS_INICIALES));
    }
  };

  const handleAdjustQuantity = () => {
    if (!selectedCategory || adjustData.cantidad <= 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const updatedCategories = categories.map(cat => {
      if (cat.id === selectedCategory) {
        const cantidadAnterior = cat.cantidad;
        const cambio = adjustData.tipo === 'agregar' ? adjustData.cantidad : -adjustData.cantidad;
        const cantidadNueva = Math.max(0, cantidadAnterior + cambio);

        const historyEntry: HistoryEntry = {
          id: Date.now(),
          tipo: adjustData.tipo,
          cantidad: adjustData.cantidad,
          cantidadAnterior,
          cantidadNueva,
          motivo: adjustData.motivo,
          registradoPor: `${user?.name} ${user?.last_name}`,
          registradoRol: user?.role?.displayName || 'Usuario',
          fecha: new Date().toLocaleString('es-ES'),
        };

        return {
          ...cat,
          cantidad: cantidadNueva,
          historial: [historyEntry, ...cat.historial],
        };
      }
      return cat;
    });

    setCategories(updatedCategories);
    localStorage.setItem('warehouse_categories', JSON.stringify(updatedCategories));
    
    toast.success(
      adjustData.tipo === 'agregar' 
        ? `${adjustData.cantidad} unidades agregadas` 
        : `${adjustData.cantidad} unidades retiradas`
    );
    
    setShowAdjustForm(false);
    setAdjustData({ tipo: 'agregar', cantidad: 0, motivo: '' });
  };

  const selected = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Almacén</h1>
              <p className="text-muted-foreground">Control de inventario con auditoría completa</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Categorías</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{categories.length}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Items Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {categories.reduce((sum, cat) => sum + cat.cantidad, 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Registros de Auditoría</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {categories.reduce((sum, cat) => sum + cat.historial.length, 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {category.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Imagen */}
                      {category.imagen && (
                        <div className="w-full h-32 rounded-lg overflow-hidden">
                          <img 
                            src={category.imagen} 
                            alt={category.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="text-center py-4">
                        <p className="text-4xl font-bold text-primary">{category.cantidad}</p>
                        <p className="text-sm text-muted-foreground">{category.unidad}</p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p>Ubicación: {category.ubicacion}</p>
                        <p className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {category.historial.length} movimientos
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Category Details */}
            {selected && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {selected.nombre} - Detalles
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setShowAdjustForm(true);
                          setAdjustData({ ...adjustData, tipo: 'agregar' });
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAdjustForm(true);
                          setAdjustData({ ...adjustData, tipo: 'quitar' });
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Quitar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Adjust Form */}
                  {showAdjustForm && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Cantidad *</Label>
                            <Input
                              type="number"
                              value={adjustData.cantidad || ''}
                              onChange={(e) => setAdjustData({ ...adjustData, cantidad: parseInt(e.target.value) || 0 })}
                              placeholder="Ej: 10"
                            />
                          </div>
                          <div>
                            <Label>Acción</Label>
                            <select
                              className="w-full h-10 px-3 rounded-md border border-input bg-background"
                              value={adjustData.tipo}
                              onChange={(e) => setAdjustData({ ...adjustData, tipo: e.target.value as 'agregar' | 'quitar' })}
                            >
                              <option value="agregar">Agregar</option>
                              <option value="quitar">Quitar</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Motivo *</Label>
                          <Input
                            value={adjustData.motivo}
                            onChange={(e) => setAdjustData({ ...adjustData, motivo: e.target.value })}
                            placeholder="Ej: Compra nueva / Se perdieron / Evento X"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleAdjustQuantity} className="flex-1">
                            Confirmar {adjustData.tipo === 'agregar' ? 'Agregado' : 'Retiro'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowAdjustForm(false);
                              setAdjustData({ tipo: 'agregar', cantidad: 0, motivo: '' });
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cantidad Actual */}
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Cantidad Actual</p>
                    <p className="text-5xl font-bold text-primary">{selected.cantidad}</p>
                    <p className="text-sm text-muted-foreground mt-2">{selected.unidad}</p>
                  </div>

                  {/* Historial */}
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Historial de Movimientos ({
                        userRole === 'coordinador'
                          ? selected.historial.filter((entry) => entry.registradoPor === `${user?.name} ${user?.last_name}`).length
                          : selected.historial.length
                      })
                    </h3>
                    
                    {(() => {
                      // Filtrar historial para coordinador (solo sus movimientos)
                      const filteredHistorial = userRole === 'coordinador'
                        ? selected.historial.filter((entry) => entry.registradoPor === `${user?.name} ${user?.last_name}`)
                        : selected.historial;
                      
                      return filteredHistorial.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {filteredHistorial.map((entry) => (
                          <Card key={entry.id} className="bg-muted/30">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge 
                                      variant="outline"
                                      className={entry.tipo === 'agregar' 
                                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                        : 'bg-red-500/10 text-red-600 border-red-500/20'
                                      }
                                    >
                                      {entry.tipo === 'agregar' ? '+ Agregado' : '- Retirado'}
                                    </Badge>
                                    <span className="text-sm font-semibold">
                                      {entry.cantidad} {selected.unidad}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-2">{entry.motivo}</p>
                                  
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <p>
                                      {entry.cantidadAnterior} → {entry.cantidadNueva} {selected.unidad}
                                    </p>
                                    <p className="font-medium">
                                      Por: {entry.registradoPor} ({entry.registradoRol})
                                    </p>
                                    <p>{entry.fecha}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          <p>{userRole === 'coordinador' ? 'No tienes movimientos registrados' : 'No hay movimientos registrados'}</p>
                        </CardContent>
                      </Card>
                    );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {!selectedCategory && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona una categoría para ver detalles y agregar/quitar items</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
