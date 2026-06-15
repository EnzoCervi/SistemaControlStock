"use client"

import { useState, useMemo } from 'react'
import { Boxes, AlertTriangle, TrendingUp, Package, ArrowUpRight, ArrowDownLeft, Calendar, ShoppingCart, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/data'
import { type Producto } from '@/app/page'

export interface MovimientoReal {
  id: number
  producto_id: string
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  descripcion: string
  fecha: string
  ticket_id?: string | null
  ticket_titulo?: string | null
  ticket_nota?: string | null
}

interface DashboardProps {
  totalStock: number
  alertCount: number
  monthlyMovements: number
  lowStockProducts: Producto[] 
  products: Producto[]
  movements: MovimientoReal[]         
}

type GlobalPeriod = 'hoy' | 'semana' | 'mes' | 'año'
type MovementFilter = 'todos' | 'hoy' | 'semana' | 'mes'

const periodLabels: Record<GlobalPeriod, string> = {
  hoy: 'Hoy',
  semana: 'Últimos 7 días',
  mes: 'Últimos 30 días',
  año: 'Último año',
}

export function Dashboard({
  totalStock,
  alertCount,
  lowStockProducts,
  products = [],
  movements = [],
}: DashboardProps) {
  const [globalPeriod, setGlobalPeriod] = useState<GlobalPeriod>('mes')
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('todos')
  const [topProductsView, setTopProductsView] = useState<'ventas' | 'compras'>('ventas')
  const [trendView, setTrendView] = useState<'ventas' | 'compras'>('ventas')

  // 1. Filtrado dinámico de movimientos por el período global seleccionado
  const filteredMovementsByPeriod = useMemo(() => {
    const now = new Date()
    const hoyStr = now.toISOString().split('T')[0]

    return movements.filter(m => {
      if (globalPeriod === 'hoy') {
        return m.fecha.startsWith(hoyStr)
      }
      
      const mTime = new Date(m.fecha).getTime()
      if (isNaN(mTime)) return false
      
      const diffDays = (now.getTime() - mTime) / (1000 * 60 * 60 * 24)
      if (globalPeriod === 'semana') return diffDays <= 7
      if (globalPeriod === 'mes') return diffDays <= 30
      if (globalPeriod === 'año') return diffDays <= 365
      return true
    })
  }, [movements, globalPeriod])

  // 2. Cálculo en tiempo real de los KPIs del período
  const currentKpis = useMemo(() => {
    let ventas = 0
    let compras = 0
    let gananciaReal = 0

    filteredMovementsByPeriod.forEach(m => {
      const prod = products.find(p => p.id === m.producto_id)
      if (!prod) return

      if (m.tipo === 'SALIDA') {
        const precioVentaItem = prod.precio_venta || 0
        const precioCompraItem = prod.precio_compra || 0
        ventas += m.cantidad * precioVentaItem
        gananciaReal += m.cantidad * (precioVentaItem - precioCompraItem)
      } else if (m.tipo === 'ENTRADA') {
        compras += m.cantidad * (prod.precio_compra || 0)
      }
    })

    return {
      ventas,
      compras,
      ganancia: gananciaReal 
    }
  }, [filteredMovementsByPeriod, products])

  // 3. Segmentación dinámica para el gráfico de tendencias
  const trendData = useMemo(() => {
    const labels = 
      globalPeriod === 'hoy' ? ['Madrugada', 'Mañana', 'Tarde', 'Noche'] :
      globalPeriod === 'semana' ? ['Días 1-2', 'Días 3-4', 'Días 5-6', 'Día 7'] :
      globalPeriod === 'año' ? ['Trim 1', 'Trim 2', 'Trim 3', 'Trim 4'] :
      ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']

    const chunks = [
      { name: labels[0], ventas: 0, compras: 0 },
      { name: labels[1], ventas: 0, compras: 0 },
      { name: labels[2], ventas: 0, compras: 0 },
      { name: labels[3], ventas: 0, compras: 0 },
    ]

    const now = new Date()

    filteredMovementsByPeriod.forEach(m => {
      const mDate = new Date(m.fecha)
      if (isNaN(mDate.getTime())) return
      
      const prod = products.find(p => p.id === m.producto_id)
      if (!prod) return

      const totalValue = m.cantidad * (m.tipo === 'SALIDA' ? (prod.precio_venta || 0) : (prod.precio_compra || 0))
      const key = m.tipo === 'SALIDA' ? 'ventas' : 'compras'

      let index = 0
      if (globalPeriod === 'hoy') {
        const hour = mDate.getHours()
        if (hour < 6) index = 0
        else if (hour < 12) index = 1
        else if (hour < 18) index = 2
        else index = 3
      } else {
        const diffDays = (now.getTime() - mDate.getTime()) / (1000 * 60 * 60 * 24)
        const maxDays = globalPeriod === 'semana' ? 7 : globalPeriod === 'año' ? 365 : 30
        index = Math.min(3, Math.floor((1 - (diffDays / maxDays)) * 4))
        if (index < 0) index = 0
      }

      chunks[index][key] += totalValue
    })

    return chunks
  }, [filteredMovementsByPeriod, products, globalPeriod])

  // 4. Cálculo de los Top Productos
  const topProducts = useMemo(() => {
    const totals: Record<string, number> = {}
    
    filteredMovementsByPeriod.forEach(m => {
      const isTargetType = topProductsView === 'ventas' ? m.tipo === 'SALIDA' : m.tipo === 'ENTRADA'
      if (!isTargetType) return

      const prod = products.find(p => p.id === m.producto_id)
      if (!prod) return

      const monetaryAmount = m.cantidad * (topProductsView === 'ventas' ? (prod.precio_venta || 0) : (prod.precio_compra || 0))
      totals[prod.nombre] = (totals[prod.nombre] || 0) + monetaryAmount
    })

    const colorPalette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']

    const sortedProducts = Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((item, idx) => ({
        ...item,
        fill: colorPalette[idx] || '#E5E7EB'
      }))

    return sortedProducts.length > 0 ? sortedProducts : [{ name: 'Sin operaciones', value: 1, fill: '#E5E7EB' }]
  }, [filteredMovementsByPeriod, products, topProductsView])
  
  const topProductsTotal = topProducts.reduce((sum, p) => sum + p.value, 0)

  // 5. Filtrado real para la tarjeta de movimientos recientes inferiores
  const filteredMovements = useMemo(() => {
    if (movementFilter === 'todos') return movements
    const hoyStr = new Date().toISOString().split('T')[0]
    if (movementFilter === 'hoy') {
      return movements.filter(m => m.fecha.startsWith(hoyStr))
    }
    return movements.filter(m => {
      const mTime = new Date(m.fecha).getTime()
      const diffDays = (new Date().getTime() - mTime) / (1000 * 60 * 60 * 24)
      return movementFilter === 'semana' ? diffDays <= 7 : diffDays <= 30
    })
  }, [movements, movementFilter])

  return (
    <div className="space-y-6">
      {/* HEADER Y FILTRO GLOBAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Página Principal</h1>
          <p className="text-sm text-muted-foreground">
            Resumen del período: {periodLabels[globalPeriod]}
          </p>
        </div>
        <Select value={globalPeriod} onValueChange={(v) => setGlobalPeriod(v as GlobalPeriod)}>
          <SelectTrigger className="w-[180px] border-border">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoy">Hoy</SelectItem>
            <SelectItem value="semana">Últimos 7 días</SelectItem>
            <SelectItem value="mes">Últimos 30 días</SelectItem>
            <SelectItem value="año">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* BLOQUE DE DATOS GLOBALES */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Datos Globales</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Unidades en Stock</p>
                  <p className="text-2xl font-bold text-foreground">{totalStock.toLocaleString('es-AR')}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Boxes className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-border bg-card transition-all duration-300 hover:scale-[1.01] ${
              alertCount > 0 ? 'border-destructive/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'hover:shadow-md'
            }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Alertas de Stock Bajo</p>
                  <p className={`text-2xl font-bold ${alertCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {alertCount}
                  </p>
                </div>
                <div className={`rounded-lg p-2 ${alertCount > 0 ? 'bg-destructive/10 animate-pulse' : 'bg-primary/10'}`}>
                  <AlertTriangle className={`h-5 w-5 ${alertCount > 0 ? 'text-destructive' : 'text-primary'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOQUE DE KPIs DEL PERÍODO */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(currentKpis.ventas)}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Compras</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(currentKpis.compras)}</p>
              </div>
              <div className="rounded-lg bg-secondary p-2">
                <ShoppingCart className="h-5 w-5 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Ganancia</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(currentKpis.ganancia)}
                </p>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <Wallet className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOQUE DE GRÁFICOS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Tendencia {trendView === 'ventas' ? 'de Ventas' : 'de Compras'}
              </CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={() => setTrendView('ventas')}
                  className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                    trendView === 'ventas' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Ventas
                </button>
                <button
                  onClick={() => setTrendView('compras')}
                  className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                    trendView === 'compras' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Compras
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Bar dataKey={trendView} fill={trendView === 'ventas' ? 'var(--chart-1)' : 'var(--chart-3)'} radius={[4, 4, 0, 0]} name={trendView === 'ventas' ? 'Ventas' : 'Compras'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Top Productos</CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={() => setTopProductsView('ventas')}
                  className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                    topProductsView === 'ventas' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Ventas
                </button>
                <button
                  onClick={() => setTopProductsView('compras')}
                  className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                    topProductsView === 'compras' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Compras
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-[200px] w-[200px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topProducts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name">
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex-1 space-y-2">
                {topProducts.map((product, index) => {
                  const percentage = topProductsTotal > 0 ? ((product.value / topProductsTotal) * 100).toFixed(1) : "0.0"
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: product.fill }} 
                      />
                      <span className="text-sm text-foreground flex-1 truncate">{product.name}</span>
                      <span className="text-sm font-medium text-muted-foreground">({percentage}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOQUE DE MOVIMIENTOS RECIENTES Y ALERTAS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Movimientos Recientes */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <TrendingUp className="h-4 w-4 text-primary" />
                Movimientos Recientes
              </CardTitle>
              <Select value={movementFilter} onValueChange={(v) => setMovementFilter(v as MovementFilter)}>
                <SelectTrigger className="w-[130px] h-8 text-xs border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[320px] overflow-y-auto overflow-x-hidden pr-1">
              {(() => {
                const ticketsAgrupados: Record<string, {
                  id: string;
                  titulo: string;
                  nota?: string | null;
                  fecha: string;
                  tipo: string;
                  totalUnidades: number;
                  totalDinero: number;
                  items: { descripcion: string; cantidad: number }[];
                }> = {}

                filteredMovements.forEach(m => {
                  // 🧠 Buscamos el precio real según el tipo de movimiento para calcular el dinero exacto
                  const prod = products.find(p => p.id === m.producto_id)
                  const precioUnitario = prod ? (m.tipo === 'SALIDA' ? (prod.precio_venta || 0) : (prod.precio_compra || 0)) : 0
                  const totalDineroItem = m.cantidad * precioUnitario

                  if (m.ticket_id) {
                    if (!ticketsAgrupados[m.ticket_id]) {
                      ticketsAgrupados[m.ticket_id] = {
                        id: m.ticket_id,
                        titulo: m.ticket_titulo || 'Movimiento de inventario',
                        nota: m.ticket_nota,
                        fecha: m.fecha,
                        tipo: m.tipo,
                        totalUnidades: 0,
                        totalDinero: 0,
                        items: []
                      }
                    }
                    ticketsAgrupados[m.ticket_id].totalUnidades += m.cantidad
                    ticketsAgrupados[m.ticket_id].totalDinero += totalDineroItem
                    ticketsAgrupados[m.ticket_id].items.push({ 
                      descripcion: m.descripcion, 
                      cantidad: m.cantidad 
                    })
                  } else {
                    const idSuelto = `suelto-${m.id}`
                    ticketsAgrupados[idSuelto] = {
                      id: idSuelto,
                      titulo: m.descripcion,
                      fecha: m.fecha,
                      tipo: m.tipo,
                      totalUnidades: m.cantidad,
                      totalDinero: totalDineroItem,
                      items: []
                    }
                  }
                })

                const finalData = Object.values(ticketsAgrupados)

                if (finalData.length === 0) {
                  return <p className="text-xs text-center text-muted-foreground py-4">No hay movimientos registrados.</p>
                }

                return <HistorialInteractivo lista={finalData} />
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Alertas de Stock Bajo */}
        <Card className={`border-border ${alertCount > 0 ? 'border-destructive/30 bg-destructive/5' : ''}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-2 text-base font-medium ${alertCount > 0 ? 'text-destructive' : ''}`}>
              <AlertTriangle className="h-4 w-4" />
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-2 max-h-[320px] overflow-y-auto overflow-x-hidden pr-1">
                {lowStockProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:translate-x-1 hover:bg-destructive/[0.02] hover:border-destructive/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                        <Package className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.nombre}</p>
                        <p className="text-xs text-muted-foreground">{product.presentacion}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1">
                        {product.stock_actual} unid.
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Mín: {product.stock_minimo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-success/10 p-3 mb-3">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm font-medium text-foreground">Sin alertas</p>
                <p className="text-xs text-muted-foreground">Todos los productos están en stock</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 🔄 Subcomponente interactivo adaptado a las reglas contables y monetarias de Enzo
function HistorialInteractivo({ lista }: { lista: any[] }) {
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({})

  const toggleTicket = (id: string) => {
    setExpandedTickets(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      {lista.map((ticket) => {
        const fechaObj = new Date(ticket.fecha)
        const dateStr = fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
        const timeStr = fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        
        // 📈 CAMBIO CLAVE: Definimos que una SALIDA es una Venta (ingreso positivo de dinero)
        const esVenta = ticket.tipo === 'SALIDA'
        
        const esCargaManual = ticket.titulo.startsWith('Carga manual')
        const tieneDetalle = ticket.items.length > 0 && !esCargaManual
        const isExpanded = expandedTickets[ticket.id]

        return (
          <div key={ticket.id} className="rounded-lg border border-border bg-card overflow-hidden transition-all duration-200">
            <button
              onClick={() => tieneDetalle && toggleTicket(ticket.id)}
              disabled={!tieneDetalle}
              className={`flex w-full items-center justify-between p-3 text-left transition-colors ${
                tieneDetalle ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* 🎨 COLORES E ÍCONOS INVERTIDOS: Venta es verde positivo, Compra es roja negativa */}
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                    esVenta ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                  {esVenta ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ticket.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateStr} • {timeStr}
                    {!tieneDetalle && esCargaManual && ticket.items[0] && ` • ${ticket.items[0].descripcion}`}
                    {tieneDetalle && ` • ${isExpanded ? 'Ocultar' : 'Ver'} desglose`}
                  </p>
                </div>
              </div>
              
              <div className="ml-3 flex-shrink-0 text-right">
                <p className={`text-sm font-bold ${esVenta ? 'text-success' : 'text-destructive'}`}>
                  {esVenta ? '+' : '-'}{formatCurrency(ticket.totalDinero)}
                </p>
              </div>
            </button>

            {tieneDetalle && isExpanded && (
              <div className="bg-muted/30 border-t border-border/50 px-4 py-2.5 space-y-2 text-xs">
                {ticket.nota && (
                  <div className="rounded border border-primary/15 bg-primary/5 p-2 text-foreground/90 italic">
                    <span className="font-semibold not-italic text-primary block text-[10px] uppercase tracking-wide mb-0.5">
                      Observaciones:
                    </span>
                    "{ticket.nota}"
                  </div>
                )}

                <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
                  Artículos incluidos:
                </p>
                
                {/* 📦 El desglose mantiene las unidades por producto intactas tal como pediste */}
                {ticket.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-foreground/80 py-0.5 border-b border-dashed border-border/40 last:border-0">
                    <span className="truncate pr-4 font-medium">• {item.descripcion}</span>
                    <span className="font-semibold text-muted-foreground flex-shrink-0 bg-background px-1.5 py-0.5 rounded border border-border/40">
                      {item.cantidad} unid.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}