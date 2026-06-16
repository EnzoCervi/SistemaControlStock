"use client"

import { useState, useMemo } from 'react'
import { Boxes, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownLeft, Calendar, ShoppingCart, Wallet, Settings, XCircle } from 'lucide-react'
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  es_ajuste?: boolean
  estado: 'activo' | 'anulado' // Integrado formalmente
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
  semana: 'Esta semana',
  mes: 'Este mes',
  año: 'Este año',
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
  const [selectedProductValue, setSelectedProductValue] = useState<string | null>(null)

  const verificarSiEsAjuste = (m: MovimientoReal) => {
    if (m.estado === 'anulado') return true // Filtro de exclusión para KPIs comerciales

    return !!(
      m.es_ajuste || 
      m.descripcion?.startsWith('Ajuste stock:') || 
      m.ticket_titulo?.startsWith('Ajuste stock:')
    )
  }

  const filteredMovementsByPeriod = useMemo(() => {
    const now = new Date()
    const hoyStr = now.toISOString().split('T')[0]

    const currentDay = now.getDay()
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1
    const mondayOfThisWeek = new Date(now)
    mondayOfThisWeek.setDate(now.getDate() - distanceToMonday)
    mondayOfThisWeek.setHours(0, 0, 0, 0)

    return movements.filter(m => {
      if (globalPeriod === 'hoy') return m.fecha.startsWith(hoyStr)
      
      const mDate = new Date(m.fecha)
      if (isNaN(mDate.getTime())) return false
      const mTime = mDate.getTime()
      
      if (globalPeriod === 'semana') return mTime >= mondayOfThisWeek.getTime() && mTime <= now.getTime()
      if (globalPeriod === 'mes') return mDate.getFullYear() === now.getFullYear() && mDate.getMonth() === now.getMonth()
      if (globalPeriod === 'año') return mDate.getFullYear() === now.getFullYear()
      return true
    })
  }, [movements, globalPeriod])

  const currentKpis = useMemo(() => {
    let ventas = 0
    let compras = 0
    let gananciaReal = 0

    filteredMovementsByPeriod.forEach(m => {
      if (verificarSiEsAjuste(m)) return 

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

    return { ventas, compras, ganancia: gananciaReal }
  }, [filteredMovementsByPeriod, products])

  const trendData = useMemo(() => {
    let labels: string[] = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
    if (globalPeriod === 'semana') labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    else if (globalPeriod === 'hoy') labels = ['Madrugada', 'Mañana', 'Tarde', 'Noche']
    else if (globalPeriod === 'año') labels = ['Trim 1', 'Trim 2', 'Trim 3', 'Trim 4']

    const chunks = labels.map(name => ({ name, ventas: 0, compras: 0 }))

    filteredMovementsByPeriod.forEach(m => {
      if (verificarSiEsAjuste(m)) return 

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
      } else if (globalPeriod === 'semana') {
        const dayNum = mDate.getDay()
        index = dayNum === 0 ? 6 : dayNum - 1
      } else if (globalPeriod === 'mes') {
        const day = mDate.getDate()
        if (day <= 7) index = 0
        else if (day <= 14) index = 1
        else if (day <= 21) index = 2
        else index = 3
      } else if (globalPeriod === 'año') {
        index = Math.min(3, Math.floor(mDate.getMonth() / 3))
      }

      if (chunks[index]) chunks[index][key] += totalValue
    })

    return chunks
  }, [filteredMovementsByPeriod, products, globalPeriod])

  const topProducts = useMemo(() => {
    const totals: Record<string, number> = {}
    
    filteredMovementsByPeriod.forEach(m => {
      if (verificarSiEsAjuste(m)) return 

      const isTargetType = topProductsView === 'ventas' ? m.tipo === 'SALIDA' : m.tipo === 'ENTRADA'
      if (!isTargetType) return

      const prod = products.find(p => p.id === m.producto_id)
      if (!prod) return

      const monetaryAmount = m.cantidad * (topProductsView === 'ventas' ? (prod.precio_venta || 0) : (prod.precio_compra || 0))
      totals[prod.nombre] = (totals[prod.nombre] || 0) + monetaryAmount
    })

    const colorPalette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((item, idx) => ({ ...item, fill: colorPalette[idx] || '#E5E7EB' }))
  }, [filteredMovementsByPeriod, products, topProductsView])
  
  const topProductsTotal = topProducts.reduce((sum, p) => sum + p.value, 0)

  const filteredMovements = useMemo(() => {
    if (movementFilter === 'todos') return movements
    const hoyStr = new Date().toISOString().split('T')[0]
    if (movementFilter === 'hoy') return movements.filter(m => m.fecha.startsWith(hoyStr))
    return movements.filter(m => {
      const mTime = new Date(m.fecha).getTime()
      const diffDays = (new Date().getTime() - mTime) / (1000 * 60 * 60 * 24)
      return movementFilter === 'semana' ? diffDays <= 7 : diffDays <= 30
    })
  }, [movements, movementFilter])

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Página Principal</h1>
          <p className="text-sm text-muted-foreground">Resumen del período: {periodLabels[globalPeriod]}</p>
        </div>
        <Select value={globalPeriod} onValueChange={(v) => { setGlobalPeriod(v as GlobalPeriod); setSelectedProductValue(null); }}>
          <SelectTrigger className="w-[180px] border-border">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoy">Hoy</SelectItem>
            <SelectItem value="semana">Esta semana</SelectItem>
            <SelectItem value="mes">Este mes</SelectItem>
            <SelectItem value="año">Este año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* BLOQUE GLOBAL */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Unidades en Stock</p>
                <p className="text-2xl font-bold text-foreground">{totalStock.toLocaleString('es-AR')}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2"><Boxes className="h-5 w-5 text-primary" /></div>
            </CardContent>
          </Card>
          <Card className={`border-border bg-card ${alertCount > 0 ? 'border-destructive/30' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Alertas de Stock Bajo</p>
                <p className={`text-2xl font-bold ${alertCount > 0 ? 'text-destructive' : 'text-foreground'}`}>{alertCount}</p>
              </div>
              <div className={`rounded-lg p-2 ${alertCount > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}><AlertTriangle className="h-5 w-5 text-primary" /></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KPIs FINANCIEROS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Ventas</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(currentKpis.ventas)}</p>
            </div>
            <div className="rounded-lg bg-success/10 p-2"><TrendingUp className="h-5 w-5 text-success" /></div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Compras</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(currentKpis.compras)}</p>
            </div>
            <div className="rounded-lg bg-secondary p-2"><ShoppingCart className="h-5 w-5 text-secondary-foreground" /></div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Ganancia</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(currentKpis.ganancia)}</p>
            </div>
            <div className="rounded-lg bg-success/10 p-2"><Wallet className="h-5 w-5 text-success" /></div>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Tendencia {trendView === 'ventas' ? 'de Ventas' : 'de Compras'}</CardTitle>
            <div className="flex gap-1">
              <button onClick={() => setTrendView('ventas')} className={`rounded px-3 py-1 text-xs font-medium ${trendView === 'ventas' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Ventas</button>
              <button onClick={() => setTrendView('compras')} className={`rounded px-3 py-1 text-xs font-medium ${trendView === 'compras' ? 'bg-foreground text-background' : 'bg-muted'}`}>Compras</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} tickFormatter={(value) => value === 0 ? "" : `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                  <Area type="monotone" dataKey={trendView} stroke={trendView === 'ventas' ? 'var(--chart-1)' : 'var(--chart-3)'} fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Top Productos</CardTitle>
            <div className="flex gap-1">
              <button onClick={() => { setTopProductsView('ventas'); setSelectedProductValue(null); }} className={`rounded px-3 py-1 text-xs font-medium ${topProductsView === 'ventas' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Ventas</button>
              <button onClick={() => { setTopProductsView('compras'); setSelectedProductValue(null); }} className={`rounded px-3 py-1 text-xs font-medium ${topProductsView === 'compras' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Compras</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topProducts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name">
                      {topProducts.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {topProducts.map((product, index) => {
                  const percentage = topProductsTotal > 0 ? ((product.value / topProductsTotal) * 100).toFixed(1) : "0.0"
                  const isSelected = selectedProductValue === product.name

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedProductValue(isSelected ? null : product.name)}
                        className="w-3 h-3 rounded-full flex-shrink-0 transition-all hover:scale-125 cursor-pointer focus:outline-none" 
                        style={{ backgroundColor: product.fill }}
                      />
                      <span className="text-sm text-foreground flex-1 truncate">{product.name}</span>
                      <span 
                        onClick={() => setSelectedProductValue(isSelected ? null : product.name)}
                        className={`text-sm font-medium cursor-pointer transition-colors select-none ${
                          isSelected ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isSelected ? formatCurrency(product.value) : `(${percentage}%)`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN INFERIOR COMPLETA */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-medium"><TrendingUp className="h-4 w-4 text-primary" />Movimientos Recientes</CardTitle>
            <Select value={movementFilter} onValueChange={(v) => setMovementFilter(v as MovementFilter)}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {(() => {
                const ticketsAgrupados: Record<string, any> = {}

                filteredMovements.forEach(m => {
                  const prod = products.find(p => p.id === m.producto_id)
                  const precioUnitario = prod ? (m.tipo === 'SALIDA' ? (prod.precio_venta || 0) : (prod.precio_compra || 0)) : 0
                  
                  // 🚀 CONTROL DE ANULACIONES EN LA AGRUPACIÓN DEL DASHBOARD
                  const esAnulado = m.estado === 'anulado'
                  const isAjuste = !esAnulado && !!(m.es_ajuste || m.descripcion?.startsWith('Ajuste stock:') || m.ticket_titulo?.startsWith('Ajuste stock:'))
                  const totalDineroItem = (isAjuste || esAnulado) ? 0 : m.cantidad * precioUnitario

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
                        es_ajuste: isAjuste,
                        es_anulado: esAnulado, // Propagamos el flag al renderizador
                        items: []
                      }
                    }
                    ticketsAgrupados[m.ticket_id].totalUnidades += m.cantidad
                    ticketsAgrupados[m.ticket_id].totalDinero += totalDineroItem
                    ticketsAgrupados[m.ticket_id].items.push({ 
                      descripcion: m.descripcion, 
                      cantidad: m.cantidad, 
                      precioUnitario: (isAjuste || esAnulado) ? 0 : precioUnitario 
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
                      es_ajuste: isAjuste,
                      es_anulado: esAnulado,
                      items: []
                    }
                  }
                })

                const finalData = Object.values(ticketsAgrupados)
                if (finalData.length === 0) return <p className="text-xs text-center text-muted-foreground py-4">No hay movimientos.</p>

                return <HistorialInteractivo lista={finalData} />
              })()}
            </div>
          </CardContent>
        </Card>

        {/* ALERTAS */}
        <Card className={`border-border ${alertCount > 0 ? 'border-destructive/30 bg-destructive/5' : ''}`}>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-medium">Alertas de Stock Bajo</CardTitle></CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div><p className="text-sm font-medium">{p.nombre}</p><p className="text-xs text-muted-foreground">{p.presentacion}</p></div>
                    <div className="text-right"><Badge variant="destructive" className="mb-1">{p.stock_actual} unid.</Badge></div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-center text-muted-foreground py-8">Sin alertas.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HistorialInteractivo({ lista }: { lista: any[] }) {
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({})

  return (
    <>
      {lista.map((ticket) => {
        const esVenta = ticket.tipo === 'SALIDA'
        const esAjuste = ticket.es_ajuste
        const esAnulado = ticket.es_anulado
        const isExpanded = expandedTickets[ticket.id]

        return (
          /* 🎯 CARACTERIZACIÓN EN EL PANEL PRINCIPAL SI ESTÁ CANCELADO */
          <div 
            key={ticket.id} 
            className={`rounded-lg border overflow-hidden ${esAnulado ? 'border-red-200' : 'border-border'} bg-card`}
            style={esAnulado ? { backgroundColor: '#fff5f5' } : undefined}
          >
            <button
              onClick={() => !esAjuste && !esAnulado && setExpandedTickets(p => ({ ...p, [ticket.id]: !p[ticket.id] }))}
              disabled={esAjuste || esAnulado}
              className={`flex w-full items-center justify-between p-3 text-left ${
                esAnulado 
                  ? 'cursor-default text-red-900/60 line-through' 
                  : esAjuste 
                    ? 'cursor-default bg-muted/30' 
                    : 'hover:bg-muted/50 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                  esAnulado 
                    ? 'bg-red-100 text-red-600' 
                    : esAjuste 
                      ? 'bg-muted' 
                      : (esVenta ? 'bg-success/10' : 'bg-destructive/10')
                }`}>
                  {esAnulado ? (
                    <XCircle className="h-4 w-4" />
                  ) : esAjuste ? (
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    esVenta ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownLeft className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${esAnulado ? 'text-red-900/80 font-bold' : 'text-foreground'}`}>
                    {ticket.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ticket.fecha).toLocaleDateString('es-AR')} • {
                      esAnulado 
                        ? 'Operación cancelada ($0,00)' 
                        : esAjuste 
                          ? `Registro operativo (${ticket.totalUnidades} unid.)` 
                          : (isExpanded ? 'Ocultar desglose' : 'Ver desglose')
                    }
                  </p>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0 text-right">
                <p className={`text-sm font-bold ${esAnulado ? 'text-red-500' : esAjuste ? 'text-muted-foreground/60' : (esVenta ? 'text-success' : 'text-destructive')}`}>
                  {esAnulado ? '$0,00' : esAjuste ? '—' : (esVenta ? `+${formatCurrency(ticket.totalDinero)}` : `-${formatCurrency(ticket.totalDinero)}`)}
                </p>
              </div>
            </button>

            {!esAjuste && !esAnulado && isExpanded && ticket.items && (
              <div className="bg-muted/30 border-t p-2.5 space-y-2 text-xs">
                {ticket.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-0.5">
                    <span className="truncate font-medium">• {item.descripcion}</span>
                    <span className="font-semibold text-muted-foreground bg-background px-1.5 py-0.5 rounded border">{item.cantidad} unid. x {formatCurrency(item.precioUnitario)}</span>
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