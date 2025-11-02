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
import { Receipt, Plus, AlertTriangle, TrendingUp, ChefHat, ChevronDown, ChevronUp, Wallet, Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DISH_INGREDIENTS, calculateTotalIngredients, DishIngredients, VEGETABLE_OPTIONS, CHILI_OPTIONS, dishRequiresChili } from '@/lib/ingredientsData';

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
  const [isBebidasSectionCollapsed, setIsBebidasSectionCollapsed] = useState(true); // Minimizada por defecto
  const [showAddBeverage, setShowAddBeverage] = useState(false);
  const [newBeverage, setNewBeverage] = useState<{
    tipo: 'gaseosa' | 'agua' | 'champan' | 'vino' | 'cerveza' | 'coctel';
    cantidad: number;
    precioUnitario?: number;
    litros?: number;
    modalidad?: 'cover' | 'compra_local';
    numeroCajas?: number;
    costoPorCaja?: number;
    costoCajaLocal?: number;
    costoCajaCliente?: number;
    costoCoctelLocal?: number;
    costoCoctelCliente?: number;
  }>({
    tipo: 'gaseosa',
    cantidad: 0,
    precioUnitario: 0,
  });
  
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

  // Estados para verduras y ajíes
  const [showAddVegetable, setShowAddVegetable] = useState(false);
  const [showAddChili, setShowAddChili] = useState(false);
  const [selectedVegetables, setSelectedVegetables] = useState<Array<{name: string, kg: number, pricePerKg: number, total: number}>>([]);
  const [selectedChilis, setSelectedChilis] = useState<Array<{name: string, kg: number, pricePerKg: number, total: number}>>([]);
  const [newVegetable, setNewVegetable] = useState({ name: '', kg: 0, pricePerKg: 0 });
  const [newChili, setNewChili] = useState({ name: '', kg: 0, pricePerKg: 0 });

  // Estado para ingredientes dinámicos editables
  const [dynamicIngredientValues, setDynamicIngredientValues] = useState<{[key: string]: {cantidad: number, costoUnitario: number}}>({});
  const [registeredDynamicIngredients, setRegisteredDynamicIngredients] = useState<{[key: string]: boolean}>({});


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
  const isCoordinador = userRole === 'coordinador';
  const isEncargadoCompras = userRole === 'encargado_compras';

  // Separate predefined and additional expenses
  const predefinedExpenses = event.expenses?.filter(e => e.isPredetermined) || [];
  const additionalExpenses = event.expenses?.filter(e => !e.isPredetermined) || [];
  
  // Lista de verduras a excluir (ya se manejan en la sección de Verduras)
  const EXCLUDED_VEGETABLES = ['tomate', 'lechuga', 'limón', 'limon', 'zanahoria', 'cebolla', 'pimiento', 'pepino', 'culantro'];
  
  // Generar ingredientes dinámicamente basados en el plato seleccionado
  const dynamicIngredients = selectedDish && event.foodDetails?.cantidadDePlatos 
    ? suggestedIngredients
        .filter(ing => !EXCLUDED_VEGETABLES.some(vegName => ing.name.toLowerCase().includes(vegName)))
        .map((ing, idx) => ({
          id: `dynamic-${selectedDish}-${idx}`,
          category: ing.category,
          description: ing.name,
          cantidad: ing.totalQuantity,
          costoUnitario: ing.estimatedCost,
          amount: ing.totalCost,
          unit: ing.unit,
          isDynamic: true, // Marca para identificar ingredientes dinámicos
        }))
    : [];
  
  // Calculate specific totals
  const comidaInsumosCost = predefinedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const gastosAdicionalesCost = additionalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const decoracionCost = event.decoration?.reduce((sum, d) => sum + (d.providerCost || d.totalPrice || 0), 0) || 0;
  const personalCost = event.staff?.reduce((sum, s) => sum + (s.totalCost || 0), 0) || 0;
  
  // Calculate vegetables total (verduras registradas)
  const verdurasTotal = event.expenses?.filter(e => e.isPredetermined && e.category === 'verduras').reduce((sum, e) => sum + e.amount, 0) || 0;
  
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

  // Funciones para manejar verduras
  const handleAddVegetable = () => {
    if (!newVegetable.name || newVegetable.kg <= 0 || newVegetable.pricePerKg <= 0) {
      toast.error('Por favor completa todos los campos de verdura');
      return;
    }

    const total = newVegetable.kg * newVegetable.pricePerKg;
    const vegetableItem = { ...newVegetable, total };
    
    setSelectedVegetables([...selectedVegetables, vegetableItem]);
    setNewVegetable({ name: '', kg: 0, pricePerKg: 0 });
    setShowAddVegetable(false);
    toast.success(`${newVegetable.name} agregado`);
  };

  const handleDeleteVegetable = (index: number) => {
    const updated = selectedVegetables.filter((_, i) => i !== index);
    setSelectedVegetables(updated);
    toast.success('Verdura eliminada');
  };

  const handleSaveVegetables = () => {
    if (selectedVegetables.length === 0) {
      toast.error('No hay verduras para registrar');
      return;
    }

    selectedVegetables.forEach((veg) => {
      const expense: EventExpense = {
        id: Date.now() + Math.random(),
        eventId: event.id,
        category: 'verduras',
        description: `${veg.name} - ${veg.kg} kg`,
        cantidad: veg.kg,
        costoUnitario: veg.pricePerKg,
        amount: veg.total,
        date: new Date().toISOString().split('T')[0],
        registeredBy: user?.id || 0,
        registeredByName: `${user?.name} ${user?.last_name}`,
        registeredAt: new Date().toISOString(),
        isPredetermined: true,
      };
      
      saveExpenseToEvent(expense);
    });

    setSelectedVegetables([]);
    toast.success('Verduras registradas correctamente');
  };

  // Funciones para manejar ajíes
  const handleAddChili = () => {
    if (!newChili.name || newChili.kg <= 0 || newChili.pricePerKg <= 0) {
      toast.error('Por favor completa todos los campos de ají');
      return;
    }

    const total = newChili.kg * newChili.pricePerKg;
    const chiliItem = { ...newChili, total };
    
    setSelectedChilis([...selectedChilis, chiliItem]);
    setNewChili({ name: '', kg: 0, pricePerKg: 0 });
    setShowAddChili(false);
    toast.success(`${newChili.name} agregado`);
  };

  const handleDeleteChili = (index: number) => {
    const updated = selectedChilis.filter((_, i) => i !== index);
    setSelectedChilis(updated);
    toast.success('Ají eliminado');
  };

  const handleSaveChilis = () => {
    if (selectedChilis.length === 0) {
      toast.error('No hay ajíes para registrar');
      return;
    }

    selectedChilis.forEach((chili) => {
      const expense: EventExpense = {
        id: Date.now() + Math.random(),
        eventId: event.id,
        category: 'verduras',
        description: `${chili.name} - ${chili.kg} kg`,
        cantidad: chili.kg,
        costoUnitario: chili.pricePerKg,
        amount: chili.total,
        date: new Date().toISOString().split('T')[0],
        registeredBy: user?.id || 0,
        registeredByName: `${user?.name} ${user?.last_name}`,
        registeredAt: new Date().toISOString(),
        isPredetermined: true,
      };
      
      saveExpenseToEvent(expense);
    });

    setSelectedChilis([]);
    toast.success('Ajíes registrados correctamente');
  };

  // Función para registrar ingrediente dinámico
  const handleRegisterDynamicIngredient = (ingredient: any) => {
    const values = dynamicIngredientValues[ingredient.id];
    
    if (!values || values.cantidad <= 0 || values.costoUnitario <= 0) {
      toast.error('Por favor completa cantidad y costo unitario');
      return;
    }

    const expense: EventExpense = {
      id: Date.now() + Math.random(),
      eventId: event.id,
      category: ingredient.category,
      description: `${ingredient.description} (${selectedDish})`,
      cantidad: values.cantidad,
      costoUnitario: values.costoUnitario,
      amount: values.cantidad * values.costoUnitario,
      date: new Date().toISOString().split('T')[0],
      registeredBy: user?.id || 0,
      registeredByName: `${user?.name} ${user?.last_name}`,
      registeredAt: new Date().toISOString(),
      isPredetermined: true,
    };

    saveExpenseToEvent(expense);
    setRegisteredDynamicIngredients(prev => ({ ...prev, [ingredient.id]: true }));
    toast.success(`${ingredient.description} registrado`);
  };

  const handleDynamicIngredientChange = (ingredientId: string, field: 'cantidad' | 'costoUnitario', value: number) => {
    setDynamicIngredientValues(prev => ({
      ...prev,
      [ingredientId]: {
        cantidad: prev[ingredientId]?.cantidad || 0,
        costoUnitario: prev[ingredientId]?.costoUnitario || 0,
        ...prev[ingredientId],
        [field]: value
      }
    }));
  };


  const handleAddBeverage = () => {
    // Validaciones según tipo
    if (newBeverage.tipo === 'gaseosa' || newBeverage.tipo === 'agua' || newBeverage.tipo === 'champan' || newBeverage.tipo === 'vino') {
      if (newBeverage.cantidad <= 0) {
        toast.error('Por favor ingresa una cantidad válida');
        return;
      }
      if (!newBeverage.precioUnitario) {
        toast.error('Por favor ingresa el precio por unidad');
        return;
      }
    } else if (newBeverage.tipo === 'cerveza') {
      if (newBeverage.modalidad === 'cover') {
        if (!newBeverage.numeroCajas || newBeverage.numeroCajas <= 0) {
          toast.error('Por favor ingresa el número de cajas');
          return;
        }
        if (!newBeverage.costoPorCaja || newBeverage.costoPorCaja <= 0) {
          toast.error('Por favor ingresa el costo por caja');
          return;
        }
      } else {
        if (!newBeverage.cantidad || newBeverage.cantidad <= 0) {
          toast.error('Por favor ingresa la cantidad de cajas');
          return;
        }
        if (!newBeverage.costoCajaLocal || newBeverage.costoCajaLocal <= 0) {
          toast.error('Por favor ingresa el costo local por caja');
          return;
        }
      }
    } else if (newBeverage.tipo === 'coctel') {
      if (!newBeverage.cantidad || newBeverage.cantidad <= 0) {
        toast.error('Por favor ingresa la cantidad de cócteles');
        return;
      }
      if (newBeverage.modalidad === 'cover') {
        if (!newBeverage.costoPorCaja || newBeverage.costoPorCaja <= 0) {
          toast.error('Por favor ingresa el costo por cóctel');
          return;
        }
      } else {
        if (!newBeverage.costoCoctelLocal || newBeverage.costoCoctelLocal <= 0) {
          toast.error('Por favor ingresa el costo local por cóctel');
          return;
        }
      }
    }

    try {
      const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const index = storedEvents.findIndex((e: Event) => e.id === event.id);
      
      if (index !== -1) {
        // Agregar bebida al array de beverages
        const updatedBeverages = [
          ...(storedEvents[index].beverages || []),
          {
            id: Date.now(),
            ...newBeverage,
          },
        ];
        
        storedEvents[index].beverages = updatedBeverages;
        
        // Crear entrada de auditoría
        const auditEntry = {
          id: Date.now() + 1,
          eventId: event.id,
          userId: user?.id || 1,
          userName: `${user?.name} ${user?.last_name}`,
          userRole: user?.role?.name || 'admin',
          action: 'added' as const,
          section: 'Bebidas',
          description: `Bebida agregada: ${newBeverage.tipo} (${newBeverage.cantidad || newBeverage.numeroCajas || 0} ${newBeverage.tipo === 'cerveza' && newBeverage.modalidad === 'cover' ? 'cajas' : 'unidades'})`,
          timestamp: new Date().toISOString(),
        };
        
        storedEvents[index].auditLog = [...(storedEvents[index].auditLog || []), auditEntry];
        storedEvents[index].updatedAt = new Date().toISOString();
        
        localStorage.setItem('demo_events', JSON.stringify(storedEvents));
        
        toast.success('Bebida agregada correctamente');
        
        // Limpiar formulario
        setNewBeverage({
          tipo: 'gaseosa',
          cantidad: 0,
          precioUnitario: 0,
        });
        setShowAddBeverage(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error al agregar bebida:', error);
      toast.error('Error al agregar la bebida');
    }
  };

  const handleDeleteBeverage = (beverageIndex: number) => {
    if (!confirm('¿Estás seguro de eliminar esta bebida?')) return;

    try {
      const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const index = storedEvents.findIndex((e: Event) => e.id === event.id);
      
      if (index !== -1) {
        const beverageToDelete = storedEvents[index].beverages[beverageIndex];
        
        // Eliminar bebida del array
        const updatedBeverages = storedEvents[index].beverages.filter((_: any, idx: number) => idx !== beverageIndex);
        storedEvents[index].beverages = updatedBeverages;
        
        // Crear entrada de auditoría
        const auditEntry = {
          id: Date.now(),
          eventId: event.id,
          userId: user?.id || 1,
          userName: `${user?.name} ${user?.last_name}`,
          userRole: user?.role?.name || 'admin',
          action: 'deleted' as const,
          section: 'Bebidas',
          description: `Bebida eliminada: ${beverageToDelete.tipo} (${beverageToDelete.cantidad} unidades)`,
          timestamp: new Date().toISOString(),
        };
        
        storedEvents[index].auditLog = [...(storedEvents[index].auditLog || []), auditEntry];
        storedEvents[index].updatedAt = new Date().toISOString();
        
        localStorage.setItem('demo_events', JSON.stringify(storedEvents));
        
        toast.success('Bebida eliminada correctamente');
        onUpdate();
      }
    } catch (error) {
      console.error('Error al eliminar bebida:', error);
      toast.error('Error al eliminar la bebida');
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
      {/* Ocultar para Coordinador y Encargado de Compras */}
      {!isCoordinador && !isEncargadoCompras && (
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
                <span>Verduras - Total:</span>
                <span className="font-medium text-green-600">S/ {verdurasTotal.toFixed(2)}</span>
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
      )}

      {/* Sección COMIDA - Guía de Compras + Comida (Insumos) */}
      {/* Mostrar solo si NO es coordinador (encargado_compras y admin sí la ven) */}
      {!isCoordinador && event.foodDetails?.cantidadDePlatos && (
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
          {(dynamicIngredients.length > 0 || selectedDish) && (
            <div className="space-y-3 p-3 bg-background rounded-lg border mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Comida (Insumos)</Label>
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

              {!isInsumosSectionCollapsed && (
                <div className="space-y-4 mt-3">
                  {/* VERDURAS - AL INICIO */}
                  {!isCoordinador && (
                    <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-green-700">Verduras</Label>
                        {canEdit && (
                          <Button
                            onClick={() => setShowAddVegetable(true)}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        )}
                      </div>

                      {/* Verduras agregadas pendientes de guardar */}
                      {selectedVegetables.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <p className="text-xs text-muted-foreground">Pendientes de registro:</p>
                          {selectedVegetables.map((veg, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                              <div className="flex-1">
                                <p className="font-medium">{veg.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {veg.kg} kg × S/ {veg.pricePerKg}/kg
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-green-600">S/ {veg.total.toFixed(2)}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteVegetable(index)}
                                  className="h-6 w-6 p-0 text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            onClick={handleSaveVegetables}
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-3 w-3 mr-2" />
                            Registrar Verduras (S/ {selectedVegetables.reduce((sum, v) => sum + v.total, 0).toFixed(2)})
                          </Button>
                        </div>
                      )}

                      {/* Formulario agregar verdura */}
                      {showAddVegetable && (
                        <div className="p-3 border rounded-lg bg-background space-y-2">
                          <div>
                            <Label className="text-xs">Tipo de Verdura</Label>
                            <Select
                              value={newVegetable.name}
                              onValueChange={(value) => {
                                const vegOption = VEGETABLE_OPTIONS.find(v => v.name === value);
                                setNewVegetable({
                                  name: value,
                                  kg: newVegetable.kg,
                                  pricePerKg: vegOption?.pricePerKg || 0
                                });
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                {VEGETABLE_OPTIONS.map((veg) => (
                                  <SelectItem key={veg.name} value={veg.name}>
                                    {veg.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Kilogramos</Label>
                              <Input
                                type="number"
                                step="0.1"
                                className="h-8"
                                value={newVegetable.kg || ''}
                                onChange={(e) => setNewVegetable({ ...newVegetable, kg: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Precio/Kg</Label>
                              <Input
                                type="number"
                                step="0.01"
                                className="h-8"
                                value={newVegetable.pricePerKg || ''}
                                onChange={(e) => setNewVegetable({ ...newVegetable, pricePerKg: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          {newVegetable.kg > 0 && newVegetable.pricePerKg > 0 && (
                            <p className="text-xs text-green-600 font-semibold">
                              Total: S/ {(newVegetable.kg * newVegetable.pricePerKg).toFixed(2)}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowAddVegetable(false);
                                setNewVegetable({ name: '', kg: 0, pricePerKg: 0 });
                              }}
                              className="flex-1 h-7 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAddVegetable}
                              className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                            >
                              Agregar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Verduras ya registradas */}
                      {event.expenses?.filter(e => e.isPredetermined && e.category === 'verduras' && !e.description.toLowerCase().includes('ají')).length > 0 && (
                        <div className="space-y-1 mt-2">
                          <p className="text-xs text-muted-foreground">Registradas:</p>
                          {event.expenses.filter(e => e.isPredetermined && e.category === 'verduras' && !e.description.toLowerCase().includes('ají')).map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-2 bg-green-500/10 rounded text-sm">
                              <div className="flex-1">
                                <p className="font-medium text-xs">{expense.description}</p>
                              </div>
                              <p className="font-semibold text-green-600 text-xs">S/ {expense.amount.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AJÍES - Solo si aplica */}
                  {!isCoordinador && selectedDish && dishRequiresChili(selectedDish) && (
                    <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-red-700">Ajíes</Label>
                        {canEdit && (
                          <Button
                            onClick={() => setShowAddChili(true)}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        )}
                      </div>

                      {/* Ajíes pendientes */}
                      {selectedChilis.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <p className="text-xs text-muted-foreground">Pendientes de registro:</p>
                          {selectedChilis.map((chili, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                              <div className="flex-1">
                                <p className="font-medium">{chili.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {chili.kg} kg × S/ {chili.pricePerKg}/kg
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-red-600">S/ {chili.total.toFixed(2)}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteChili(index)}
                                  className="h-6 w-6 p-0 text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            onClick={handleSaveChilis}
                            size="sm"
                            className="w-full bg-red-600 hover:bg-red-700"
                          >
                            <Save className="h-3 w-3 mr-2" />
                            Registrar Ajíes (S/ {selectedChilis.reduce((sum, c) => sum + c.total, 0).toFixed(2)})
                          </Button>
                        </div>
                      )}

                      {/* Formulario agregar ají */}
                      {showAddChili && (
                        <div className="p-3 border rounded-lg bg-background space-y-2">
                          <div>
                            <Label className="text-xs">Tipo de Ají</Label>
                            <Select
                              value={newChili.name}
                              onValueChange={(value) => {
                                const chiliOption = CHILI_OPTIONS.find(c => c.name === value);
                                setNewChili({
                                  name: value,
                                  kg: newChili.kg,
                                  pricePerKg: chiliOption?.pricePerKg || 0
                                });
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                {CHILI_OPTIONS.map((chili) => (
                                  <SelectItem key={chili.name} value={chili.name}>
                                    {chili.name} - S/ {chili.pricePerKg}/kg
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Kilogramos</Label>
                              <Input
                                type="number"
                                step="0.1"
                                className="h-8"
                                value={newChili.kg || ''}
                                onChange={(e) => setNewChili({ ...newChili, kg: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Precio/Kg</Label>
                              <Input
                                type="number"
                                step="0.01"
                                className="h-8"
                                value={newChili.pricePerKg || ''}
                                onChange={(e) => setNewChili({ ...newChili, pricePerKg: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          {newChili.kg > 0 && newChili.pricePerKg > 0 && (
                            <p className="text-xs text-red-600 font-semibold">
                              Total: S/ {(newChili.kg * newChili.pricePerKg).toFixed(2)}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowAddChili(false);
                                setNewChili({ name: '', kg: 0, pricePerKg: 0 });
                              }}
                              className="flex-1 h-7 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAddChili}
                              className="flex-1 h-7 text-xs bg-red-600 hover:bg-red-700"
                            >
                              Agregar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Ajíes registrados */}
                      {event.expenses?.filter(e => e.isPredetermined && e.category === 'verduras' && e.description.toLowerCase().includes('ají')).length > 0 && (
                        <div className="space-y-1 mt-2">
                          <p className="text-xs text-muted-foreground">Registrados:</p>
                          {event.expenses.filter(e => e.isPredetermined && e.category === 'verduras' && e.description.toLowerCase().includes('ají')).map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-2 bg-red-500/10 rounded text-sm">
                              <div className="flex-1">
                                <p className="font-medium text-xs">{expense.description}</p>
                              </div>
                              <p className="font-semibold text-red-600 text-xs">S/ {expense.amount.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* INGREDIENTES DINÁMICOS DEL PLATO */}
                  {dynamicIngredients.map((ingredient) => {
                    const isRegistered = registeredDynamicIngredients[ingredient.id];
                    const values = dynamicIngredientValues[ingredient.id] || { cantidad: 0, costoUnitario: 0 };
                    const total = values.cantidad * values.costoUnitario;
                    
                    // Buscar el gasto registrado para este ingrediente
                    const registeredExpense = event.expenses?.find(e => 
                      e.isPredetermined && 
                      e.description.includes(ingredient.description) &&
                      e.description.includes(selectedDish)
                    );

                    return (
                      <div key={ingredient.id} className={`p-3 border rounded-lg ${isRegistered ? 'bg-green-500/5 border-green-500/30' : 'bg-primary/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{ingredient.description}</h4>
                              {isRegistered && registeredExpense && (
                                <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                                  ✓ {registeredExpense.registeredByName || 'Registrado'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Sugerido: {ingredient.cantidad.toFixed(2)} {ingredient.unit} × S/ {ingredient.costoUnitario.toFixed(2)}/{ingredient.unit}
                            </p>
                          </div>
                          {isRegistered && registeredExpense && (
                            <p className="text-lg font-bold text-green-600">S/ {registeredExpense.amount.toFixed(2)}</p>
                          )}
                        </div>

                        {canEdit && !isRegistered && (
                          <>
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                              <div>
                                <Label className="text-xs">Cantidad</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={values.cantidad || ''}
                                  onChange={(e) => handleDynamicIngredientChange(ingredient.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                  className="h-8 text-sm"
                                  min="0"
                                />
                                <p className="text-xs text-muted-foreground mt-0.5">{ingredient.unit}</p>
                              </div>
                              <div>
                                <Label className="text-xs">Costo Unitario (S/)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={values.costoUnitario || ''}
                                  onChange={(e) => handleDynamicIngredientChange(ingredient.id, 'costoUnitario', parseFloat(e.target.value) || 0)}
                                  className="h-8 text-sm"
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Total</Label>
                                <Input
                                  value={`S/ ${total.toFixed(2)}`}
                                  disabled
                                  className="h-8 text-sm font-bold bg-muted"
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleRegisterDynamicIngredient(ingredient)}
                              className="w-full mt-2 bg-gradient-primary"
                              disabled={values.cantidad <= 0 || values.costoUnitario <= 0}
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
      {/* Ocultar para Coordinador y Encargado de Compras */}
      {!isCoordinador && !isEncargadoCompras && event.beverages && event.beverages.length > 0 && (
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
                    onClick={() => setShowAddBeverage(!showAddBeverage)}
                    variant={showAddBeverage ? 'outline' : 'default'}
                    className="h-8 px-3"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showAddBeverage ? 'Cancelar' : 'Añadir Bebida'}
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
          <CardContent className="space-y-3">
            {/* Formulario para añadir bebida */}
            {showAddBeverage && (
              <div className="p-4 border-2 border-blue-500/30 rounded-lg bg-blue-500/5">
                <h4 className="font-semibold mb-3 text-sm">Añadir Nueva Bebida</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Tipo de Bebida *</Label>
                    <Select
                      value={newBeverage.tipo}
                      onValueChange={(value: any) => setNewBeverage({ ...newBeverage, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gaseosa">Gaseosa</SelectItem>
                        <SelectItem value="agua">Agua</SelectItem>
                        <SelectItem value="champan">Champán</SelectItem>
                        <SelectItem value="vino">Vino</SelectItem>
                        <SelectItem value="cerveza">Cerveza</SelectItem>
                        <SelectItem value="coctel">Cóctel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(newBeverage.tipo === 'gaseosa' || newBeverage.tipo === 'agua' || newBeverage.tipo === 'champan' || newBeverage.tipo === 'vino') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Cantidad *</Label>
                        <Input
                          type="number"
                          placeholder="Unidades"
                          value={newBeverage.cantidad || ''}
                          onChange={(e) => setNewBeverage({ ...newBeverage, cantidad: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Precio por Unidad (S/) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Precio"
                          value={newBeverage.precioUnitario || ''}
                          onChange={(e) => setNewBeverage({ ...newBeverage, precioUnitario: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cerveza */}
                  {newBeverage.tipo === 'cerveza' && (
                    <div className="space-y-3 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                      <div>
                        <Label className="text-xs">Modalidad</Label>
                        <Select
                          value={newBeverage.modalidad || 'cover'}
                          onValueChange={(value: 'cover' | 'compra_local') => setNewBeverage({ ...newBeverage, modalidad: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="compra_local">Compra en el Local</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newBeverage.modalidad === 'cover' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Número de Cajas</Label>
                            <Input
                              type="number"
                              placeholder=""
                              value={newBeverage.numeroCajas || ''}
                              onChange={(e) => setNewBeverage({ ...newBeverage, numeroCajas: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Costo por Caja (S/)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder=""
                              value={newBeverage.costoPorCaja || ''}
                              onChange={(e) => setNewBeverage({ ...newBeverage, costoPorCaja: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      )}

                      {newBeverage.modalidad === 'compra_local' && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Cantidad (Cajas)</Label>
                            <Input
                              type="number"
                              placeholder=""
                              value={newBeverage.cantidad || ''}
                              onChange={(e) => setNewBeverage({ ...newBeverage, cantidad: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Costo Caja (Local) S/</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder=""
                                value={newBeverage.costoCajaLocal || ''}
                                onChange={(e) => setNewBeverage({ ...newBeverage, costoCajaLocal: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Costo Caja (Cliente) S/</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder=""
                                value={newBeverage.costoCajaCliente || ''}
                                onChange={(e) => setNewBeverage({ ...newBeverage, costoCajaCliente: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div className="p-2 bg-green-500/10 rounded">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">Utilidad por Caja:</span>
                              <span className="font-bold text-green-700">
                                S/ {((newBeverage.costoCajaCliente || 0) - (newBeverage.costoCajaLocal || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cócteles */}
                  {newBeverage.tipo === 'coctel' && (
                    <div className="space-y-3 p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
                      <div>
                        <Label className="text-xs">Modalidad</Label>
                        <Select
                          value={newBeverage.modalidad || 'cover'}
                          onValueChange={(value: 'cover' | 'compra_local') => setNewBeverage({ ...newBeverage, modalidad: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="compra_local">Compra en el Local</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newBeverage.modalidad === 'cover' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Número de Cócteles</Label>
                            <Input
                              type="number"
                              placeholder=""
                              value={newBeverage.cantidad || ''}
                              onChange={(e) => setNewBeverage({ ...newBeverage, cantidad: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Costo por Cóctel (S/)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder=""
                              value={newBeverage.costoPorCaja || ''}
                              onChange={(e) => setNewBeverage({ ...newBeverage, costoPorCaja: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      )}

                      {newBeverage.modalidad === 'compra_local' && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Cantidad (Cócteles)</Label>
                            <Input
                              type="number"
                              placeholder=""
                              value={newBeverage.cantidad || ''}
                              onChange={(e) => setNewBeverage({ ...newBeverage, cantidad: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Costo Cóctel (Local) S/</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder=""
                                value={newBeverage.costoCoctelLocal || ''}
                                onChange={(e) => setNewBeverage({ ...newBeverage, costoCoctelLocal: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Costo Cóctel (Cliente) S/</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder=""
                                value={newBeverage.costoCoctelCliente || ''}
                                onChange={(e) => setNewBeverage({ ...newBeverage, costoCoctelCliente: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div className="p-2 bg-green-500/10 rounded">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">Utilidad por Cóctel:</span>
                              <span className="font-bold text-green-700">
                                S/ {((newBeverage.costoCoctelCliente || 0) - (newBeverage.costoCoctelLocal || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddBeverage(false);
                        setNewBeverage({ tipo: 'gaseosa', cantidad: 0, precioUnitario: 0 });
                      }}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBeverage}
                      className="flex-1 bg-gradient-primary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Bebida
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de bebidas */}
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
                            ? `Cover - ${bev.cantidad || 0} cócteles × S/ ${bev.costoPorCaja || 0}`
                            : `Local - ${bev.cantidad || 0} cócteles × S/ ${bev.costoCoctelLocal || 0}`
                          : ''
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
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
                              ? ((bev.cantidad || 0) * (bev.costoPorCaja || 0)).toFixed(2)
                              : ((bev.cantidad || 0) * (bev.costoCoctelLocal || 0)).toFixed(2)
                            : '0.00'
                        }
                      </p>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBeverage(idx)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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