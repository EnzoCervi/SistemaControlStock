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
import { formatCurrency, kpisByPeriod, salesVsPurchasesTrend, topProductsSales, topProductsPurchases } from '@/lib/data'
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
  movements = [],
}: DashboardProps) {
  const [globalPeriod, setGlobalPeriod] = useState<GlobalPeriod>('mes')
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('todos')
  const [topProductsView, setTopProductsView] = useState<'ventas' | 'compras'>('ventas')
  const [trendView, setTrendView] = useState<'ventas' | 'compras'>('ventas')

  const currentKpis = kpisByPeriod[globalPeriod]
  const trendData = salesVsPurchasesTrend[globalPeriod]
  const topProducts = topProductsView === 'ventas' ? topProductsSales : topProductsPurchases
  
  const topProductsTotal = topProducts.reduce((sum, p) => sum + p.value, 0)

  const filteredMovements = useMemo(() => {
    if (movementFilter === 'todos') return movements
    const hoyStr = new Date().toISOString().split('T')[0]
    if (movementFilter === 'hoy') {
      return movements.filter(m => m.fecha.startsWith(hoyStr))
    }
    return movements.slice(0, 5)
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
              <div className="rounded-lg bg-emerald-100 p-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
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
              <div className="rounded-lg bg-orange-100 p-2">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Ganancia</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(currentKpis.ganancia)}</p>
              </div>
              <div className="rounded-lg bg-primary/20 p-2">
                <Wallet className="h-5 w-5 text-primary" />
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
                    trendView === 'ventas' ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Ventas
                </button>
                <button
                  onClick={() => setTrendView('compras')}
                  className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                    trendView === 'compras' ? 'bg-gray-700 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                  <Bar dataKey={trendView} fill={trendView === 'ventas' ? '#DC2626' : '#374151'} radius={[4, 4, 0, 0]} name={trendView === 'ventas' ? 'Ventas' : 'Compras'} />
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
                  const percentage = ((product.value / topProductsTotal) * 100).toFixed(1)
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: product.fill }} />
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
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {(() => {
                const ticketsAgrupados: Record<string, {
                  id: string;
                  titulo: string;
                  nota?: string | null;
                  fecha: string;
                  tipo: string;
                  totalUnidades: number;
                  items: { descripcion: string; cantidad: number }[];
                }> = {}

                filteredMovements.forEach(m => {
                  if (m.ticket_id) {
                    if (!ticketsAgrupados[m.ticket_id]) {
                      ticketsAgrupados[m.ticket_id] = {
                        id: m.ticket_id,
                        titulo: m.ticket_titulo || 'Movimiento de inventario',
                        nota: m.ticket_nota,
                        fecha: m.fecha,
                        tipo: m.tipo,
                        totalUnidades: 0,
                        items: []
                      }
                    }
                    ticketsAgrupados[m.ticket_id].totalUnidades += m.cantidad
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
                      items: []
                    }
                  }
                })

                const listaAgrupada = Object.values(ticketsAgrupados)

                if (listaAgrupada.length === 0) {
                  return <p className="text-xs text-center text-muted-foreground py-4">No hay movimientos registrados.</p>
                }

                return <HistorialInteractivo lista={listaAgrupada} />
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
                  <div key={product.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:translate-x-1 hover:bg-destructive/[0.02] hover:border-destructive/20">
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
                <div className="rounded-full bg-emerald-100 p-3 mb-3">
                  <Package className="h-6 w-6 text-emerald-600" />
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

// 💡 Subcomponente interactivo con control de persiana desplegable
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
        const esEntrada = ticket.tipo === 'ENTRADA'
        
        // Evaluamos si el titulo corresponde a una carga inicial del catalogo
        const esCargaManual = ticket.titulo.startsWith('Carga manual')
        
        // Candado lógico: si es carga manual, anulamos la capacidad de despliegue
        const tieneDetalle = ticket.items.length > 0 && !esCargaManual
        const isExpanded = expandedTickets[ticket.id]

        return (
          <div key={ticket.id} className="rounded-lg border border-border bg-card overflow-hidden transition-all duration-200">
            {/* Si no tiene detalle interactivo, se comporta como una fila estática sin efectos hover */}
            <button
              onClick={() => tieneDetalle && toggleTicket(ticket.id)}
              disabled={!tieneDetalle}
              className={`flex w-full items-center justify-between p-3 text-left transition-colors ${
                tieneDetalle ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                    esEntrada ? 'bg-emerald-100' : 'bg-orange-100'
                  }`}>
                  {esEntrada ? (
                    <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ticket.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateStr} • {timeStr} {tieneDetalle && `• ${isExpanded ? 'Ocultar' : 'Ver'} desglose`}
                  </p>
                </div>
              </div>
              
              <div className="ml-3 flex-shrink-0 text-right">
                <p className={`text-sm font-semibold ${esEntrada ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {esEntrada ? '+' : '-'}{ticket.totalUnidades} unid.
                </p>
              </div>
            </button>

            {/* El bloque de desglose queda completamente inaccesible para las altas del catálogo */}
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