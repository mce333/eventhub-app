import { PredeterminedExpense, FoodDetails, EventExpense } from '@/types/events';

/**
 * Calcula gastos predeterminados basados en la cantidad de platos
 * Por cada 100 platos:
 * - 100 cuartos de pollo
 * - 100 salchichas
 * - 100 papas
 * - 100 porciones de verduras
 */
export function calculatePredeterminedExpenses(
  foodDetails: FoodDetails
): PredeterminedExpense[] {
  const { cantidadDePlatos, incluyeCerveza } = foodDetails;
  
  const expenses: PredeterminedExpense[] = [
    {
      category: 'pollo',
      description: 'Cuartos de pollo',
      cantidad: cantidadDePlatos,
      baseUnit: 'platos',
    },
    {
      category: 'salchichas',
      description: 'Salchichas',
      cantidad: cantidadDePlatos,
      baseUnit: 'platos',
    },
    {
      category: 'papas',
      description: 'Papas',
      cantidad: cantidadDePlatos,
      baseUnit: 'platos',
    },
    {
      category: 'verduras',
      description: 'Porciones de verduras',
      cantidad: cantidadDePlatos,
      baseUnit: 'platos',
    },
  ];

  // Si incluye cerveza, agregar al cálculo
  if (incluyeCerveza) {
    expenses.push({
      category: 'cerveza',
      description: 'Cervezas',
      cantidad: Math.ceil(cantidadDePlatos * 1.5), // 1.5 cervezas por persona
      baseUnit: 'platos',
    });
  }

  return expenses;
}

/**
 * Convierte gastos predeterminados a EventExpense
 */
export function convertToEventExpenses(
  predeterminedExpenses: PredeterminedExpense[],
  userId: number,
  userName: string
): Omit<EventExpense, 'id' | 'amount' | 'date' | 'receipt'>[] {
  return predeterminedExpenses.map((expense) => ({
    category: expense.category,
    description: expense.description,
    cantidad: expense.cantidad,
    costoUnitario: 0, // El encargado de compras lo completará
    registeredBy: userId,
    registeredByName: userName,
    registeredAt: new Date().toISOString(),
    isPredetermined: true,
  }));
}

/**
 * Calcula el total de gastos
 */
export function calculateTotalExpenses(expenses: EventExpense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

/**
 * Valida que los gastos predeterminados estén completos
 */
export function validatePredeterminedExpenses(
  expenses: EventExpense[]
): { isValid: boolean; missingExpenses: string[] } {
  const requiredCategories = ['pollo', 'salchichas', 'papas', 'verduras'];
  const predeterminedExpenses = expenses.filter((e) => e.isPredetermined);
  
  const missingExpenses = requiredCategories.filter(
    (category) =>
      !predeterminedExpenses.some((e) => e.category === category && e.costoUnitario > 0)
  );

  return {
    isValid: missingExpenses.length === 0,
    missingExpenses,
  };
}

/**
 * Calcula el costo total de un gasto
 */
export function calculateExpenseAmount(cantidad: number, costoUnitario: number): number {
  return cantidad * costoUnitario;
}