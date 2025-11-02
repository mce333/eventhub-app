import { ExpenseCategory } from '@/types/events';

export interface Ingredient {
  name: string;
  quantityPerPortion: number;
  unit: string;
  category: ExpenseCategory;
  estimatedCost: number; // Costo unitario estimado
  isVegetable?: boolean; // Si es una verdura seleccionable
  isChili?: boolean; // Si es un tipo de ají
}

export interface DishIngredients {
  dishId: string;
  dishName: string;
  ingredients: Ingredient[];
}

// Base de datos de insumos por plato
export const DISH_INGREDIENTS: DishIngredients[] = [
  {
    dishId: 'pollo-parrilla',
    dishName: 'Pollo a la Parrilla',
    ingredients: [
      { name: 'Cuarto de pollo', quantityPerPortion: 1, unit: 'unidad', category: 'pollo', estimatedCost: 8.5 },
      { name: 'Papa', quantityPerPortion: 2, unit: 'unidad', category: 'verduras', estimatedCost: 0.5 },
      { name: 'Tomate', quantityPerPortion: 1, unit: 'unidad', category: 'verduras', estimatedCost: 0.3 },
      { name: 'Lechuga', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.2 },
      { name: 'Sal', quantityPerPortion: 5, unit: 'gramos', category: 'otros', estimatedCost: 0.02 },
      { name: 'Comino', quantityPerPortion: 2, unit: 'gramos', category: 'otros', estimatedCost: 0.05 },
      { name: 'Ajinomoto', quantityPerPortion: 1, unit: 'gramos', category: 'otros', estimatedCost: 0.03 },
      { name: 'Ají amarillo', quantityPerPortion: 10, unit: 'gramos', category: 'verduras', estimatedCost: 0.15 },
    ]
  },
  {
    dishId: 'carne-asada',
    dishName: 'Carne Asada',
    ingredients: [
      { name: 'Carne de res', quantityPerPortion: 250, unit: 'gramos', category: 'otros', estimatedCost: 12 },
      { name: 'Papa', quantityPerPortion: 2, unit: 'unidad', category: 'verduras', estimatedCost: 0.5 },
      { name: 'Tomate', quantityPerPortion: 1, unit: 'unidad', category: 'verduras', estimatedCost: 0.3 },
      { name: 'Lechuga', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.2 },
      { name: 'Cebolla', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.15 },
      { name: 'Sal', quantityPerPortion: 5, unit: 'gramos', category: 'otros', estimatedCost: 0.02 },
      { name: 'Pimienta', quantityPerPortion: 2, unit: 'gramos', category: 'otros', estimatedCost: 0.04 },
    ]
  },
  {
    dishId: 'pescado-frito',
    dishName: 'Pescado Frito',
    ingredients: [
      { name: 'Pescado fresco', quantityPerPortion: 300, unit: 'gramos', category: 'otros', estimatedCost: 10 },
      { name: 'Harina', quantityPerPortion: 30, unit: 'gramos', category: 'otros', estimatedCost: 0.1 },
      { name: 'Papa', quantityPerPortion: 2, unit: 'unidad', category: 'papas', estimatedCost: 0.5 },
      { name: 'Tomate', quantityPerPortion: 1, unit: 'unidad', category: 'verduras', estimatedCost: 0.3 },
      { name: 'Lechuga', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.2 },
      { name: 'Limón', quantityPerPortion: 2, unit: 'unidad', category: 'verduras', estimatedCost: 0.2 },
      { name: 'Aceite', quantityPerPortion: 50, unit: 'ml', category: 'otros', estimatedCost: 0.3 },
      { name: 'Sal', quantityPerPortion: 5, unit: 'gramos', category: 'otros', estimatedCost: 0.02 },
    ]
  },
  {
    dishId: 'lomo-saltado',
    dishName: 'Lomo Saltado',
    ingredients: [
      { name: 'Lomo de res', quantityPerPortion: 200, unit: 'gramos', category: 'otros', estimatedCost: 15 },
      { name: 'Papa', quantityPerPortion: 2, unit: 'unidad', category: 'papas', estimatedCost: 0.5 },
      { name: 'Tomate', quantityPerPortion: 2, unit: 'unidad', category: 'verduras', estimatedCost: 0.6 },
      { name: 'Cebolla', quantityPerPortion: 100, unit: 'gramos', category: 'verduras', estimatedCost: 0.3 },
      { name: 'Ají amarillo', quantityPerPortion: 15, unit: 'gramos', category: 'verduras', estimatedCost: 0.2 },
      { name: 'Arroz', quantityPerPortion: 100, unit: 'gramos', category: 'otros', estimatedCost: 0.3 },
      { name: 'Sillao', quantityPerPortion: 15, unit: 'ml', category: 'otros', estimatedCost: 0.1 },
      { name: 'Vinagre', quantityPerPortion: 10, unit: 'ml', category: 'otros', estimatedCost: 0.05 },
      { name: 'Aceite', quantityPerPortion: 30, unit: 'ml', category: 'otros', estimatedCost: 0.2 },
      { name: 'Sal', quantityPerPortion: 5, unit: 'gramos', category: 'otros', estimatedCost: 0.02 },
      { name: 'Comino', quantityPerPortion: 2, unit: 'gramos', category: 'otros', estimatedCost: 0.05 },
    ]
  },
  {
    dishId: 'arroz-pollo',
    dishName: 'Arroz con Pollo',
    ingredients: [
      { name: 'Cuarto de pollo', quantityPerPortion: 1, unit: 'unidad', category: 'pollo', estimatedCost: 8.5 },
      { name: 'Arroz', quantityPerPortion: 150, unit: 'gramos', category: 'otros', estimatedCost: 0.45 },
      { name: 'Arvejas', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.3 },
      { name: 'Zanahoria', quantityPerPortion: 30, unit: 'gramos', category: 'verduras', estimatedCost: 0.15 },
      { name: 'Pimiento', quantityPerPortion: 30, unit: 'gramos', category: 'verduras', estimatedCost: 0.2 },
      { name: 'Cebolla', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.15 },
      { name: 'Ajo', quantityPerPortion: 5, unit: 'gramos', category: 'verduras', estimatedCost: 0.05 },
      { name: 'Culantro', quantityPerPortion: 10, unit: 'gramos', category: 'verduras', estimatedCost: 0.1 },
      { name: 'Aceite', quantityPerPortion: 20, unit: 'ml', category: 'otros', estimatedCost: 0.15 },
      { name: 'Sal', quantityPerPortion: 5, unit: 'gramos', category: 'otros', estimatedCost: 0.02 },
      { name: 'Comino', quantityPerPortion: 2, unit: 'gramos', category: 'otros', estimatedCost: 0.05 },
    ]
  },
  {
    dishId: 'tallarines-rojos',
    dishName: 'Tallarines Rojos',
    ingredients: [
      { name: 'Tallarines', quantityPerPortion: 150, unit: 'gramos', category: 'otros', estimatedCost: 0.5 },
      { name: 'Salsa de tomate', quantityPerPortion: 100, unit: 'gramos', category: 'verduras', estimatedCost: 0.4 },
      { name: 'Carne molida', quantityPerPortion: 100, unit: 'gramos', category: 'otros', estimatedCost: 4 },
      { name: 'Cebolla', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.15 },
      { name: 'Ajo', quantityPerPortion: 5, unit: 'gramos', category: 'verduras', estimatedCost: 0.05 },
      { name: 'Zanahoria', quantityPerPortion: 30, unit: 'gramos', category: 'verduras', estimatedCost: 0.15 },
      { name: 'Aceite', quantityPerPortion: 15, unit: 'ml', category: 'otros', estimatedCost: 0.1 },
      { name: 'Sal', quantityPerPortion: 5, unit: 'gramos', category: 'otros', estimatedCost: 0.02 },
      { name: 'Orégano', quantityPerPortion: 2, unit: 'gramos', category: 'otros', estimatedCost: 0.03 },
      { name: 'Queso parmesano', quantityPerPortion: 20, unit: 'gramos', category: 'otros', estimatedCost: 0.8 },
    ]
  },
  {
    dishId: 'ceviche',
    dishName: 'Ceviche',
    ingredients: [
      { name: 'Pescado fresco', quantityPerPortion: 200, unit: 'gramos', category: 'otros', estimatedCost: 8 },
      { name: 'Limón', quantityPerPortion: 5, unit: 'unidad', category: 'verduras', estimatedCost: 0.5 },
      { name: 'Cebolla morada', quantityPerPortion: 80, unit: 'gramos', category: 'verduras', estimatedCost: 0.25 },
      { name: 'Ají limo', quantityPerPortion: 10, unit: 'gramos', category: 'verduras', estimatedCost: 0.2 },
      { name: 'Cilantro', quantityPerPortion: 10, unit: 'gramos', category: 'verduras', estimatedCost: 0.1 },
      { name: 'Camote', quantityPerPortion: 100, unit: 'gramos', category: 'verduras', estimatedCost: 0.3 },
      { name: 'Choclo', quantityPerPortion: 80, unit: 'gramos', category: 'verduras', estimatedCost: 0.4 },
      { name: 'Lechuga', quantityPerPortion: 30, unit: 'gramos', category: 'verduras', estimatedCost: 0.15 },
      { name: 'Sal', quantityPerPortion: 3, unit: 'gramos', category: 'otros', estimatedCost: 0.02 },
    ]
  },
  {
    dishId: 'parrillada-mixta',
    dishName: 'Parrillada Mixta',
    ingredients: [
      { name: 'Carne de res', quantityPerPortion: 150, unit: 'gramos', category: 'otros', estimatedCost: 9 },
      { name: 'Cuarto de pollo', quantityPerPortion: 0.5, unit: 'unidad', category: 'pollo', estimatedCost: 4.25 },
      { name: 'Salchicha', quantityPerPortion: 2, unit: 'unidad', category: 'salchichas', estimatedCost: 1.5 },
      { name: 'Chorizo', quantityPerPortion: 1, unit: 'unidad', category: 'otros', estimatedCost: 2 },
      { name: 'Papa', quantityPerPortion: 2, unit: 'unidad', category: 'papas', estimatedCost: 0.5 },
      { name: 'Tomate', quantityPerPortion: 2, unit: 'unidad', category: 'verduras', estimatedCost: 0.6 },
      { name: 'Lechuga', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.2 },
      { name: 'Cebolla', quantityPerPortion: 50, unit: 'gramos', category: 'verduras', estimatedCost: 0.15 },
      { name: 'Chimichurri', quantityPerPortion: 30, unit: 'ml', category: 'otros', estimatedCost: 0.3 },
      { name: 'Sal', quantityPerPortion: 5, unit: 'gramos', category: 'otros', estimatedCost: 0.02 },
    ]
  },
];

