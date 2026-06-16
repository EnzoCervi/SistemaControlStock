"use client"

import { useState, useMemo, useTransition } from 'react' // 🚀 Se importó useTransition
import { 
  Search, 
  X,
  SlidersHorizontal,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from '@/lib/data'
import { type Producto } from '@/app/page'
import { type MovimientoReal } from './dashboard'

interface MovementsHistoryProps {
  movements: MovimientoReal[]
  products: Producto[]
  onAnularTicket: (ticketId: string) => Promise<void> | void // Ajustado para soportar promesas del back
}

type PeriodFilter = 'todos' | 'hoy' | 'semana' | 'mes' | 'año'
type TypeFilter = 'todos' | 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'ANULADO'

interface TicketAgrupado {
  id: string
  ticket_id: string | null
  ticket_titulo: string
  fecha: string
  tipo: 'ENTRADA' | 'SALIDA'
  totalUnidades: number
  totalDinero: number
  nota?: string | null
  es_ajuste?: boolean
  estado: 'activo' | 'anulado'
}

export function MovementsHistory({
  movements = [],
  products = [],
  onAnularTicket,
}: MovementsHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('mes')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos')
  const [selectedTicket, setSelectedTicket] = useState<TicketAgrupado | null>(null)
  
  // 🚀 Control local de carga para que el botón responda al instante
  const [isPending, startTransition] = useTransition()

  const comprobarEsAjuste = (m: MovimientoReal) => {
    return !!(
      m.es_ajuste || 
      m.descripcion?.startsWith('Ajuste stock:') || 
      m.ticket_titulo?.startsWith('Ajuste stock:')
    )
  }

  const processedTickets = useMemo(() => {
    const now = new Date()
    
    const currentDay = now.getDay()
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1
    const mondayOfThisWeek = new Date(now)
    mondayOfThisWeek.setDate(now.getDate() - distanceToMonday)
    mondayOfThisWeek.setHours(0, 0, 0, 0)

    const filteredMovements = movements.filter(m => {
      const mDate = new Date(m.fecha)
      if (isNaN(mDate.getTime())) return false

      if (periodFilter === 'hoy') return m.fecha.startsWith(now.toISOString().split('T')[0])
      if (periodFilter === 'semana') return mDate.getTime() >= mondayOfThisWeek.getTime() && mDate.getTime() <= now.getTime()
      if (periodFilter === 'mes') return mDate.getFullYear() === now.getFullYear() && mDate.getMonth() === now.getMonth()
      if (periodFilter === 'año') return mDate.getFullYear() === now.getFullYear()
      return true
    }).filter(m => {
      // @ts-ignore
      const esAnulado = m.estado === 'anulado'
      const isAjuste = comprobarEsAjuste(m)
      
      if (typeFilter === 'todos') return true
      if (typeFilter === 'ANULADO') return esAnulado
      if (typeFilter === 'AJUSTE') return isAjuste && !esAnulado
      return m.tipo === typeFilter && !isAjuste && !esAnulado
    })

    const cacheAgrupada: Record<string, TicketAgrupado> = {}

    filteredMovements.forEach(m => {
      const isAjuste = comprobarEsAjuste(m)
      // @ts-ignore
      const esAnulado = m.estado === 'anulado'
      
      if (isAjuste) {
        const llaveAjuste = `ajuste-${m.id}`
        cacheAgrupada[llaveAjuste] = {
          id: llaveAjuste,
          ticket_id: null,
          ticket_titulo: m.descripcion,
          fecha: m.fecha,
          tipo: m.tipo, 
          totalUnidades: m.cantidad,
          totalDinero: 0, 
          es_ajuste: true,
          nota: m.ticket_nota,
          estado: esAnulado ? 'anulado' : 'activo'
        }
        return
      }

      const isVenta = m.tipo === 'SALIDA'
      const prod = products.find(p => p.id === m.producto_id)
      const pUnitario = prod ? (isVenta ? (prod.precio_venta || 0) : (prod.precio_compra || 0)) : 0
      const montoItem = esAnulado ? 0 : m.cantidad * pUnitario
      const llaveComprobante = m.ticket_id || `suelto-${m.id}`

      if (!cacheAgrupada[llaveComprobante]) {
        cacheAgrupada[llaveComprobante] = {
          id: llaveComprobante,
          ticket_id: m.ticket_id || null,
          ticket_titulo: m.ticket_id ? (m.ticket_titulo || 'Pedido de Stock') : m.descripcion,
          fecha: m.fecha,
          tipo: m.tipo,
          totalUnidades: 0,
          totalDinero: 0,
          es_ajuste: false,
          nota: m.ticket_nota,
          estado: esAnulado ? 'anulado' : 'activo'
        }
      }

      cacheAgrupada[llaveComprobante].totalUnidades += m.cantidad
      cacheAgrupada[llaveComprobante].totalDinero += montoItem
    })

    return Object.values(cacheAgrupada)
      .filter(t => {
        const query = searchTerm.toLowerCase()
        return t.ticket_titulo.toLowerCase().includes(query) || (t.ticket_id && t.ticket_id.toLowerCase().includes(query))
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [movements, products, searchTerm, periodFilter, typeFilter])

  const selectedTicketItems = useMemo(() => {
    if (!selectedTicket) return []
    return movements.filter(m => selectedTicket.ticket_id ? m.ticket_id === selectedTicket.ticket_id : `suelto-${m.id}` === selectedTicket.id)
  }, [movements, selectedTicket])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Historial de Movimientos</h1>
          <p className="text-sm text-muted-foreground">{processedTickets.length} registros encontrados</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          <div className="relative w-full flex-1 md:max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título o N° de ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 rounded-lg border bg-background pl-10 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Periodo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
                <SelectItem value="año">Este año</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="SALIDA">Ventas (Salidas)</SelectItem>
                <SelectItem value="ENTRADA">Compras (Entradas)</SelectItem>
                <SelectItem value="AJUSTE">Ajustes Operativos</SelectItem>
                <SelectItem value="ANULADO">Anulados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-semibold uppercase">
                <th className="p-4 text-center">Fecha / Hora</th>
                <th className="p-4 text-center">Comprobante / Origen</th>
                <th className="p-4 text-center">Nombre del Pedido</th>
                <th className="p-4 text-center">Tipo</th>
                <th className="p-4 text-center">Unidades</th>
                <th className="p-4 text-center">Monto</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {processedTickets.map((ticket) => {
                const isVenta = ticket.tipo === 'SALIDA'
                const esAjuste = ticket.es_ajuste
                const esAnulado = ticket.estado === 'anulado'

              return (
                  /* 🎯 CORREGIDO: Estilo forzado inline para saltear cualquier bloqueo de color de la tabla */
                  <tr 
                    key={ticket.id} 
                    className={`text-center transition-colors ${
                      esAnulado 
                        ? 'text-red-900/70 line-through border-red-100' 
                        : 'hover:bg-muted/20'
                    }`}
                    style={esAnulado ? { backgroundColor: '#fff5f5' } : undefined}
                  >
                    <td className="p-4 text-xs font-medium">{new Date(ticket.fecha).toLocaleString('es-AR')}</td>
                    <td className="p-4 text-xs font-mono">{esAjuste ? <span className="text-muted-foreground italic">Ajuste Físico</span> : (ticket.ticket_id ? `#${ticket.ticket_id.slice(0,8)}...` : 'Operación Directa')}</td>
                    <td className="p-4 text-xs font-semibold">{ticket.ticket_titulo}</td>
                    <td className="p-4 flex justify-center">
                      {esAnulado ? (
                        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-100/50 text-[10px] font-bold"><XCircle className="h-3 w-3 mr-1" />ANULADO</Badge>
                      ) : esAjuste ? (
                        <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-bold"><SlidersHorizontal className="h-3 w-3 mr-1" />AJUSTE ({ticket.tipo === 'SALIDA' ? 'BAJA' : 'ALTA'})</Badge>
                      ) : (
                        <Badge className={isVenta ? "bg-success/10 text-success border-none" : "bg-secondary text-secondary-foreground border-none"}>{isVenta ? 'VENTA' : 'COMPRA'}</Badge>
                      )}
                    </td>
                    <td className="p-4 font-bold text-xs">{ticket.totalUnidades} <span className={esAnulado ? "text-red-700/50 font-normal" : "text-muted-foreground font-normal"}>unid.</span></td>
                    <td className={`p-4 font-bold text-xs ${esAnulado ? 'text-red-500/70' : esAjuste ? 'text-muted-foreground/60' : (isVenta ? 'text-success' : 'text-destructive')}`}>{esAnulado ? '$0,00' : esAjuste ? '—' : (isVenta ? `+${formatCurrency(ticket.totalDinero)}` : `-${formatCurrency(ticket.totalDinero)}`)}</td>
                    
                    {/* 🎯 CORREGIDO: Reemplazo definitivo del botón rojo por el texto "ANULADO" en rojo firme */}
                    <td className="p-4 text-center">
                      {esAnulado ? (
                        <span className="text-xs font-black text-red-600 uppercase tracking-wider bg-red-100/50 px-3 py-1.5 rounded-md border border-red-200">
                          Anulado
                        </span>
                      ) : esAjuste ? (
                        <span className="text-xs text-muted-foreground/50 font-medium italic">Auditoría fija</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            disabled={isPending}
                            onClick={() => setSelectedTicket(ticket)} 
                            className="h-8 rounded-lg border px-3 text-xs font-medium cursor-pointer hover:bg-accent disabled:opacity-50"
                          >
                            Ver detalle
                          </button>
                          
                          {ticket.ticket_id && (
                            <button 
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                const seguro = confirm(`¿Estás seguro de que deseas anular este pedido comercial?\n\nEsta acción revertirá el stock de los productos asociados y lo descontará de las cajas de forma definitiva.`)
                                if (seguro) {
                                  startTransition(async () => {
                                    try {
                                      await onAnularTicket(ticket.ticket_id!)
                                    } catch (err: any) {
                                      alert(err.message || 'Error al intentar anular el pedido.')
                                    }
                                  })
                                }
                              }} 
                              className={`h-8 rounded-lg bg-destructive px-3 text-xs font-medium text-destructive-foreground transition-all flex items-center justify-center min-w-[95px] ${
                                isPending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-destructive/90'
                              }`}
                            >
                              {isPending ? 'Anulando...' : 'Anular pedido'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )  
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL DETALLE */}
      {selectedTicket && !selectedTicket.es_ajuste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-lg bg-card border">
            <CardHeader className="pb-4 border-b flex flex-row items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-bold">{selectedTicket.ticket_titulo}</CardTitle>
                  <Badge className={selectedTicket.tipo === 'SALIDA' ? "bg-success/10 text-success border-none" : "bg-secondary border-none"}>{selectedTicket.tipo === 'SALIDA' ? 'Venta' : 'Compra'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(selectedTicket.fecha).toLocaleString('es-AR')}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-muted-foreground p-1"><X className="h-4 w-4" /></button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Desglose operativo:</p>
                <div className="divide-y text-xs">
                  {selectedTicketItems.map((item, idx) => {
                    const prod = products.find(p => p.id === item.producto_id)
                    const pUnit = selectedTicket.tipo === 'SALIDA' ? (prod?.precio_venta || 0) : (prod?.precio_compra || 0)
                    return (
                      <div key={idx} className="flex justify-between py-2">
                        <div>
                          <p className="font-semibold">{item.descripcion}</p>
                          <p className="text-muted-foreground">{item.cantidad} unidades x {formatCurrency(pUnit)} c/u</p>
                        </div>
                        <span className="font-bold">{formatCurrency(item.cantidad * pUnit)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-xs font-semibold">Total Neto Operación</span>
                <p className="text-lg font-black text-success">{formatCurrency(selectedTicket.totalDinero)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}