import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Save, Edit, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';

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

export default function Finanzas() {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [showAddBalance, setShowAddBalance] = useState(false);
  
  const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleDateString('es-ES', { month: 'long' });
  
  const [currentGeneralExpense, setCurrentGeneralExpense] = useState<Omit<GeneralExpense, 'id' | 'registeredBy' | 'registeredAt'>>({
    luz: 0,
    personalFijo: 0,
    agua: 0,
    internet: 0,
    vigilante: 0,
    alcabala: 0,
    mes: currentMonthName,
    año: currentYear,
  });

  const [newBalance, setNewBalance] = useState({
    eventName: '',
    balanceAntes: 0,
    balanceDespues: 0,
    fecha: new Date().toISOString().split('T')[0],
  });

  // Load data from localStorage
  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = () => {
    const storedExpenses = JSON.parse(localStorage.getItem('general_expenses') || '[]');
    const storedBalances = JSON.parse(localStorage.getItem('account_balances') || '[]');
    
    setGeneralExpenses(storedExpenses);
    setAccountBalances(storedBalances);
    
    // Load current month expenses if exists
    const currentMonthExpense = storedExpenses.find(
      (e: GeneralExpense) => e.mes === currentMonthName && e.año === currentYear
    );
    
    if (currentMonthExpense) {
      setCurrentGeneralExpense({
        luz: currentMonthExpense.luz,
        personalFijo: currentMonthExpense.personalFijo,
        agua: currentMonthExpense.agua,
        internet: currentMonthExpense.internet,
        vigilante: currentMonthExpense.vigilante,
        alcabala: currentMonthExpense.alcabala,
        mes: currentMonthExpense.mes,
        año: currentMonthExpense.año,
      });
    }
  };

  const calculateTotalGeneralExpenses = () => {
    return (
      currentGeneralExpense.luz +
      currentGeneralExpense.personalFijo +
      currentGeneralExpense.agua +
      currentGeneralExpense.internet +
      currentGeneralExpense.vigilante +
      currentGeneralExpense.alcabala
    );
  };

  const handleSaveGeneralExpenses = () => {
    const existingIndex = generalExpenses.findIndex(
      (e) => e.mes === currentMonthName && e.año === currentYear
    );

    const expenseToSave: GeneralExpense = {
      id: existingIndex !== -1 ? generalExpenses[existingIndex].id : Date.now(),
      ...currentGeneralExpense,
      registeredBy: `${user?.name} ${user?.last_name}`,
      registeredAt: new Date().toISOString(),
    };

    let updatedExpenses;
    if (existingIndex !== -1) {
      updatedExpenses = [...generalExpenses];
      updatedExpenses[existingIndex] = expenseToSave;
    } else {
      updatedExpenses = [...generalExpenses, expenseToSave];
    }

    setGeneralExpenses(updatedExpenses);
    localStorage.setItem('general_expenses', JSON.stringify(updatedExpenses));
    setIsEditingGeneral(false);
    toast.success('Gastos generales guardados correctamente');
  };

  const handleAddBalance = () => {
    const balance: AccountBalance = {
      id: Date.now(),
      eventId: Date.now(),
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
      eventName: '',
      balanceAntes: 0,
      balanceDespues: 0,
      fecha: new Date().toISOString().split('T')[0],
    });
    setShowAddBalance(false);
    toast.success('Balance registrado correctamente');
  };

  const totalExpensesAllTime = generalExpenses.reduce(
    (sum, exp) => sum + exp.luz + exp.personalFijo + exp.agua + exp.internet + exp.vigilante + exp.alcabala,
    0
  );

  const totalBalanceDifference = accountBalances.reduce((sum, bal) => sum + bal.diferencia, 0);

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
                {currentMonth}
              </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Gastos Generales (Mes Actual)
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
                      <div>
                        <CardTitle>Gastos Generales - {currentMonth}</CardTitle>
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
                                  loadFinancialData();
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
                          .sort((a, b) => b.año - a.año)
                          .map((expense) => (
                            <div
                              key={expense.id}
                              className="p-3 border rounded-lg flex items-center justify-between"
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
                            <Label htmlFor="eventName">Nombre del Evento</Label>
                            <Input
                              id="eventName"
                              value={newBalance.eventName}
                              onChange={(e) => setNewBalance({ ...newBalance, eventName: e.target.value })}
                              placeholder="Ej: Boda de Juan y María"
                            />
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
                            <Label htmlFor="fecha">Fecha del Evento</Label>
                            <Input
                              id="fecha"
                              type="date"
                              value={newBalance.fecha}
                              onChange={(e) => setNewBalance({ ...newBalance, fecha: e.target.value })}
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
                            disabled={!newBalance.eventName}
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