// Función para obtener insumos de un plato
export function getDishIngredients(dishId: string): DishIngredients | undefined {
  return DISH_INGREDIENTS.find(d => d.dishId === dishId);
}

// Función para calcular insumos totales basados en cantidad de platos
export function calculateTotalIngredients(dishId: string, numberOfPortions: number) {
  const dishData = getDishIngredients(dishId);
  if (!dishData) return null;

  return {
    dishName: dishData.dishName,
    portions: numberOfPortions,
    ingredients: dishData.ingredients.map(ingredient => ({
      ...ingredient,
      totalQuantity: ingredient.quantityPerPortion * numberOfPortions,
      totalCost: ingredient.estimatedCost * numberOfPortions,
    }))
  };
}

// Función para generar gastos predeterminados a partir de un plato
export function generatePredeterminedExpenses(dishId: string, numberOfPortions: number) {
  const calculation = calculateTotalIngredients(dishId, numberOfPortions);
  if (!calculation) return [];

  return calculation.ingredients.map((ingredient, index) => ({
    id: Date.now() + index,
    category: ingredient.category,
    description: `${ingredient.name} (${calculation.dishName})`,
    cantidad: ingredient.totalQuantity,
    costoUnitario: ingredient.estimatedCost,
    amount: ingredient.totalCost,
    date: new Date().toISOString().split('T')[0],
    registeredBy: 0,
    registeredByName: 'Sistema',
    registeredAt: new Date().toISOString(),
    isPredetermined: true,
  }));
}

// Opciones de verduras disponibles con precios por kilo
export const VEGETABLE_OPTIONS = [
  { name: 'Tomate', pricePerKg: 3.5 },
  { name: 'Lechuga', pricePerKg: 2.5 },
  { name: 'Zanahoria', pricePerKg: 2.0 },
  { name: 'Cebolla', pricePerKg: 3.0 },
  { name: 'Pimiento', pricePerKg: 4.0 },
  { name: 'Pepino', pricePerKg: 2.8 },
  { name: 'Culantro', pricePerKg: 5.0 },
];

// Opciones de ajíes disponibles con precios por kilo
export const CHILI_OPTIONS = [
  { name: 'Ají Rojo', pricePerKg: 8.0 },
  { name: 'Ají Amarillo', pricePerKg: 10.0 },
  { name: 'Ají Panka', pricePerKg: 12.0 },
  { name: 'Ají Limo', pricePerKg: 15.0 },
];

// Función para verificar si un plato requiere ajíes
export function dishRequiresChili(dishId: string): boolean {
  const chilliDishes = ['ceviche', 'lomo-saltado', 'pollo-parrilla', 'aji-gallina'];
  return chilliDishes.includes(dishId);
}

