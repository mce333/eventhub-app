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
import { Receipt, Plus, AlertTriangle, TrendingUp, ChefHat } from 'lucide-react';
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
  const [selectedDish, setSelectedDish] = useState<string>(() => {
    // Cargar plato guardado del localStorage para este evento
    const saved = localStorage.getItem(`event_${event.id}_selected_dish`);
    return saved || '';
  });
  const [suggestedIngredients, setSuggestedIngredients] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: 0,
    quantity: 1,
    unitPrice: 0,
    paymentMethod: 'efectivo',
  });

  // Calculate suggested ingredients when dish changes
  useEffect(() => {
    if (selectedDish && event.foodDetails?.cantidadDePlatos) {
      const calculation = calculateTotalIngredients(selectedDish, event.foodDetails.cantidadDePlatos);
      if (calculation) {
        setSuggestedIngredients(calculation.ingredients);
        // Guardar plato seleccionado en localStorage
        localStorage.setItem(`event_${event.id}_selected_dish`, selectedDish);
      }
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
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Get description from selected category
    const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === newExpense.category)?.label || newExpense.category;

    const expense: EventExpense = {
      id: Date.now(),
      eventId: event.id,
      category: newExpense.category as any,
      description: categoryLabel,
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
    setSelectedDish('');
    setSuggestedIngredients([]);
    setShowIngredientGuide(false);
    setNewExpense({
      category: '',
      amount: 0,
      quantity: 1,
      unitPrice: 0,
      paymentMethod: 'efectivo',
    });
    onUpdate();
  };

  const updatePredefinedExpense = (expenseId: number, field: 'quantity' | 'unitPrice', value: number) => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    const index = storedEvents.findIndex((e: Event) => e.id === event.id);
    
    if (index !== -1) {
      const expenseIndex = storedEvents[index].expenses?.findIndex((e: EventExpense) => e.id === expenseId);
      if (expenseIndex !== undefined && expenseIndex !== -1 && storedEvents[index].expenses) {
        const expense = storedEvents[index].expenses![expenseIndex];
        const oldAmount = expense.amount;
        
        if (field === 'quantity') {
          expense.cantidad = value;
        } else {
          expense.costoUnitario = value;
        }
        
        expense.amount = (expense.cantidad || 1) * (expense.costoUnitario || 0);
        
        const difference = expense.amount - oldAmount;
        storedEvents[index].financial.totalExpenses += difference;
        storedEvents[index].financial.balance -= difference;
        
        localStorage.setItem('demo_events', JSON.stringify(storedEvents));
        onUpdate();
      }
    } else {
      // Event from MOCK_EVENTS - add to demo_events with update
      const updatedEvent = { ...event };
      const expenseIndex = updatedEvent.expenses?.findIndex((e: EventExpense) => e.id === expenseId);
      
      if (expenseIndex !== undefined && expenseIndex !== -1 && updatedEvent.expenses) {
        const expense = updatedEvent.expenses[expenseIndex];
        const oldAmount = expense.amount;
        
        if (field === 'quantity') {
          expense.cantidad = value;
        } else {
          expense.costoUnitario = value;
        }
        
        expense.amount = (expense.cantidad || 1) * (expense.costoUnitario || 0);
        
        const difference = expense.amount - oldAmount;
        updatedEvent.financial = {
          ...updatedEvent.financial,
          totalExpenses: (updatedEvent.financial?.totalExpenses || 0) + difference,
          balance: (updatedEvent.financial?.balance || 0) - difference,
        };
        
        storedEvents.push(updatedEvent);
        localStorage.setItem('demo_events', JSON.stringify(storedEvents));
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

      {/* Ingredient Control System - GLOBAL para todo el evento */}
      {event.foodDetails?.cantidadDePlatos && canEdit && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Guía de Compras para el Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Seleccionar Plato del Menú (Solo una vez)</Label>
              <Select
                value={selectedDish}
                onValueChange={setSelectedDish}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el plato principal del evento" />
                </SelectTrigger>
                <SelectContent>
                  {DISH_INGREDIENTS.map((dish) => (
                    <SelectItem key={dish.dishId} value={dish.dishId}>
                      {dish.dishName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDish && suggestedIngredients.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    Insumos sugeridos para {event.foodDetails.cantidadDePlatos} porciones:
                  </p>
                  <Badge variant="outline" className="bg-primary/10">
                    Guía de Compra
                  </Badge>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {suggestedIngredients.map((ingredient, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{ingredient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Cantidad máxima: {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
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
                    💡 <strong>Tip:</strong> Esta guía se muestra una sola vez por evento. Usa estas cantidades como referencia para todas tus compras.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Predefined Expenses */}
      {predefinedExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Gastos Predeterminados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predefinedExpenses.map((expense) => (
                <div key={expense.id} className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{expense.category}</h4>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          PREDETERMINADO
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">S/ {expense.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {canEdit && (
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                      <div>
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          value={expense.cantidad || 1}
                          onChange={(e) => updatePredefinedExpense(expense.id, 'quantity', parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Precio Unitario</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={expense.costoUnitario || 0}
                          onChange={(e) => updatePredefinedExpense(expense.id, 'unitPrice', parseFloat(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input
                          type="number"
                          value={expense.amount}
                          disabled
                          className="h-8 bg-muted font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
              {/* Ingredient Control System */}
              {event.foodDetails?.cantidadDePlatos && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      Guía de Compras Automática
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Seleccionar Plato del Menú</Label>
                      <Select
                        value={selectedDish}
                        onValueChange={setSelectedDish}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un plato para ver insumos sugeridos" />
                        </SelectTrigger>
                        <SelectContent>
                          {DISH_INGREDIENTS.map((dish) => (
                            <SelectItem key={dish.dishId} value={dish.dishId}>
                              {dish.dishName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {showIngredientGuide && suggestedIngredients.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            Insumos sugeridos para {event.foodDetails.cantidadDePlatos} porciones:
                          </p>
                          <Badge variant="outline" className="bg-primary/10">
                            Guía de Compra
                          </Badge>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {suggestedIngredients.map((ingredient, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{ingredient.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Cantidad máxima: {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
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
                            💡 <strong>Tip:</strong> Estas son cantidades máximas sugeridas basadas en el menú seleccionado.
                            Usa esta guía para registrar tus compras reales.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Expense Registration Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoría *</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <p className="text-lg font-bold">S/ {expense.amount.toLocaleString()}</p>
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