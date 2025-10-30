import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popup';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Save, X, Plus, Calendar, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { Event } from '@/types/events';

interface GeneralExpenseItem {
  id: number;
  tipo: 'luz' | 'personalFijo' | 'agua' | 'internet' | 'vigilante' | 'alcabala';
  monto: number;
  mes: string;
  año: number;
  registeredBy: string;
  registeredAt: string;
}

interface GeneralExpense {
  id: number;
  luz: number;
  personalFijo: number;
  agua: number;
  internet: number;
  vigilante: number;
  alcabala: number;
  mes: string;
  año: number;
  registeredBy: string;
  registeredAt: string;
}

interface AccountBalance {
  id: number;
  eventId: number;
  eventName: string;
  balanceAntes: number;
  balanceDespues: number;
  fecha: string;
  diferencia: number;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const EXPENSE_TYPES = [
  { key: 'luz', label: 'Luz', icon: '💡' },
  { key: 'agua', label: 'Agua', icon: '💧' },
  { key: 'internet', label: 'Internet', icon: '🌐' },
  { key: 'personalFijo', label: 'Personal Fijo', icon: '👥' },
  { key: 'vigilante', label: 'Vigilante', icon: '🛡️' },
  { key: 'alcabala', label: 'Alcabala', icon: '🏢' },
] as const;

export default function Finanzas() {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const [generalExpenseItems, setGeneralExpenseItems] = useState<GeneralExpenseItem[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [monthSelectorOpen, setMonthSelectorOpen] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = MESES[currentMonthIndex];
  
  // Estado para el mes/año seleccionado
  const [selectedMes, setSelectedMes] = useState(currentMonthName);
  const [selectedAño, setSelectedAño] = useState(currentYear);
  
  // Estado para cada input de gasto individual
  const [expenseInputs, setExpenseInputs] = useState<{[key: string]: number}>({
    luz: 0,
    agua: 0,
    internet: 0,
    personalFijo: 0,
    vigilante: 0,
    alcabala: 0,
  });

  const [newBalance, setNewBalance] = useState({
    eventId: 0,
    eventName: '',
    balanceAntes: 0,
    balanceDespues: 0,
    fecha: new Date().toISOString().split('T')[0],
  });

  // Load data from localStorage
  useEffect(() => {
    loadFinancialData();
    loadEvents();
  }, []);

  const loadFinancialData = () => {
    const storedExpenseItems = JSON.parse(localStorage.getItem('general_expense_items') || '[]');
    const storedBalances = JSON.parse(localStorage.getItem('account_balances') || '[]');
    
    setGeneralExpenseItems(storedExpenseItems);
    setAccountBalances(storedBalances);
  };

  const loadEvents = () => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    setAvailableEvents(storedEvents);
  };

  const handleRegisterExpense = (tipo: 'luz' | 'personalFijo' | 'agua' | 'internet' | 'vigilante' | 'alcabala') => {
    const monto = expenseInputs[tipo];
    
    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    const newItem: GeneralExpenseItem = {
      id: Date.now(),
      tipo,
      monto,
      mes: selectedMes,
      año: selectedAño,
      registeredBy: `${user?.name} ${user?.last_name}`,
      registeredAt: new Date().toISOString(),
    };

    const updatedItems = [...generalExpenseItems, newItem];
    setGeneralExpenseItems(updatedItems);
    localStorage.setItem('general_expense_items', JSON.stringify(updatedItems));
    
    // Reset input
    setExpenseInputs(prev => ({ ...prev, [tipo]: 0 }));
    
    toast.success(`${EXPENSE_TYPES.find(t => t.key === tipo)?.label} registrado correctamente`);
  };

  const calculateTotalForMonth = () => {
    return generalExpenseItems
      .filter(item => item.mes === selectedMes && item.año === selectedAño)
      .reduce((sum, item) => sum + item.monto, 0);
  };

  const getHistoryForType = (tipo: string) => {
    return generalExpenseItems
      .filter(item => item.tipo === tipo && item.mes === selectedMes && item.año === selectedAño)
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  };

  const handleEventSelect = (eventId: string) => {
    const selectedEvent = availableEvents.find(e => e.id === parseInt(eventId));
    if (selectedEvent) {
      setNewBalance({
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        balanceAntes: newBalance.balanceAntes,
        balanceDespues: newBalance.balanceDespues,
        fecha: selectedEvent.date.split('T')[0],
      });
    }
  };

  const handleAddBalance = () => {
    if (!newBalance.eventName || newBalance.eventId === 0) {
      toast.error('Por favor selecciona un evento');
      return;
    }

    const balance: AccountBalance = {
      id: Date.now(),
      eventId: newBalance.eventId,
      eventName: newBalance.eventName,
      balanceAntes: newBalance.balanceAntes,
      balanceDespues: newBalance.balanceDespues,
      diferencia: newBalance.balanceDespues - newBalance.balanceAntes,
      fecha: newBalance.fecha,
    };

    const updatedBalances = [...accountBalances, balance];
    setAccountBalances(updatedBalances);
    localStorage.setItem('account_balances', JSON.stringify(updatedBalances));
    
    setNewBalance({
      eventId: 0,
      eventName: '',
      balanceAntes: 0,
      balanceDespues: 0,
      fecha: new Date().toISOString().split('T')[0],
    });
    setShowAddBalance(false);
    toast.success('Balance registrado correctamente');
  };

  const totalExpensesAllTime = generalExpenseItems.reduce((sum, item) => sum + item.monto, 0);
  const totalBalanceDifference = accountBalances.reduce((sum, bal) => sum + bal.diferencia, 0);

  // Generate years for selector (current year and 2 years back/forward)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Check permissions
  const canEdit = userRole === 'admin' || userRole === 'socio';

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Finanzas</h1>
                <p className="text-muted-foreground">Gestión financiera y gastos generales</p>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                {selectedMes.charAt(0).toUpperCase() + selectedMes.slice(1)} {selectedAño}
              </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Gastos Generales (Mes Seleccionado)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">
                    S/ {calculateTotalGeneralExpenses().toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Gastos Generales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-warning">
                    S/ {totalExpensesAllTime.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Balance Total (Eventos)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${totalBalanceDifference >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {totalBalanceDifference >= 0 ? '+' : ''} S/ {totalBalanceDifference.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Gastos Generales</TabsTrigger>
                <TabsTrigger value="balances">Balance por Evento</TabsTrigger>
              </TabsList>

              {/* Gastos Generales Tab */}
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle>Gastos Generales</CardTitle>
                        <CardDescription>
                          Registra los gastos fijos mensuales del negocio
                        </CardDescription>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2">
                          {isEditingGeneral ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEditingGeneral(false);
                                  loadExpenseForMonth(selectedMes, selectedAño);
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveGeneralExpenses}
                                className="bg-gradient-primary"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Guardar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setIsEditingGeneral(true)}
                              className="bg-gradient-primary"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Month/Year Selector */}
                    <div className="flex gap-3 mt-4">
                      <div className="flex-1">
                        <Label className="text-xs">Mes</Label>
                        <Select value={selectedMes} onValueChange={setSelectedMes}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MESES.map((mes) => (
                              <SelectItem key={mes} value={mes}>
                                {mes.charAt(0).toUpperCase() + mes.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Año</Label>
                        <Select value={selectedAño.toString()} onValueChange={(val) => setSelectedAño(parseInt(val))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="luz">Luz (S/)</Label>
                        <Input
                          id="luz"
                          type="number"
                          step="0.01"
                          value={currentGeneralExpense.luz}
                          onChange={(e) =>
                            setCurrentGeneralExpense({ ...currentGeneralExpense, luz: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!isEditingGeneral}
                          className={!isEditingGeneral ? 'bg-muted' : ''}
                        />
                      </div>

                      <div>
                        <Label htmlFor="agua">Agua (S/)</Label>
                        <Input
                          id="agua"
                          type="number"
                          step="0.01"
                          value={currentGeneralExpense.agua}
                          onChange={(e) =>
                            setCurrentGeneralExpense({ ...currentGeneralExpense, agua: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!isEditingGeneral}
                          className={!isEditingGeneral ? 'bg-muted' : ''}
                        />
                      </div>

                      <div>
                        <Label htmlFor="internet">Internet (S/)</Label>
                        <Input
                          id="internet"
                          type="number"
                          step="0.01"
                          value={currentGeneralExpense.internet}
                          onChange={(e) =>
                            setCurrentGeneralExpense({ ...currentGeneralExpense, internet: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!isEditingGeneral}
                          className={!isEditingGeneral ? 'bg-muted' : ''}
                        />
                      </div>

                      <div>
                        <Label htmlFor="personalFijo">Personal Fijo (S/)</Label>
                        <Input
                          id="personalFijo"
                          type="number"
                          step="0.01"
                          value={currentGeneralExpense.personalFijo}
                          onChange={(e) =>
                            setCurrentGeneralExpense({ ...currentGeneralExpense, personalFijo: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!isEditingGeneral}
                          className={!isEditingGeneral ? 'bg-muted' : ''}
                        />
                      </div>

                      <div>
                        <Label htmlFor="vigilante">Vigilante (S/)</Label>
                        <Input
                          id="vigilante"
                          type="number"
                          step="0.01"
                          value={currentGeneralExpense.vigilante}
                          onChange={(e) =>
                            setCurrentGeneralExpense({ ...currentGeneralExpense, vigilante: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!isEditingGeneral}
                          className={!isEditingGeneral ? 'bg-muted' : ''}
                        />
                      </div>

                      <div>
                        <Label htmlFor="alcabala">Alcabala (S/)</Label>
                        <Input
                          id="alcabala"
                          type="number"
                          step="0.01"
                          value={currentGeneralExpense.alcabala}
                          onChange={(e) =>
                            setCurrentGeneralExpense({ ...currentGeneralExpense, alcabala: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!isEditingGeneral}
                          className={!isEditingGeneral ? 'bg-muted' : ''}
                        />
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Total Gastos Generales:</span>
                        <span className="text-2xl font-bold text-destructive">
                          S/ {calculateTotalGeneralExpenses().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Historical General Expenses */}
                {generalExpenses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Gastos Generales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {generalExpenses
                          .sort((a, b) => {
                            if (a.año !== b.año) return b.año - a.año;
                            return MESES.indexOf(b.mes) - MESES.indexOf(a.mes);
                          })
                          .map((expense) => (
                            <div
                              key={expense.id}
                              className="p-3 border rounded-lg flex items-center justify-between hover:bg-accent/50 transition-colors"
                            >
                              <div>
                                <p className="font-semibold">
                                  {expense.mes.charAt(0).toUpperCase() + expense.mes.slice(1)} {expense.año}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Registrado por: {expense.registeredBy}
                                </p>
                              </div>
                              <p className="text-lg font-bold text-destructive">
                                S/ {(expense.luz + expense.personalFijo + expense.agua + expense.internet + expense.vigilante + expense.alcabala).toLocaleString()}
                              </p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Balance por Evento Tab */}
              <TabsContent value="balances" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Balance de Cuenta por Evento</CardTitle>
                        <CardDescription>
                          Registra el balance antes y después de cada evento
                        </CardDescription>
                      </div>
                      {canEdit && !showAddBalance && (
                        <Button
                          size="sm"
                          onClick={() => setShowAddBalance(true)}
                          className="bg-gradient-primary"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Balance
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showAddBalance && (
                      <div className="mb-6 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                        <h3 className="font-semibold mb-4">Nuevo Balance de Evento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="eventSelect">Seleccionar Evento</Label>
                            <Select 
                              value={newBalance.eventId.toString()} 
                              onValueChange={handleEventSelect}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un evento" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableEvents.length === 0 ? (
                                  <SelectItem value="0" disabled>
                                    No hay eventos disponibles
                                  </SelectItem>
                                ) : (
                                  availableEvents.map((event) => (
                                    <SelectItem key={event.id} value={event.id.toString()}>
                                      {event.name} - {new Date(event.date).toLocaleDateString('es-ES')}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="balanceAntes">Balance Antes del Evento (S/)</Label>
                            <Input
                              id="balanceAntes"
                              type="number"
                              step="0.01"
                              value={newBalance.balanceAntes}
                              onChange={(e) =>
                                setNewBalance({ ...newBalance, balanceAntes: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="balanceDespues">Balance Después del Evento (S/)</Label>
                            <Input
                              id="balanceDespues"
                              type="number"
                              step="0.01"
                              value={newBalance.balanceDespues}
                              onChange={(e) =>
                                setNewBalance({ ...newBalance, balanceDespues: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>

                          <div className="col-span-2">
                            <Label htmlFor="fecha" className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Fecha del Evento (Auto-llenado)
                            </Label>
                            <Input
                              id="fecha"
                              type="date"
                              value={newBalance.fecha}
                              disabled
                              className="bg-muted"
                            />
                          </div>

                          <div className="col-span-2 p-3 bg-background rounded-lg border">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Diferencia:</span>
                              <span
                                className={`text-xl font-bold ${
                                  newBalance.balanceDespues - newBalance.balanceAntes >= 0
                                    ? 'text-success'
                                    : 'text-destructive'
                                }`}
                              >
                                {newBalance.balanceDespues - newBalance.balanceAntes >= 0 ? '+' : ''}S/{' '}
                                {(newBalance.balanceDespues - newBalance.balanceAntes).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddBalance(false)}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddBalance}
                            className="flex-1 bg-gradient-primary"
                            disabled={!newBalance.eventName || newBalance.eventId === 0}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Balance
                          </Button>
                        </div>
                      </div>
                    )}

                    {accountBalances.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay balances registrados aún</p>
                        <p className="text-sm">Agrega el primer balance de evento</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {accountBalances
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                          .map((balance) => (
                            <div
                              key={balance.id}
                              className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{balance.eventName}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(balance.fecha).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    {balance.diferencia >= 0 ? (
                                      <TrendingUp className="h-5 w-5 text-success" />
                                    ) : (
                                      <TrendingDown className="h-5 w-5 text-destructive" />
                                    )}
                                    <span
                                      className={`text-xl font-bold ${
                                        balance.diferencia >= 0 ? 'text-success' : 'text-destructive'
                                      }`}
                                    >
                                      {balance.diferencia >= 0 ? '+' : ''}S/ {balance.diferencia.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                                <div>
                                  <p className="text-xs text-muted-foreground">Balance Antes</p>
                                  <p className="text-base font-semibold">S/ {balance.balanceAntes.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Balance Después</p>
                                  <p className="text-base font-semibold">S/ {balance.balanceDespues.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
