import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { useNavigate } from 'react-router-dom';

interface InventoryItem {
  id: number;
  nombre: string;
  categoria: 'sillas' | 'mesas' | 'platos' | 'vasos' | 'manteleria' | 'decoracion' | 'otros';
  cantidad: number;
  unidad: string;
  ubicacion: string;
  estado: 'disponible' | 'en_uso' | 'mantenimiento';
  notas?: string;
  // Auditoría
  registradoPor: string;
  registradoRol: string;
  registradoFecha: string;
  modificadoPor?: string;
  modificadoRol?: string;
  modificadoFecha?: string;
}

const CATEGORIAS = [
  { value: 'sillas', label: 'Sillas' },
  { value: 'mesas', label: 'Mesas' },
  { value: 'platos', label: 'Platos' },
  { value: 'vasos', label: 'Vasos' },
  { value: 'manteleria', label: 'Mantelería' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'otros', label: 'Otros' },
];

export default function Almacen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole(user);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    categoria: 'sillas',
    cantidad: 0,
    unidad: 'unidades',
    ubicacion: '',
    estado: 'disponible',
  });

  // Solo Coordinador y Admin pueden acceder
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'servicio') {
      toast.error('No tienes permiso para acceder al almacén');
      navigate('/');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    const stored = JSON.parse(localStorage.getItem('inventory_items') || '[]');
    setItems(stored);
  };

  const handleAddItem = () => {
    if (!newItem.nombre || !newItem.cantidad || newItem.cantidad <= 0) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const item: InventoryItem = {
      id: Date.now(),
      nombre: newItem.nombre!,
      categoria: newItem.categoria!,
      cantidad: newItem.cantidad!,
      unidad: newItem.unidad!,
      ubicacion: newItem.ubicacion!,
      estado: newItem.estado!,
      notas: newItem.notas,
      registradoPor: `${user?.name} ${user?.last_name}`,
      registradoRol: user?.role?.displayName || 'Usuario',
      registradoFecha: new Date().toLocaleString('es-ES'),
    };

    const updatedItems = [...items, item];
    setItems(updatedItems);
    localStorage.setItem('inventory_items', JSON.stringify(updatedItems));
    
    toast.success('Item agregado al almacén');
    setShowAddForm(false);
    setNewItem({
      categoria: 'sillas',
      cantidad: 0,
      unidad: 'unidades',
      ubicacion: '',
      estado: 'disponible',
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este item?')) {
      const updatedItems = items.filter(i => i.id !== id);
      setItems(updatedItems);
      localStorage.setItem('inventory_items', JSON.stringify(updatedItems));
      toast.success('Item eliminado');
    }
  };

  const filteredItems = items.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Almacén</h1>
                <p className="text-muted-foreground">Control de inventario de sillas, mesas, platos y más</p>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="h-4 w-4 mr-2" />
                {showAddForm ? 'Cancelar' : 'Agregar Item'}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{items.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {items.filter(i => i.estado === 'disponible').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En Uso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">
                    {items.filter(i => i.estado === 'en_uso').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle>Agregar Nuevo Item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre *</Label>
                      <Input
                        placeholder="Ej: Silla plegable"
                        value={newItem.nombre || ''}
                        onChange={(e) => setNewItem({ ...newItem, nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Categoría *</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={newItem.categoria}
                        onChange={(e) => setNewItem({ ...newItem, categoria: e.target.value as any })}
                      >
                        {CATEGORIAS.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Cantidad *</Label>
                      <Input
                        type="number"
                        value={newItem.cantidad || ''}
                        onChange={(e) => setNewItem({ ...newItem, cantidad: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Unidad</Label>
                      <Input
                        value={newItem.unidad}
                        onChange={(e) => setNewItem({ ...newItem, unidad: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Ubicación</Label>
                      <Input
                        placeholder="Ej: Almacén A"
                        value={newItem.ubicacion}
                        onChange={(e) => setNewItem({ ...newItem, ubicacion: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Notas (opcional)</Label>
                    <Input
                      placeholder="Ej: Requiere mantenimiento"
                      value={newItem.notas || ''}
                      onChange={(e) => setNewItem({ ...newItem, notas: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleAddItem} className="w-full">
                    Agregar al Almacén
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{item.nombre}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{item.categoria}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cantidad:</span>
                        <span className="font-medium">{item.cantidad} {item.unidad}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ubicación:</span>
                        <span className="font-medium">{item.ubicacion}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge
                          variant="outline"
                          className={`${
                            item.estado === 'disponible'
                              ? 'bg-green-500/10 text-green-600 border-green-500/20'
                              : item.estado === 'en_uso'
                              ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                              : 'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}
                        >
                          {item.estado === 'disponible' ? 'Disponible' : item.estado === 'en_uso' ? 'En Uso' : 'Mantenimiento'}
                        </Badge>
                      </div>
                      {item.notas && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">{item.notas}</p>
                        </div>
                      )}
                      
                      {/* Auditoría */}
                      <div className="pt-3 border-t space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Auditoría:</p>
                        <div className="text-xs text-muted-foreground">
                          <p>Registrado: {item.registradoPor} ({item.registradoRol})</p>
                          <p>{item.registradoFecha}</p>
                        </div>
                        {item.modificadoPor && (
                          <div className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                            <p>Modificado: {item.modificadoPor} ({item.modificadoRol})</p>
                            <p>{item.modificadoFecha}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {items.length === 0 ? 'No hay items en el almacén' : 'No se encontraron items'}
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
