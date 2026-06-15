"use client"

import { useState, useMemo } from 'react'
import { Search, Plus, Minus, Trash2, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/data'

// Importamos el molde oficial de la aplicación
import { type Producto } from '@/app/page'

export interface CartItem extends Producto {
  quantity: number
  precio: number 
}

interface QuickEgressProps {
  products: Producto[]
  frequentProducts: Producto[]
  cart: CartItem[]
  onAddToCart: (product: Producto) => void
  onRemoveFromCart: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onConfirmEgress: (tituloTicket: string, notaTicket: string) => Promise<boolean> 
  onUpdateMargin: (productId: string, newMargin: number) => void
}

export function QuickEgress({
  products,
  frequentProducts,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onConfirmEgress,
  onUpdateMargin,
}: QuickEgressProps) {
  const [search, setSearch] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false) 
  
  const [ticketTitulo, setTicketTitulo] = useState('')
  const [ticketNota, setTicketNota] = useState('')
  const [editingMarginId, setEditingMarginId] = useState<string | null>(null)
  const [tempMargin, setTempMargin] = useState<number>(0)

  // Buscador 
  const filteredProducts = useMemo(() => {
    if (!search) return []
    return products.filter((p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5)
  }, [products, search])

  const cartTotal = useMemo(() => 
    cart.reduce((acc, item) => acc + item.precio * item.quantity, 0),
    [cart]
  )

  const cartItemCount = useMemo(() => 
    cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  )

  const handleConfirm = async () => {
    if (!ticketTitulo.trim()) return

    setIsProcessing(true)
    const success = await onConfirmEgress(ticketTitulo, ticketNota)
    setIsProcessing(true) // Mantiene el estado visual seguro
    
    setIsProcessing(false)
    
    if (success) {
      setShowSuccess(true)
      setTicketTitulo('') 
      setTicketNota('')   
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  const handleSelectProduct = (product: Producto) => {
    onAddToCart(product)
    setSearch('')
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-6 lg:flex-row overflow-hidden">
      {/* Panel Izquierdo - Buscador y Frecuentes */}
      <div className="flex flex-1 flex-col space-y-6 overflow-y-auto pr-1">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Venta Rápida</h1>
          <p className="text-sm text-muted-foreground">
            Seleccione productos para registrar la salida de stock
          </p>
        </div>

        {/* Barra de Búsqueda */}
        <Card className="border-border flex-shrink-0">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 text-base"
              />
            </div>
            
            {/* Dropdown de Resultados */}
            {filteredProducts.length > 0 && (
              <div className="mt-2 rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{product.nombre}</p>
                      <p className="text-xs text-muted-foreground">{product.presentacion}</p>
                    </div>
                    <Badge variant="secondary">{product.stock_actual} disp.</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos Frecuentes */}
        <Card className="flex-1 border-border min-h-[250px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Productos Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {frequentProducts.map((product) => {
                const inCart = cart.find((item) => item.id === product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock_actual === 0}
                    className={cn(
                      "group relative flex flex-col items-start rounded-lg border p-4 text-left transition-all hover:border-primary hover:shadow-md",
                      inCart ? "border-primary bg-primary/5" : "border-border bg-card",
                      product.stock_actual === 0 && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {inCart && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {inCart.quantity}
                      </div>
                    )}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
                      <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground line-clamp-2">
                      {product.nombre}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.stock_actual} disponibles
                    </p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      
      <Card className="w-full border-border lg:w-96 flex flex-col h-full overflow-hidden bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            
            <CardTitle className="text-lg font-semibold text-foreground">Ticket de Venta</CardTitle>
            {cart.length > 0 && (
              <Badge variant="secondary">{cartItemCount} items</Badge>
            )}
          </div>
        </CardHeader>
        
        <div className="flex flex-1 flex-col overflow-hidden pt-0">
          {showSuccess ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-150">
              <embed 
                type="image/svg+xml"
                src="/success.svg" 
                width="200"
                height="200"
                className="h-48 w-48 mb-4 pointer-events-none"
              />
              <p className="text-lg font-semibold text-emerald-800">
                Venta confirmada
              </p>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">
                Sin productos seleccionados
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Busque o seleccione productos para agregar
              </p>
            </div>
          ) : (
            <>
              {/* 🔄 LISTA CON SCROLL INDEPENDIENTE SEGURO (Ocupa solo el espacio disponible del medio) */}
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3 space-y-3 border-b border-dashed border-border/60 mt-0">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.nombre}</p>
                      
                      <div className="mt-0.5 space-y-1">
                        {/* Precio Unitario */}
                        <p className="text-xs text-muted-foreground">
                          ${Number(item.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u
                        </p>

                        {/* LÓGICA DE MODIFICACIÓN DE MARGEN INLINE */}
                        {editingMarginId === item.id ? (
                          <div className="flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                            <div className="relative flex items-center max-w-[80px]">
                              <Input
                                type="number"
                                min="0"
                                value={tempMargin}
                                onChange={(e) => setTempMargin(Number(e.target.value) || 0)}
                                className="h-6 pr-5 text-xs font-semibold border-primary/40 focus-visible:ring-primary"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onUpdateMargin(item.id, tempMargin)
                                    setEditingMarginId(null)
                                  }
                                }}
                              />
                              <span className="absolute right-1.5 text-[10px] font-bold text-muted-foreground">%</span>
                            </div>
                            <button
                              onClick={() => {
                                onUpdateMargin(item.id, tempMargin)
                                setEditingMarginId(null)
                              }}
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                            >
                              Listo
                            </button>
                            <button
                              onClick={() => setEditingMarginId(null)}
                              className="text-[11px] text-muted-foreground hover:text-foreground px-1"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            {/* 🧠 CORRECCIÓN: Restablecido el texto base del margen que se había perdido */}
                            {' '}
                            <span
                              onClick={() => {
                                setEditingMarginId(item.id)
                                setTempMargin(item.porcentaje_ganancia)
                              }}
                              className="text-primary underline cursor-pointer font-medium hover:text-primary/80 transition-colors"
                            >
                              Modificar margen
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={isProcessing}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_actual || isProcessing}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => onRemoveFromCart(item.id)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              
              <div className="border-t border-border p-4 bg-card flex-shrink-0 space-y-4">

                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Identificador o Destino del Ticket *
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: Pedido Farmacia Central / Cliente Particular"
                      value={ticketTitulo}
                      onChange={(e) => setTicketTitulo(e.target.value)}
                      className="border-border h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Observaciones (Opcional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: Retira motomandado / Aplicado descuento"
                      value={ticketNota}
                      onChange={(e) => setTicketNota(e.target.value)}
                      className="border-border h-10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing || cart.length === 0 || !ticketTitulo.trim()}
                  className="h-12 w-full gap-2 bg-emerald-600 text-base font-medium hover:bg-emerald-700 mt-2"
                >
                  {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}