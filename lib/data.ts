// Types
export interface Product {
  id: string
  name: string
  drug: string
  presentation: string
  category: 'Analgésicos' | 'Descartables' | 'Antiinflamatorios' | 'Antibióticos'
  stock: number
  minStock: number
  price: number
}

export interface CartItem extends Product {
  quantity: number
}

// Utility function for currency formatting
export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('es-AR')}`
}

// Mock data
export const initialProducts: Product[] = [
  { id: '1', name: 'Ibuprofeno 400mg', drug: 'Ibuprofeno', presentation: 'Caja x 20 comp.', category: 'Analgésicos', stock: 150, minStock: 30, price: 850 },
  { id: '2', name: 'Paracetamol 500mg', drug: 'Paracetamol', presentation: 'Caja x 16 comp.', category: 'Analgésicos', stock: 200, minStock: 50, price: 620 },
  { id: '3', name: 'Aspirina 500mg', drug: 'Ácido acetilsalicílico', presentation: 'Caja x 20 comp.', category: 'Analgésicos', stock: 25, minStock: 40, price: 450 },
  { id: '4', name: 'Diclofenac 50mg', drug: 'Diclofenac sódico', presentation: 'Caja x 20 comp.', category: 'Antiinflamatorios', stock: 80, minStock: 25, price: 720 },
  { id: '5', name: 'Ketorolac 10mg', drug: 'Ketorolac trometamina', presentation: 'Caja x 10 comp.', category: 'Analgésicos', stock: 15, minStock: 20, price: 980 },
  { id: '6', name: 'Tramadol 50mg', drug: 'Tramadol clorhidrato', presentation: 'Caja x 20 comp.', category: 'Analgésicos', stock: 45, minStock: 15, price: 1250 },
  { id: '7', name: 'Guantes de látex M', drug: '-', presentation: 'Caja x 100 unid.', category: 'Descartables', stock: 12, minStock: 20, price: 2800 },
  { id: '8', name: 'Jeringas 5ml', drug: '-', presentation: 'Caja x 100 unid.', category: 'Descartables', stock: 35, minStock: 30, price: 1500 },
  { id: '9', name: 'Gasas estériles', drug: '-', presentation: 'Paquete x 10 unid.', category: 'Descartables', stock: 100, minStock: 40, price: 320 },
  { id: '10', name: 'Amoxicilina 500mg', drug: 'Amoxicilina', presentation: 'Caja x 21 caps.', category: 'Antibióticos', stock: 60, minStock: 25, price: 890 },
  { id: '11', name: 'Azitromicina 500mg', drug: 'Azitromicina', presentation: 'Caja x 3 comp.', category: 'Antibióticos', stock: 40, minStock: 15, price: 1100 },
  { id: '12', name: 'Naproxeno 550mg', drug: 'Naproxeno sódico', presentation: 'Caja x 20 comp.', category: 'Antiinflamatorios', stock: 70, minStock: 20, price: 780 },
]

// Mock chart data - SALES (values in currency) - Weekly data
export const salesTrendData = [
  { name: 'Lun', ventas: 8500 },
  { name: 'Mar', ventas: 12400 },
  { name: 'Mié', ventas: 7600 },
  { name: 'Jue', ventas: 14200 },
  { name: 'Vie', ventas: 17800 },
  { name: 'Sáb', ventas: 11200 },
  { name: 'Dom', ventas: 4600 },
]

// Monthly sales data for the past year
export const salesTrendDataMonthly = [
  { name: 'Jun', ventas: 45600 },
  { name: 'Jul', ventas: 52300 },
  { name: 'Ago', ventas: 48900 },
  { name: 'Sep', ventas: 61200 },
  { name: 'Oct', ventas: 58700 },
  { name: 'Nov', ventas: 73400 },
  { name: 'Dic', ventas: 89500 },
  { name: 'Ene', ventas: 76200 },
  { name: 'Feb', ventas: 82100 },
  { name: 'Mar', ventas: 95600 },
  { name: 'Abr', ventas: 87300 },
  { name: 'May', ventas: 103200 },
]

// Yearly sales data for the past 5 years
export const salesTrendDataYearly = [
  { name: '2021', ventas: 425600 },
  { name: '2022', ventas: 523000 },
  { name: '2023', ventas: 612500 },
  { name: '2024', ventas: 758300 },
  { name: '2025', ventas: 920400 },
]

// Top 4 best selling products
export const topSellingProducts = [
  { name: 'Ibuprofeno 400mg', cantidad: 42500, fill: 'hsl(var(--primary))' },
  { name: 'Paracetamol 500mg', cantidad: 38200, fill: 'var(--color-chart-2)' },
  { name: 'Diclofenac 50mg', cantidad: 28900, fill: 'var(--color-chart-3)' },
  { name: 'Gasas estériles', cantidad: 24300, fill: 'var(--color-chart-4)' },
]

export const categoryDistributionData = [
  { name: 'Analgésicos', value: 42500, fill: 'var(--color-chart-1)' },
  { name: 'Descartables', value: 18700, fill: 'var(--color-chart-2)' },
  { name: 'Antiinflamatorios', value: 15600, fill: 'var(--color-chart-3)' },
  { name: 'Antibióticos', value: 11200, fill: 'var(--color-chart-4)' },
]

export const frequentProducts = ['1', '2', '4', '6', '8', '10']

// Accumulated sales data for the month (in currency)
export const accumulatedSalesData = [
  { date: '1', acumulado: 8500 },
  { date: '5', acumulado: 39300 },
  { date: '10', acumulado: 75700 },
  { date: '15', acumulado: 122900 },
  { date: '20', acumulado: 178100 },
  { date: '25', acumulado: 225300 },
  { date: '30', acumulado: 265300 },
]

// Purchase trend data (last 6 months) - spent amounts
export const purchaseTrendData = [
  { month: 'Dic', compras: 125000 },
  { month: 'Ene', compras: 142500 },
  { month: 'Feb', compras: 98300 },
  { month: 'Mar', compras: 156800 },
  { month: 'Abr', compras: 178900 },
  { month: 'May', compras: 195600 },
]

// Top 5 most loaded products via Excel
export const topLoadedProducts = [
  { name: 'Ibuprofeno 400mg', cantidad: 45000, fill: 'hsl(var(--primary))' },
  { name: 'Paracetamol 500mg', cantidad: 38000, fill: 'var(--color-chart-2)' },
  { name: 'Gasas estériles', cantidad: 32000, fill: 'var(--color-chart-3)' },
  { name: 'Jeringas 5ml', cantidad: 28000, fill: 'var(--color-chart-4)' },
  { name: 'Amoxicilina 500mg', cantidad: 24000, fill: 'var(--color-chart-1)' },
]

// Profit data by period
export const profitByPeriod = {
  diario: 3450,
  semanal: 18250,
  mensual: 67890,
  anual: 785320,
}

// KPIs by global filter period
export const kpisByPeriod = {
  hoy: { ventas: 12450, compras: 8200, ganancia: 4250 },
  semana: { ventas: 76300, compras: 52100, ganancia: 24200 },
  mes: { ventas: 265300, compras: 197400, ganancia: 67900 },
  año: { ventas: 2856000, compras: 2070680, ganancia: 785320 },
}

// Sales vs Purchases trend data by period
export const salesVsPurchasesTrend = {
  hoy: [
    { name: '8:00', ventas: 1200, compras: 800 },
    { name: '10:00', ventas: 2100, compras: 1500 },
    { name: '12:00', ventas: 3400, compras: 2200 },
    { name: '14:00', ventas: 2800, compras: 1800 },
    { name: '16:00', ventas: 1950, compras: 1200 },
    { name: '18:00', ventas: 1000, compras: 700 },
  ],
  semana: [
    { name: 'Lun', ventas: 8500, compras: 6200 },
    { name: 'Mar', ventas: 12400, compras: 8100 },
    { name: 'Mié', ventas: 7600, compras: 5400 },
    { name: 'Jue', ventas: 14200, compras: 9800 },
    { name: 'Vie', ventas: 17800, compras: 12500 },
    { name: 'Sáb', ventas: 11200, compras: 7200 },
    { name: 'Dom', ventas: 4600, compras: 2900 },
  ],
  mes: [
    { name: 'Sem 1', ventas: 45600, compras: 32400 },
    { name: 'Sem 2', ventas: 52300, compras: 38900 },
    { name: 'Sem 3', ventas: 68400, compras: 51200 },
    { name: 'Sem 4', ventas: 99000, compras: 74900 },
  ],
  año: [
    { name: 'Ene', ventas: 186500, compras: 142000 },
    { name: 'Feb', ventas: 195200, compras: 148500 },
    { name: 'Mar', ventas: 223800, compras: 168200 },
    { name: 'Abr', ventas: 245600, compras: 182400 },
    { name: 'May', ventas: 265300, compras: 197400 },
    { name: 'Jun', ventas: 278900, compras: 205800 },
    { name: 'Jul', ventas: 256400, compras: 188900 },
    { name: 'Ago', ventas: 234500, compras: 172300 },
    { name: 'Sep', ventas: 252100, compras: 185600 },
    { name: 'Oct', ventas: 268700, compras: 198400 },
    { name: 'Nov', ventas: 289500, compras: 214200 },
    { name: 'Dic', ventas: 359500, compras: 266980 },
  ],
}

// Top products for donut chart (by sales and purchases)
// High contrast palette: Rojo Intenso, Gris Carbón, Gris Plata, Neutro Suave
export const topProductsSales = [
  { name: 'Ibuprofeno 400mg', value: 42500, fill: '#DC2626' },
  { name: 'Paracetamol 500mg', value: 38200, fill: '#374151' },
  { name: 'Diclofenac 50mg', value: 28900, fill: '#9CA3AF' },
  { name: 'Gasas estériles', value: 24300, fill: '#D1D5DB' },
]

export const topProductsPurchases = [
  { name: 'Ibuprofeno 400mg', value: 45000, fill: '#DC2626' },
  { name: 'Paracetamol 500mg', value: 38000, fill: '#374151' },
  { name: 'Gasas estériles', value: 32000, fill: '#9CA3AF' },
  { name: 'Jeringas 5ml', value: 28000, fill: '#D1D5DB' },
]

// Movement (transaction) data for sales and purchases
export interface Movement {
  id: string
  type: 'venta' | 'compra'
  description: string
  amount: number
  date: string
  time: string
}

export const recentMovements: Movement[] = [
  { id: '1', type: 'venta', description: 'Venta: Ibuprofeno 400mg', amount: 2550, date: '30 May', time: '14:32' },
  { id: '2', type: 'compra', description: 'Compra: Excel - Gasas estériles', amount: 3200, date: '30 May', time: '13:15' },
  { id: '3', type: 'venta', description: 'Venta: Paracetamol 500mg', amount: 1860, date: '29 May', time: '11:45' },
  { id: '4', type: 'compra', description: 'Compra: Excel - Jeringas 5ml', amount: 4500, date: '29 May', time: '09:20' },
  { id: '5', type: 'venta', description: 'Venta: Diclofenac 50mg', amount: 1440, date: '28 May', time: '16:10' },
  { id: '6', type: 'compra', description: 'Compra: Excel - Ibuprofeno', amount: 5100, date: '28 May', time: '08:30' },
  { id: '7', type: 'venta', description: 'Venta: Ketorolac 10mg', amount: 980, date: '27 May', time: '15:25' },
  { id: '8', type: 'compra', description: 'Compra: Excel - Amoxicilina', amount: 2890, date: '27 May', time: '10:50' },
]
