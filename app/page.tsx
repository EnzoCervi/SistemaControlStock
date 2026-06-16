"use client"

import { useState, useMemo, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Dashboard } from '@/components/dashboard'
import { ProductCatalog } from '@/components/product-catalog'
import { BulkUpload } from '@/components/bulk-upload'
import { QuickEgress, type CartItem} from '@/components/quick-egress'
import { createClient } from '@/utils/supabase/client'
import { registrarMovimientoStock, crearProducto, obtenerProductosFrecuentesAction } from '@/app/actions/product'
import { MovementsHistory } from '@/components/movements-history'
import { anularPedidoAction } from '@/app/actions/product'

export interface Producto {
  id: string
  nombre: string
  presentacion: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  activo: boolean
  precio_compra: number
  porcentaje_ganancia: number
  precio_venta: number
}

export type ViewType = 'dashboard' | 'catalog' | 'upload' | 'egress' | 'history'

export default function StockManagementApp() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  
  const [products, setProducts] = useState<Producto[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [frequentProducts, setFrequentProducts] = useState<Producto[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [kpis, setKpis] = useState({ totalVentas: 0, totalCompras: 0, ganancia: 0 })

  const cargarProductosReal = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error al traer productos de Supabase:', error.message)
      return
    }

    if (data) {
      setProducts(data as Producto[])
    }
    const frecuentes = await obtenerProductosFrecuentesAction()
    setFrequentProducts(frecuentes)
  }

  const cargarMovimientosReal = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
         .order('fecha', { ascending: false })

    if (error) {
      console.error('Error al traer movimientos:', error.message)
      return
    }
    if (data) {
      setMovements(data)
    }
  }

  // 🚀 FUNCIÓN INTERMEDIARIA CRUCIAL PARA LA ANULACIÓN OPERATIVA
  const handleAnularTicketReal = async (ticketId: string) => {
    try {
      // 1. Ejecutamos la lógica en el backend (Supabase)
      await anularPedidoAction(ticketId)
      
      // 2. Forzamos la actualización inmediata de los estados locales del cliente
      await cargarProductosReal()
      await cargarMovimientosReal()
    } catch (error) {
      console.error('Error al procesar la anulación en la interfaz:', error)
      throw error // Lanza el error para que lo capture el 'alert' del botón
    }
  }

  useEffect(() => {
    cargarProductosReal()
    cargarMovimientosReal()
  }, [])

  const totalStock = useMemo(() => 
    products.reduce((acc, p) => acc + p.stock_actual, 0), [products]
  )
  
  const lowStockAlerts = useMemo(() => 
    products.filter(p => p.stock_actual < p.stock_minimo), [products]
  )

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock_actual: newStock } : p))
    )
  }

  const bulkUpdateStock = (updates: { id: string; stock: number }[]) => {
    setProducts(prev =>
      prev.map(p => {
        const update = updates.find(u => u.id === p.id)
        return update ? { ...p, stock_actual: update.stock } : p
      })
    )
  }

  const addToCart = (product: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock_actual) }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1, precio: product.precio_venta }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item => {
        if (item.id === productId) {
          const product = products.find(p => p.id === productId)
          const maxStock = product ? product.stock_actual : item.quantity
          return { ...item, quantity: Math.min(quantity, maxStock) }
        }
        return item
      })
    )
  }

  const updateCartItemMargin = (productId: string, newMargin: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === productId) {
          const nuevoPrecio = Number((item.precio_compra * (1 + newMargin / 100)).toFixed(2))
          return { 
            ...item, 
            porcentaje_ganancia: newMargin, 
            precio: nuevoPrecio 
          }
        }
        return item
      })
    )
  }

  const confirmEgress = async (tituloTicket: string, notaTicket: string): Promise<boolean> => {
    if (cart.length === 0) return false

    try {
      const nuevoTicketId = crypto.randomUUID()

      for (const item of cart) {
        await registrarMovimientoStock({
          p_producto_id: item.id,
          p_cantidad: item.quantity,
          p_tipo: 'SALIDA',
          p_descripcion: `${item.nombre} (${item.presentacion})`,
          p_ticket_id: nuevoTicketId, 
          p_ticket_titulo: `Venta: ${tituloTicket.trim()}`,
          p_ticket_nota: notaTicket.trim() !== '' ? notaTicket.trim() : null, 
        })
      }

      await cargarProductosReal()
      await cargarMovimientosReal()

      const frecuentes = await obtenerProductosFrecuentesAction()
      setFrequentProducts(frecuentes)
      
      setCart([]) 
      return true
    } catch (error) {
      console.error('Error al confirmar la salida de stock:', error)
      return false
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        alertCount={lowStockAlerts.length}
      />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-6">
          {currentView === 'dashboard' && (
            <Dashboard
              totalStock={totalStock}
              alertCount={lowStockAlerts.length}
              monthlyMovements={movements.length}
              lowStockProducts={lowStockAlerts}
              products={products}
              movements={movements}
            />
          )}
          
          {currentView === 'catalog' && (
            <ProductCatalog
              products={products}
              onRefresh={async () => {
                await cargarProductosReal()
                await cargarMovimientosReal()
              }}
            />
          )}

          {currentView === 'history' && (
            <MovementsHistory 
              movements={movements} 
              products={products} 
              // 🎯 ENLAZADO: Ahora consume el puente interactivo local con refresco automático
              onAnularTicket={handleAnularTicketReal}
            />
          )}
          
          {currentView === 'upload' && (
            <BulkUpload
              onBulkUpdate={bulkUpdateStock}
              productCount={products.length}
            />
          )}
          
          {currentView === 'egress' && (
            <QuickEgress
              products={products}
              frequentProducts={frequentProducts}
              cart={cart}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              onUpdateQuantity={updateCartQuantity}
              onConfirmEgress={confirmEgress}
              onUpdateMargin={updateCartItemMargin} 
            />
          )}
        </div>
      </main>
    </div>
  )
}