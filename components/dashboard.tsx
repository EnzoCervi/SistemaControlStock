"use client"

import { useState } from 'react'
import { Boxes, AlertTriangle, TrendingUp, Package, DollarSign, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { salesTrendData, salesTrendDataMonthly, salesTrendDataYearly, topSellingProducts, categoryDistributionData, accumulatedSalesData, purchaseTrendData, topLoadedProducts, formatCurrency, profitByPeriod, recentMovements, type Product } from '@/lib/data'

interface DashboardProps {
  totalStock: number
  alertCount: number
  monthlyMovements: number
  lowStockProducts: Product[]
  products: Product[]
}

export function Dashboard({
  totalStock,
  alertCount,
  monthlyMovements,
  lowStockProducts,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('ventas')
  const [profitPeriod, setProfitPeriod] = useState<'diario' | 'semanal' | 'mensual' | 'anual'>('mensual')
  const [salesTimePeriod, setSalesTimePeriod] = useState<'semana' | 'mes' | 'año'>('semana')
  
  const kpis = [
    {
      title: 'Unidades en Stock',
      value: totalStock.toLocaleString('es-AR'),
      icon: Boxes,
      trend: '+12% vs. mes anterior',
      trendUp: true,
    },
    {
      title: 'Alertas de Stock',
      value: alertCount,
      icon: AlertTriangle,
      trend: alertCount > 0 ? 'Requiere atención' : 'Sin alertas',
      trendUp: alertCount === 0,
      alert: alertCount > 0,
    },
    {
      title: 'Movimientos del Mes',
      value: monthlyMovements,
      icon: TrendingUp,
      trend: '+8% vs. mes anterior',
      trendUp: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Página principal</h1>
        <p className="text-sm text-muted-foreground">
          Vista general del inventario y métricas clave
        </p>
      </div>

      {/* KPI Cards - 3 en fila + Ganancia Total abajo */}
      <div className="space-y-4">
        {/* Fila 1: 3 KPI Cards en pequeño uno al lado del otro */}
        <div className="grid gap-4 grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.title} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground leading-tight">
                        {kpi.title}
                      </p>
                      <p className={`text-2xl font-bold ${kpi.alert ? 'text-destructive' : 'text-foreground'}`}>
                        {kpi.value}
                      </p>
                      <p className={`text-xs ${kpi.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {kpi.trend}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2 ${kpi.alert ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                      <Icon className={`h-4 w-4 ${kpi.alert ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Fila 2: Ganancia Total ocupando el ancho completo */}
        <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/20 p-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Ganancia Total</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(profitByPeriod[profitPeriod])}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(['diario', 'semanal', 'mensual', 'anual'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setProfitPeriod(period)}
                    className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                      profitPeriod === period
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-fit grid-cols-2 gap-2 bg-background border border-border">
            <TabsTrigger value="ventas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Análisis de Ventas
            </TabsTrigger>
            <TabsTrigger value="compras" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Análisis de Compras
            </TabsTrigger>
          </TabsList>

          {/* SALES VIEW */}
          <TabsContent value="ventas" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bar Chart - Sales Trend */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      Tendencia de Ventas
                    </CardTitle>
                    <div className="flex gap-2">
                      {(['semana', 'mes', 'año'] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setSalesTimePeriod(period)}
                          className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                            salesTimePeriod === period
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={
                          salesTimePeriod === 'semana'
                            ? salesTrendData
                            : salesTimePeriod === 'mes'
                            ? salesTrendDataMonthly
                            : salesTrendDataYearly
                        }
                        margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: '#000' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#000' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Bar 
                          dataKey="ventas" 
                          fill="#DC2626"
                          radius={[4, 4, 0, 0]}
                          name="Ventas"
                          label={{ 
                            position: 'top', 
                            fill: '#000', 
                            fontSize: 11, 
                            fontWeight: 600,
                            formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Horizontal Bar Chart - Top 4 Best Selling Products */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    Top 4 Productos Más Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={topSellingProducts} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#000' }} tickLine={false} axisLine={false} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 11, fill: '#000' }}
                          tickLine={false}
                          axisLine={false}
                          width={155}
                        />
                        <Bar 
                          dataKey="cantidad" 
                          fill="#DC2626"
                          radius={[0, 4, 4, 0]}
                          label={{ 
                            position: 'right', 
                            fill: '#000', 
                            fontSize: 11, 
                            fontWeight: 600,
                            formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Line Chart - Accumulated Sales */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  Ventas Acumuladas ($)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accumulatedSalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        className="text-muted-foreground"
                      />
                        <YAxis 
                          tick={{ fontSize: 14, fill: '#000' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Dinero gastado']}
                        />
                      <Line 
                        type="monotone" 
                        dataKey="acumulado" 
                        stroke="hsl(var(--primary))"
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Acumulado"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PURCHASES VIEW */}
          <TabsContent value="compras" className="space-y-6">
            {/* Purchase KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Compras del Mes
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {formatCurrency(18230)}
                    </p>
                    <p className="text-xs text-emerald-600">
                      +15% vs. mes anterior
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Último Archivo Procesado
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      Carga_May28.xlsx
                    </p>
                    <p className="text-xs text-muted-foreground">
                      2,450 unidades • Hace 2 horas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Line Chart - Purchase Trend */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    Tendencia de Compras (Últimos 6 Meses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={purchaseTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          className="text-muted-foreground"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                          formatter={(value: number) => [formatCurrency(value), 'Dinero gastado']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="compras" 
                          stroke="hsl(var(--primary))"
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Compras"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Horizontal Bar Chart - Top 5 Loaded Products */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    Top 5 Productos Más Cargados vía Excel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={topLoadedProducts} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 180, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={175}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`${value} unidades`, '']}
                        />
                        <Bar 
                          dataKey="cantidad" 
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Recent Movements & Low Stock Alerts - Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Movements Section */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <TrendingDown className="h-4 w-4 text-primary" />
              Movimientos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
                        movement.type === 'venta'
                          ? 'bg-emerald-100'
                          : 'bg-orange-100'
                      }`}
                    >
                      {movement.type === 'venta' ? (
                        <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {movement.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {movement.date} • {movement.time}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        movement.type === 'venta'
                          ? 'text-emerald-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {movement.type === 'venta' ? '+' : '-'}{formatCurrency(movement.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Alertas de Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                        <Package className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.presentation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1">
                        {product.stock} unid.
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Mín: {product.minStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
