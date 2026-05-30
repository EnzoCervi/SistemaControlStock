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
import type { Product, CartItem } from '@/lib/data'

interface QuickEgressProps {
  products: Product[]
  frequentProducts: Product[]
  cart: CartItem[]
  onAddToCart: (product: Product) => void
  onRemoveFromCart: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onConfirmEgress: () => boolean
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

  const filteredProducts = useMemo(() => {
    if (!search) return []
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.drug.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5)
  }, [products, search])

  const cartTotal = useMemo(() => 
    cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  )

  const cartItemCount = useMemo(() => 
    cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  )

  const handleConfirm = () => {
    const success = onConfirmEgress()
    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  const handleSelectProduct = (product: Product) => {
    onAddToCart(product)
    setSearch('')
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 lg:flex-row">
      {/* Left Side - Search and Products */}
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Venta Rápida</h1>
          <p className="text-sm text-muted-foreground">
            Seleccione productos para registrar la salida de stock
          </p>
        </div>

        {/* Search Bar */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por nombre o droga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 text-base"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {filteredProducts.length > 0 && (
              <div className="mt-2 rounded-lg border border-border bg-card shadow-lg">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.presentation}</p>
                    </div>
                    <Badge variant="secondary">{product.stock} disp.</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Frequent Products Grid */}
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
                    disabled={product.stock === 0}
                    className={cn(
                      "group relative flex flex-col items-start rounded-lg border p-4 text-left transition-all hover:border-primary hover:shadow-md",
                      inCart ? "border-primary bg-primary/5" : "border-border bg-card",
                      product.stock === 0 && "cursor-not-allowed opacity-50"
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
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.stock} disponibles
                    </p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Cart */}
      <Card className="w-full border-border lg:w-96">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Ticket de Venta</CardTitle>
            {cart.length > 0 && (
              <Badge variant="secondary">{cartItemCount} items</Badge>
            )}
          </div>
        </CardHeader>
        
        <div className="flex flex-1 flex-col">
          {cart.length === 0 ? (
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
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)} c/u
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
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
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveFromCart(item.id)}
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

                <Button
                  onClick={handleConfirm}
                  className="h-12 w-full gap-2 bg-emerald-600 text-base font-medium hover:bg-emerald-700"
                >
                  {showSuccess ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      ¡Venta Confirmada!
                    </>
                  ) : (
                    'Confirmar Venta'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
