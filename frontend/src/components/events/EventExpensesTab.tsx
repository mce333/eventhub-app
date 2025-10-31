import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Event, EventExpense } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { canEditExpenses, isSuspiciousExpenseEdit, getUserRole } from '@/lib/permissions';
import { Receipt, Plus, AlertTriangle, TrendingUp, ChefHat, ChevronDown, ChevronUp, Wallet, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { DISH_INGREDIENTS, calculateTotalIngredients, DishIngredients } from '@/lib/ingredientsData';

interface EventExpensesTabProps {
  event: Event;
  onUpdate: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'pollo', label: 'Pollo' },
  { value: 'salchichas', label: 'Salchichas' },
  { value: 'papas', label: 'Papas' },
  { value: 'verduras', label: 'Verduras' },
  { value: 'cerveza', label: 'Cerveza' },
  { value: 'kiosco', label: 'Kiosco' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'personal', label: 'Personal' },
  { value: 'otros', label: 'Otros' },
];

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'yape', label: 'Yape/Plin' },
];

export function EventExpensesTab({ event, onUpdate }: EventExpensesTabProps) {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(true); // Minimizada por defecto
  const [isComidaSectionCollapsed, setIsComidaSectionCollapsed] = useState(true); // Minimizada por defecto
  const [isInsumosSectionCollapsed, setIsInsumosSectionCollapsed] = useState(true); // Minimizada por defecto
  const [isBebidasSectionCollapsed, setIsBebidasSectionCollapsed] = useState(false);
  
  // Función para mapear el tipoDePlato del evento a un dishId válido
  const mapTipoDePlatoToDishId = (tipoDePlato: string | undefined): string => {
    if (!tipoDePlato) return '';
    
    const lowerPlato = tipoDePlato.toLowerCase();
    
    // Mapeo de nombres comunes a dishIds
    if (lowerPlato.includes('pollo')) return 'pollo-parrilla';
    if (lowerPlato.includes('carne') || lowerPlato.includes('res')) return 'carne-asada';
    if (lowerPlato.includes('pescado')) return 'pescado-frito';
    if (lowerPlato.includes('arroz chaufa')) return 'arroz-chaufa';
    if (lowerPlato.includes('lomo saltado')) return 'lomo-saltado';
    if (lowerPlato.includes('tallarín')) return 'tallarin-saltado';
    if (lowerPlato.includes('ceviche')) return 'ceviche';
    if (lowerPlato.includes('ají de gallina')) return 'aji-gallina';
    
    // Si no hay mapeo, intentar usar el valor directamente
    return tipoDePlato;
  };
  
  const [selectedDish, setSelectedDish] = useState<string>(() => {
    // Cargar plato guardado del localStorage para este evento
    const saved = localStorage.getItem(`event_${event.id}_selected_dish`);
    if (saved) {
      console.log('📦 Plato cargado desde localStorage:', saved);
      return saved;
    }
    
    // Si no hay plato guardado, intentar mapear el plato del evento
    if (event.foodDetails?.tipoDePlato) {
      const mappedDish = mapTipoDePlatoToDishId(event.foodDetails.tipoDePlato);
      console.log('🗺️ Mapeando tipoDePlato:', event.foodDetails.tipoDePlato, '→', mappedDish);
      return mappedDish;
    }
    
    return '';
  });
  
  const [suggestedIngredients, setSuggestedIngredients] = useState<any[]>([]);
  const [registeredExpenses, setRegisteredExpenses] = useState<{[key: number]: boolean}>(() => {
    // Load registered expenses from event data
    const registered: {[key: number]: boolean} = {};
    event.expenses?.forEach(e => {
      if (e.isPredetermined && (e as any).isRegistered) {
        registered[e.id] = true;
      }
    });
    return registered;
  });
  const [editingExpenseValues, setEditingExpenseValues] = useState<{[key: number]: {cantidad: number, costoUnitario: number}}>({});
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: 0,
    quantity: 1,
    unitPrice: 0,
    paymentMethod: 'efectivo',
  });

  // Sync registered expenses when event changes
  useEffect(() => {
    const registered: {[key: number]: boolean} = {};
    event.expenses?.forEach(e => {
      if (e.isPredetermined && (e as any).isRegistered) {
        registered[e.id] = true;
      }
    });
    setRegisteredExpenses(registered);
    
    // Initialize editing values with current expense values
    const initialEditValues: {[key: number]: {cantidad: number, costoUnitario: number}} = {};
    event.expenses?.forEach(e => {
      if (e.isPredetermined) {
        initialEditValues[e.id] = {
          cantidad: e.cantidad ?? 1,
          costoUnitario: e.costoUnitario ?? 0
        };
      }
    });
    setEditingExpenseValues(initialEditValues);
  }, [event.expenses, event.id]);

  // Calculate suggested ingredients when dish changes OR when component mounts
  useEffect(() => {
    if (selectedDish && event.foodDetails?.cantidadDePlatos) {
      console.log('🍽️ Calculando ingredientes para plato:', selectedDish);
      const calculation = calculateTotalIngredients(selectedDish, event.foodDetails.cantidadDePlatos);
      if (calculation) {
        console.log('✅ Ingredientes calculados:', calculation.ingredients.length);
        setSuggestedIngredients(calculation.ingredients);
        // Guardar plato seleccionado en localStorage
        localStorage.setItem(`event_${event.id}_selected_dish`, selectedDish);
      } else {
        console.log('❌ No se encontraron ingredientes para el plato');
      }
    } else {
      console.log('⚠️ Falta selectedDish o cantidadDePlatos');
    }
  }, [selectedDish, event.foodDetails?.cantidadDePlatos, event.id]);

  const canEdit = canEditExpenses(user, event);
  const isSuspicious = isSuspiciousExpenseEdit(user);
  const userRole = getUserRole(user);

  // Separate predefined and additional expenses
  const predefinedExpenses = event.expenses?.filter(e => e.isPredetermined) || [];
  const additionalExpenses = event.expenses?.filter(e => !e.isPredetermined) || [];
  
  // Calculate specific totals
  const comidaInsumosCost = predefinedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const gastosAdicionalesCost = additionalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const decoracionCost = event.decoration?.reduce((sum, d) => sum + (d.providerCost || d.totalPrice || 0), 0) || 0;
  const personalCost = event.staff?.reduce((sum, s) => sum + (s.totalCost || 0), 0) || 0;
  
  // Calculate beverages cost (usando costo local para cerveza y coctel)
  const bebidasCost = event.beverages?.reduce((sum, bev) => {
    let cost = 0;
    if (bev.tipo === 'gaseosa' || bev.tipo === 'agua' || bev.tipo === 'champan' || bev.tipo === 'vino') {
      cost = (bev.cantidad || 0) * (bev.precioUnitario || 0);
    } else if (bev.tipo === 'cerveza') {
      if (bev.modalidad === 'cover') {
        cost = (bev.numeroCajas || 0) * (bev.costoPorCaja || 0);
      } else {
        cost = (bev.cantidad || 0) * (bev.costoCajaLocal || 0);
      }
    } else if (bev.tipo === 'coctel') {
      if (bev.modalidad === 'cover') {
        cost = 0;
      } else {
        cost = (bev.cantidad || 0) * (bev.costoCoctelLocal || 0);
      }
    }
    return sum + cost;
  }, 0) || 0;
  
  const totalExpenses = comidaInsumosCost + gastosAdicionalesCost + decoracionCost + personalCost + bebidasCost;

  const handleAddExpense = () => {
    if (!newExpense.category || newExpense.amount <= 0) {
      toast.error('Por favor completa descripción y monto');
      return;
    }

    const expense: EventExpense = {
      id: Date.now(),
      eventId: event.id,
      category: 'otros' as any,
      description: newExpense.category,
      cantidad: newExpense.quantity,
      costoUnitario: newExpense.unitPrice,
      amount: newExpense.amount,
      date: new Date().toISOString().split('T')[0],
      registeredBy: user?.id || 0,
      registeredByName: `${user?.name} ${user?.last_name}`,
      registeredAt: new Date().toISOString(),
      paymentMethod: newExpense.paymentMethod as any,
      status: 'pending' as any,
      isPredetermined: false,
    };

    saveExpenseToEvent(expense);
  };

  const handleAddIngredient = () => {
    if (!newExpense.category || newExpense.amount <= 0) {
      toast.error('Por favor completa ingrediente y monto');
      return;
    }

    const expense: EventExpense = {
      id: Date.now(),
      eventId: event.id,
      category: 'otros' as any,
      description: newExpense.category,
      cantidad: newExpense.quantity,
      costoUnitario: newExpense.unitPrice,
      amount: newExpense.amount,
      date: new Date().toISOString().split('T')[0],
      registeredBy: user?.id || 0,
      registeredByName: `${user?.name} ${user?.last_name}`,
      registeredAt: new Date().toISOString(),
      paymentMethod: newExpense.paymentMethod as any,
      status: 'pending' as any,
      isPredetermined: true, // Marcado como predeterminado (ingrediente)
    };

    saveExpenseToEvent(expense);
    setShowAddIngredient(false);
  };

  const saveExpenseToEvent = (expense: EventExpense) => {
    // NO agregar auditoría aquí - los gastos tienen su propio registro
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (index !== -1) {
      storedEvents[index].expenses = [...(storedEvents[index].expenses || []), expense];
      storedEvents[index].financial.totalExpenses += expense.amount;
      storedEvents[index].financial.balance -= expense.amount;
      
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
    } else {
      const updatedEvent = {
        ...event,
        expenses: [...(event.expenses || []), expense],
        financial: {
          ...event.financial,
          totalExpenses: (event.financial?.totalExpenses || 0) + expense.amount,
          balance: (event.financial?.balance || 0) - expense.amount,
        },
      };
      storedEvents.push(updatedEvent);
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
    }
    
    toast.success(expense.isPredetermined ? 'Ingrediente registrado en Comida (Insumos)' : 'Gasto adicional registrado correctamente');
    
    setShowAddForm(false);
    setShowAddIngredient(false);
    setNewExpense({
      category: '',
      amount: 0,
      quantity: 1,
      unitPrice: 0,
      paymentMethod: 'efectivo',
    });
    
    console.log('✅ Gasto registrado, llamando onUpdate()...');
    onUpdate();
  };

  const updatePredefinedExpense = (expenseId: number, field: 'quantity' | 'unitPrice', value: number) => {
    try {
      // Validate value
      if (isNaN(value) || value < 0) {
        console.warn('Invalid value for expense update:', value);
        return;
      }

      const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      let index = storedEvents.findIndex((e: Event) => e.id === event.id);
      
      // If event not in localStorage, add it first
      if (index === -1) {
        storedEvents.push(JSON.parse(JSON.stringify(event)));
        index = storedEvents.length - 1;
      }
      
      if (index !== -1) {
        const expenseIndex = storedEvents[index].expenses?.findIndex((e: EventExpense) => e.id === expenseId);
        if (expenseIndex !== undefined && expenseIndex !== -1 && storedEvents[index].expenses) {
          const expense = storedEvents[index].expenses[expenseIndex];
          
          // Store old amount safely
          const oldAmount = expense.amount || 0;
          
          // Update field
          if (field === 'quantity') {
            expense.cantidad = Math.max(0, value);
          } else {
            expense.costoUnitario = Math.max(0, value);
          }
          
          // Calculate new amount safely
          const cantidad = expense.cantidad || 0;
          const costoUnitario = expense.costoUnitario || 0;
          expense.amount = cantidad * costoUnitario;
          
          // Update financial data safely
          const difference = expense.amount - oldAmount;
          if (!isNaN(difference) && isFinite(difference)) {
            storedEvents[index].financial = storedEvents[index].financial || { 
              totalExpenses: 0, 
              totalIncome: 0, 
              balance: 0 
            };
            storedEvents[index].financial.totalExpenses = (storedEvents[index].financial.totalExpenses || 0) + difference;
            storedEvents[index].financial.balance = (storedEvents[index].financial.balance || 0) - difference;
          }
          
          localStorage.setItem('demo_events', JSON.stringify(storedEvents));
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating predefined expense:', error);
      toast.error('Error al actualizar el gasto. Por favor, recarga la página.');
    }
  };

  const handleExpenseInputChange = (expenseId: number, field: 'cantidad' | 'costoUnitario', value: string) => {
    const numValue = parseFloat(value);
    // Allow empty string to clear the field
    const finalValue = value === '' ? 0 : (isNaN(numValue) ? 0 : numValue);
    
    setEditingExpenseValues(prev => ({
      ...prev,
      [expenseId]: {
        cantidad: prev[expenseId]?.cantidad ?? 0,
        costoUnitario: prev[expenseId]?.costoUnitario ?? 0,
        ...prev[expenseId],
        [field]: finalValue
      }
    }));
  };

  const handleExpenseInputBlur = (expenseId: number, field: 'quantity' | 'unitPrice') => {
    const values = editingExpenseValues[expenseId];
    if (values) {
      const value = field === 'quantity' ? values.cantidad : values.costoUnitario;
      if (value !== undefined && !isNaN(value)) {
        updatePredefinedExpense(expenseId, field, value);
      }
    }
  };

  const getExpenseValue = (expense: EventExpense, field: 'cantidad' | 'costoUnitario') => {
    // First check if there's an editing value for this specific expense
    const editingValues = editingExpenseValues[expense.id];
    if (editingValues && editingValues[field] !== undefined) {
      return editingValues[field];
    }
    // Otherwise return the expense's own value, or default based on field
    if (field === 'cantidad') {
      return expense.cantidad ?? 1;
    } else {
      return expense.costoUnitario ?? 0;
    }
  };

  const registerPredefinedExpense = (expenseId: number) => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    let index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    // If event not in localStorage, add it first
    if (index === -1) {
      storedEvents.push({ ...event });
      index = storedEvents.length - 1;
    }
    
    if (index !== -1) {
      const expenseIndex = storedEvents[index].expenses?.findIndex((e: EventExpense) => e.id === expenseId);
      if (expenseIndex !== undefined && expenseIndex !== -1 && storedEvents[index].expenses) {
        const expense = storedEvents[index].expenses[expenseIndex];
        
        // Mark as registered
        (expense as any).isRegistered = true;
        (expense as any).registeredAt = new Date().toLocaleString('es-ES');
        (expense as any).registeredBy = `${user?.name} ${user?.last_name}`;
        
        // Update registration state
        setRegisteredExpenses(prev => ({ ...prev, [expenseId]: true }));
        
        localStorage.setItem('demo_events', JSON.stringify(storedEvents));
        toast.success(`Gasto de ${expense.category} registrado correctamente`);
        onUpdate();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Permission Alert for Servicio users */}
      {userRole === 'servicio' && !canEdit && (
        <Alert>
          <AlertDescription>
            No tienes permisos para editar gastos de este evento. Solo puedes ver eventos donde estás asignado como personal.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards - Gastos Totales y Caja Chica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Gastos del Evento */}
        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Gastos del Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              S/ {totalExpenses.toLocaleString()}
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Comida (Insumos):</span>
                <span className="font-medium">S/ {comidaInsumosCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bebidas:</span>
                <span className="font-medium">S/ {bebidasCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Decoración:</span>
                <span className="font-medium">S/ {decoracionCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Personal:</span>
                <span className="font-medium">S/ {personalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos Adicionales:</span>
                <span className="font-medium">S/ {gastosAdicionalesCost.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Caja Chica del Evento */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Caja Chica del Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              S/ {(event.contract?.presupuestoAsignado || 0).toLocaleString()}
            </p>
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Presupuesto:</span>
                <span className="font-medium">S/ {(event.contract?.presupuestoAsignado || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gastado:</span>
                <span className="font-medium text-destructive">
                  - S/ {totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t">
                <span>Sobrante:</span>
                <span className={((event.contract?.presupuestoAsignado || 0) - totalExpenses) >= 0 ? 'text-success' : 'text-destructive'}>
                  S/ {((event.contract?.presupuestoAsignado || 0) - totalExpenses).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección COMIDA - Guía de Compras + Comida (Insumos) */}
      {event.foodDetails?.cantidadDePlatos && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Comida
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsComidaSectionCollapsed(!isComidaSectionCollapsed)}
                className="h-8 px-3"
              >
                {isComidaSectionCollapsed ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Expandir
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Minimizar
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {!isComidaSectionCollapsed && (
          <CardContent className="space-y-4">
            {/* Guía de Compras */}
            <div className="space-y-3 p-3 bg-background rounded-lg border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Guía de Compras</Label>
                {selectedDish && suggestedIngredients.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsGuideCollapsed(!isGuideCollapsed)}
                    className="h-7 px-2"
                  >
                    {isGuideCollapsed ? (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Expandir Lista
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Minimizar Lista
                      </>
                    )}
                  </Button>
                )}
              </div>
            <div>
              <Label className="text-sm">Seleccionar Plato del Menú</Label>
              <Select
                value={selectedDish}
                onValueChange={(value) => {
                  console.log('🔄 Plato seleccionado:', value);
                  setSelectedDish(value);
                }}
                disabled={!!selectedDish}
              >
                <SelectTrigger className={`${selectedDish ? 'bg-muted' : ''}`}>
                  <SelectValue placeholder="Selecciona el plato principal" />
                </SelectTrigger>
                <SelectContent>
                  {DISH_INGREDIENTS.map((dish) => (
                    <SelectItem key={dish.dishId} value={dish.dishId}>
                      {dish.dishName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {event.foodDetails?.tipoDePlato && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Plato del evento: "{event.foodDetails.tipoDePlato}"
                </p>
              )}
            </div>

            {selectedDish && suggestedIngredients.length > 0 && !isGuideCollapsed && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    Insumos sugeridos para {event.foodDetails.cantidadDePlatos} porciones:
                  </p>
                  <Badge variant="outline" className="bg-primary/10">
                    Guía Automática
                  </Badge>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2 bg-background/50">
                  {suggestedIngredients.map((ingredient, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-background rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ingredient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Cantidad: {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          S/ {ingredient.totalCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          S/ {ingredient.estimatedCost.toFixed(2)}/{ingredient.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Alert className="mt-3">
                  <AlertDescription className="text-xs">
                    💡 <strong>Tip:</strong> Esta guía se basa en el plato seleccionado. Usa estas cantidades como referencia para tus compras.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {selectedDish && suggestedIngredients.length === 0 && (
              <Alert>
                <AlertDescription className="text-sm">
                  ⚠️ No se encontraron ingredientes para este plato. Verifica la configuración.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Comida (Insumos) */}
          {predefinedExpenses.length > 0 && (
            <div className="space-y-3 p-3 bg-background rounded-lg border mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Comida (Insumos)</Label>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAddIngredient(true)}
                      variant="outline"
                      className="h-7 px-2"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Añadir
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInsumosSectionCollapsed(!isInsumosSectionCollapsed)}
                    className="h-7 px-2"
                  >
                    {isInsumosSectionCollapsed ? (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Expandir
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Minimizar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {!isInsumosSectionCollapsed && (
                <div className="space-y-2 mt-3">
                  {predefinedExpenses.map((expense) => {
                    const isRegistered = registeredExpenses[expense.id] || (expense as any).isRegistered;
                    
                    return (
                      <div key={expense.id} className={`p-3 border rounded-lg ${isRegistered ? 'bg-green-500/5 border-green-500/30' : 'bg-primary/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{expense.category}</h4>
                              {isRegistered && (
                                <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                                  ✓ Registrado
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{expense.description}</p>
                          </div>
                          <p className="text-lg font-bold">S/ {(expense.amount || 0).toLocaleString()}</p>
                        </div>
                        
                        {canEdit && !isRegistered && (
                          <>
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                              <div>
                                <Label className="text-xs">Cantidad</Label>
                                <Input
                                  key={`cantidad-${expense.id}`}
                                  type="number"
                                  value={getExpenseValue(expense, 'cantidad')}
                                  onChange={(e) => handleExpenseInputChange(expense.id, 'cantidad', e.target.value)}
                                  onBlur={() => handleExpenseInputBlur(expense.id, 'quantity')}
                                  className="h-8 text-sm"
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Costo Unitario</Label>
                                <Input
                                  key={`costo-${expense.id}`}
                                  type="number"
                                  step="0.01"
                                  value={getExpenseValue(expense, 'costoUnitario')}
                                  onChange={(e) => handleExpenseInputChange(expense.id, 'costoUnitario', e.target.value)}
                                  onBlur={() => handleExpenseInputBlur(expense.id, 'unitPrice')}
                                  className="h-8 text-sm"
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Total</Label>
                                <Input
                                  value={`S/ ${(expense.amount || 0).toFixed(2)}`}
                                  disabled
                                  className="h-8 text-sm font-bold bg-muted"
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => registerPredefinedExpense(expense.id)}
                              className="w-full mt-2 bg-gradient-primary"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Registrar
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Ingredient Form */}
                  {showAddIngredient && canEdit && (
                    <div className="mt-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                      <h4 className="font-semibold mb-3 text-sm">Agregar Ingrediente Adicional</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Ingrediente</Label>
                          <Input
                            placeholder="Ej: Sal, Aceite..."
                            value={newExpense.category}
                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="number"
                            placeholder=""
                            value={newExpense.quantity || ''}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0;
                              setNewExpense({ 
                                ...newExpense, 
                                quantity: qty,
                                amount: qty * newExpense.unitPrice 
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Precio Unit.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder=""
                            value={newExpense.unitPrice || ''}
                            onChange={(e) => {
                              const price = parseFloat(e.target.value) || 0;
                              setNewExpense({ 
                                ...newExpense, 
                                unitPrice: price,
                                amount: newExpense.quantity * price 
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-background rounded border">
                        <div className="flex justify-between text-sm">
                          <span>Total:</span>
                          <span className="font-bold">S/ {newExpense.amount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddIngredient(false);
                            setNewExpense({
                              category: '',
                              amount: 0,
                              quantity: 1,
                              unitPrice: 0,
                              paymentMethod: 'efectivo',
                            });
                          }}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddIngredient}
                          className="flex-1 bg-gradient-primary"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Ingrediente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          </CardContent>
          )}
        </Card>
      )}

      {/* Sección BEBIDAS */}
      {event.beverages && event.beverages.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Bebidas
              </CardTitle>
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => toast.info('Funcionalidad de añadir bebida en desarrollo')}
                    variant="outline"
                    className="h-8 px-3"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Bebida
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBebidasSectionCollapsed(!isBebidasSectionCollapsed)}
                  className="h-8 px-3"
                >
                  {isBebidasSectionCollapsed ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Expandir
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Minimizar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          {!isBebidasSectionCollapsed && (
          <CardContent>
            <div className="space-y-2">
              {event.beverages.map((bev, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-blue-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm capitalize">{bev.tipo}</h4>
                      <p className="text-xs text-muted-foreground">
                        {bev.tipo === 'gaseosa' || bev.tipo === 'agua' || bev.tipo === 'champan' || bev.tipo === 'vino'
                          ? `${bev.cantidad || 0} unidades × S/ ${bev.precioUnitario || 0}`
                          : bev.tipo === 'cerveza'
                          ? bev.modalidad === 'cover'
                            ? `Cover - ${bev.numeroCajas || 0} cajas × S/ ${bev.costoPorCaja || 0}`
                            : `Local - ${bev.cantidad || 0} cajas × S/ ${bev.costoCajaLocal || 0}`
                          : bev.tipo === 'coctel'
                          ? bev.modalidad === 'cover'
                            ? `Cover - ${bev.cantidad || 0} cócteles`
                            : `Local - ${bev.cantidad || 0} cócteles × S/ ${bev.costoCoctelLocal || 0}`
                          : ''
                        }
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      S/ {
                        bev.tipo === 'gaseosa' || bev.tipo === 'agua' || bev.tipo === 'champan' || bev.tipo === 'vino'
                          ? ((bev.cantidad || 0) * (bev.precioUnitario || 0)).toFixed(2)
                          : bev.tipo === 'cerveza'
                          ? bev.modalidad === 'cover'
                            ? ((bev.numeroCajas || 0) * (bev.costoPorCaja || 0)).toFixed(2)
                            : ((bev.cantidad || 0) * (bev.costoCajaLocal || 0)).toFixed(2)
                          : bev.tipo === 'coctel'
                          ? bev.modalidad === 'cover'
                            ? '0.00'
                            : ((bev.cantidad || 0) * (bev.costoCoctelLocal || 0)).toFixed(2)
                          : '0.00'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          )}
        </Card>
      )}

      {/* Add Expense Form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Agregar Gasto Adicional</CardTitle>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? 'outline' : 'default'}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddForm ? 'Cancelar' : 'Agregar'}
              </Button>
            </div>
          </CardHeader>
          {showAddForm && (
            <CardContent className="space-y-4">
              {/* Expense Registration Form */}
              <div>
                <Label>Descripción *</Label>
                <Input
                  placeholder="Ej: Compra de ingredientes adicionales"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                />
              </div>

              <div>
                <Label>Método de Pago *</Label>
                <Select
                  value={newExpense.paymentMethod}
                  onValueChange={(value) => setNewExpense({ ...newExpense, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={newExpense.quantity}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 0;
                      setNewExpense({
                        ...newExpense,
                        quantity,
                        amount: quantity * newExpense.unitPrice,
                      });
                    }}
                  />
                </div>

                <div>
                  <Label>Precio Unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newExpense.unitPrice}
                    onChange={(e) => {
                      const unitPrice = parseFloat(e.target.value) || 0;
                      setNewExpense({
                        ...newExpense,
                        unitPrice,
                        amount: newExpense.quantity * unitPrice,
                      });
                    }}
                  />
                </div>

                <div>
                  <Label>Total *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="font-bold"
                  />
                </div>
              </div>

              <Button onClick={handleAddExpense} className="w-full bg-gradient-primary">
                Registrar Gasto
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Additional Expenses List */}
      {additionalExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Gastos Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {additionalExpenses.map((expense) => (
                <div key={expense.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{expense.category}</h4>
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">S/ {(expense.amount || 0).toLocaleString()}</p>
                      <Badge
                        variant="outline"
                        className={
                          expense.status === 'approved'
                            ? 'bg-success/10 text-success border-success/20'
                            : expense.status === 'pending'
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }
                      >
                        {expense.status === 'approved'
                          ? 'Aprobado'
                          : expense.status === 'pending'
                          ? 'Pendiente'
                          : 'Rechazado'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t">
                    <div>
                      <p className="text-muted-foreground">Fecha</p>
                      <p className="font-medium">
                        {new Date(expense.date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registrado por</p>
                      <p className="font-medium">{expense.registeredByName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Método de pago</p>
                      <p className="font-medium capitalize">{expense.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {additionalExpenses.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No hay gastos adicionales registrados</p>
            {canEdit && (
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Gasto
              </Button>
            )}
          </CardContent>
        </Card>
      )}


      {/* Sección BEBIDAS */}
      {event.beverages && event.beverages.length > 0 && (