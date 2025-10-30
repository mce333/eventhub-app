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
import { Receipt, Plus, AlertTriangle, TrendingUp, ChefHat, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(false);
  const [selectedDish, setSelectedDish] = useState<string>(() => {
    // Cargar plato guardado del localStorage para este evento
    const saved = localStorage.getItem(`event_${event.id}_selected_dish`);
    // Si no hay plato guardado, usar el plato del evento (tipoDePlato)
    return saved || event.foodDetails?.tipoDePlato || '';
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
  const totalExpenses = event.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const handleAddExpense = () => {
    if (!newExpense.category || newExpense.amount <= 0) {
      toast.error('Por favor completa descripción y monto');
      return;
    }

    const expense: EventExpense = {
      id: Date.now(),
      eventId: event.id,
      category: 'otros' as any,
      description: newExpense.category, // Ahora category contiene la descripción
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

    // Add audit log if admin/socio is editing
    const auditLog = isSuspicious ? {
      id: Date.now(),
      eventId: event.id,
      userId: user?.id || 0,
      userName: `${user?.name} ${user?.last_name}`,
      userRole: user?.role?.name || '',
      action: 'expense_added' as const,
      section: 'gastos',
      description: `Gasto agregado: ${expense.description} - S/ ${expense.amount}`,
      timestamp: new Date().toISOString(),
      changes: {},
      isSuspicious: true,
    } : undefined;

    // Update event in localStorage
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (index !== -1) {
      // Event exists in demo_events, update it
      storedEvents[index].expenses = [...(storedEvents[index].expenses || []), expense];
      storedEvents[index].financial.totalExpenses += expense.amount;
      storedEvents[index].financial.balance -= expense.amount;
      
      if (auditLog) {
        storedEvents[index].auditLog = [...(storedEvents[index].auditLog || []), auditLog];
      }
      
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
    } else {
      // Event is from MOCK_EVENTS, add it to demo_events with the expense
      const updatedEvent = {
        ...event,
        expenses: [...(event.expenses || []), expense],
        financial: {
          ...event.financial,
          totalExpenses: (event.financial?.totalExpenses || 0) + expense.amount,
          balance: (event.financial?.balance || 0) - expense.amount,
        },
        auditLog: auditLog ? [...(event.auditLog || []), auditLog] : event.auditLog,
      };
      storedEvents.push(updatedEvent);
      localStorage.setItem('demo_events', JSON.stringify(storedEvents));
    }
    
    if (isSuspicious) {
      toast.warning('Gasto registrado - Actividad marcada como sospechosa');
    } else {
      toast.success('Gasto registrado correctamente');
    }
    
    setShowAddForm(false);
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
      {/* Suspicious Activity Alert */}
      {isSuspicious && canEdit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Advertencia:</strong> Eres Admin/Socio. Cualquier modificación de gastos será registrada como actividad sospechosa en la auditoría.
          </AlertDescription>
        </Alert>
      )}

      {/* Permission Alert for Servicio users */}
      {userRole === 'servicio' && !canEdit && (
        <Alert>
          <AlertDescription>
            No tienes permisos para editar gastos de este evento. Solo puedes ver eventos donde estás asignado como personal.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Total Gastos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">S/ {totalExpenses.toLocaleString()}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>{predefinedExpenses.length} gastos predeterminados</p>
            <p>{additionalExpenses.length} gastos adicionales</p>
          </div>
        </CardContent>
      </Card>

      {/* Ingredient Control System - SOLO para Encargado de Compras o Admin */}
      {event.foodDetails?.cantidadDePlatos && canEdit && userRole !== 'servicio' && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Guía de Compras
              </CardTitle>
              {selectedDish && suggestedIngredients.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsGuideCollapsed(!isGuideCollapsed)}
                  className="h-7 px-2 text-xs"
                >
                  {isGuideCollapsed ? (
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
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs">Plato del Menú</Label>
              <Select
                value={selectedDish}
                onValueChange={(value) => {
                  console.log('🔄 Plato seleccionado:', value);
                  setSelectedDish(value);
                }}
                disabled={!!selectedDish}
              >
                <SelectTrigger className={`h-8 text-sm ${selectedDish ? 'bg-muted' : ''}`}>
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
                  Plato del evento: {event.foodDetails.tipoDePlato}
                </p>
              )}
            </div>

            {selectedDish && suggestedIngredients.length > 0 && !isGuideCollapsed && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium">
                    Insumos para {event.foodDetails.cantidadDePlatos} porciones:
                  </p>
                  <Badge variant="outline" className="bg-primary/10 text-xs h-5">
                    Guía
                  </Badge>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {suggestedIngredients.map((ingredient, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-background rounded border text-xs"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-xs">{ingredient.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary text-xs">
                          S/ {ingredient.totalCost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Predefined Expenses - SOLO para Encargado de Compras o Admin */}
      {predefinedExpenses.length > 0 && userRole !== 'servicio' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Receipt className="h-4 w-4" />
              Gastos Predeterminados del Menú
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {predefinedExpenses.map((expense) => {
                const isRegistered = registeredExpenses[expense.id] || (expense as any).isRegistered;
                
                return (
                  <div key={expense.id} className={`p-2 border rounded ${isRegistered ? 'bg-green-500/5 border-green-500/30' : 'bg-primary/5'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-medium text-xs">{expense.category}</h4>
                          {isRegistered && (
                            <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30 text-[10px] h-4 px-1">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{expense.description}</p>
                      </div>
                      <p className="text-sm font-bold ml-2">S/ {(expense.amount || 0).toLocaleString()}</p>
                    </div>
                    
                    {canEdit && !isRegistered && (
                      <>
                        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t">
                          <div>
                            <Label className="text-[10px]">Cant.</Label>
                            <Input
                              key={`cantidad-${expense.id}`}
                              type="number"
                              value={getExpenseValue(expense, 'cantidad')}
                              onChange={(e) => handleExpenseInputChange(expense.id, 'cantidad', e.target.value)}
                              onBlur={() => handleExpenseInputBlur(expense.id, 'quantity')}
                              className="h-6 text-xs"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">P. Unit.</Label>
                            <Input
                              key={`costo-${expense.id}`}
                              type="number"
                              step="0.01"
                              value={getExpenseValue(expense, 'costoUnitario')}
                              onChange={(e) => handleExpenseInputChange(expense.id, 'costoUnitario', e.target.value)}
                              onBlur={() => handleExpenseInputBlur(expense.id, 'unitPrice')}
                              className="h-6 text-xs"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Total</Label>
                            <Input
                              key={`total-${expense.id}`}
                              type="number"
                              value={(getExpenseValue(expense, 'cantidad') * getExpenseValue(expense, 'costoUnitario')).toFixed(2)}
                              disabled
                              className="h-6 text-xs bg-muted font-bold"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => registerPredefinedExpense(expense.id)}
                          size="sm"
                          className="w-full mt-1.5 h-6 text-[10px] bg-gradient-primary"
                        >
                          Registrar
                        </Button>
                      </>
                    )}
                    
                    {isRegistered && (
                      <div className="pt-1.5 border-t mt-1">
                        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                          <div>
                            <p className="text-muted-foreground">Cant.</p>
                            <p className="font-medium">{expense.cantidad || 1}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">P.U.</p>
                            <p className="font-medium">S/ {(expense.costoUnitario || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-medium">S/ {((expense.cantidad || 1) * (expense.costoUnitario || 0)).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
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
    </div>
  );
}