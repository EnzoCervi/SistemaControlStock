"use client"

import { useState, useMemo } from 'react'
import { Search, Plus, Minus, Trash2, CheckCircle2, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/data'

// 💡 Importamos el molde oficial de la aplicación
import { type Producto } from '@/app/page'

// Definimos la estructura limpia del carrito basada en nuestro Producto
export interface CartItem extends Producto {
  quantity: number
  precio: number // Placeholder numérico para no romper el formateador de moneda
}

interface QuickEgressProps {
  products: Producto[]
  frequentProducts: Producto[]
  cart: CartItem[]
  onAddToCart: (product: Producto) => void
  onRemoveFromCart: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onConfirmEgress: (tituloTicket: string, notaTicket: string) => Promise<boolean> 
}

export function QuickEgress({
  products,
  frequentProducts,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onConfirmEgress,
}: QuickEgressProps) {
  const [search, setSearch] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false) // Estado de carga para el botón
  const [ticketTitulo, setTicketTitulo] = useState('')
  const [ticketNota, setTicketNota] = useState('')

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

  // Manejador asíncrono para la confirmación de la salida
  const handleConfirm = async () => {
    // Candado de seguridad básico: si no hay título, no hace nada
    if (!ticketTitulo.trim()) return

    setIsProcessing(true)
    
    // 💡 PASAMOS LOS DOS PARÁMETROS REALES (Esto borra tu línea roja)
    const success = await onConfirmEgress(ticketTitulo, ticketNota)
    
    setIsProcessing(false)
    
    if (success) {
      setShowSuccess(true)
      setTicketTitulo('') // Limpiamos el título para la próxima venta
      setTicketNota('')   // Limpiamos la nota para la próxima venta
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  const handleSelectProduct = (product: Producto) => {
    onAddToCart(product)
    setSearch('')
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 lg:flex-row">
      {/* Panel Izquierdo - Buscador y Frecuentes */}
      <div className="flex flex-1 flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Venta Rápida</h1>
          <p className="text-sm text-muted-foreground">
            Seleccione productos para registrar la salida de stock
          </p>
        </div>

        {/* Barra de Búsqueda */}
        <Card className="border-border">
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
              <div className="mt-2 rounded-lg border border-border bg-card shadow-lg">
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
        <Card className="flex-1 border-border">
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

      {/* Panel Derecho - Ticket de Venta / Carrito */}
      <Card className="w-full border-border lg:w-96">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Ticket de Venta</CardTitle>
            {cart.length > 0 && (
              <Badge variant="secondary">{cartItemCount} items</Badge>
            )}
          </div>
        </CardHeader>
        
        <div className="flex flex-1 flex-col justify-center">
          {showSuccess ? (
            /* ZONA A: Si la venta fue exitosa, se adueña del panel para mostrar la animación centrada */
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
            /* ZONA B: Estado de espera estándar cuando no hay productos */
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
            /* ZONA C: El flujo del ticket activo con sus inputs y el botón plano */
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.precio)} c/u
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
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
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveFromCart(item.id)}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t border-border p-4">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(cartTotal)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 my-4 border-t border-b border-border py-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Identificador o Destino del Ticket *
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: Pedido Farmacia Central / Cliente Particular"
                      value={ticketTitulo}
                      onChange={(e) => setTicketTitulo(e.target.value)}
                      className="border-border"
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
                      className="border-border"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing || cart.length === 0 || !ticketTitulo.trim()}
                  className="h-12 w-full gap-2 bg-emerald-600 text-base font-medium hover:bg-emerald-700"
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