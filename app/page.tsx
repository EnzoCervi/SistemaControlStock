"use client"

import { useState, useMemo, useEffect } from 'react'
import { frequentProducts} from '@/lib/data' // Removemos initialProducts
import { Sidebar } from '@/components/sidebar'
import { Dashboard } from '@/components/dashboard'
import { ProductCatalog } from '@/components/product-catalog'
import { BulkUpload } from '@/components/bulk-upload'
import { QuickEgress, type CartItem} from '@/components/quick-egress'
import { createClient } from '@/utils/supabase/client'
import { registrarMovimientoStock } from '@/app/actions/product'
import { crearProducto, obtenerProductosFrecuentesAction } from '@/app/actions/product'

// Definición estricta de la estructura real de Supabase
export interface Producto {
  id: string
  nombre: string
  presentacion: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  activo: boolean
}

export type ViewType = 'dashboard' | 'catalog' | 'upload' | 'egress'

export default function StockManagementApp() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  
  // Inicializamos el estado vacío
  const [products, setProducts] = useState<Producto[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [frequentProducts, setFrequentProducts] = useState<Producto[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Sincronización directa y limpia con Supabase
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

  // 2. El useEffect ahora solo la invoca al montar el componente
  useEffect(() => {
    cargarProductosReal()
    cargarMovimientosReal()
  }, [])

  // KPIs calculados con las propiedades reales de la base de datos
  const totalStock = useMemo(() => 
    products.reduce((acc, p) => acc + p.stock_actual, 0), [products]
  )
  
  const lowStockAlerts = useMemo(() => 
    products.filter(p => p.stock_actual < p.stock_minimo), [products]
  )
  
  const monthlyMovements = 384 // Simulado por ahora

  // Operaciones de Stock locales (sincronizadas tras las mutaciones)
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

  // Operaciones del Carrito adaptadas al nuevo esquema
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
      return [...prev, { ...product, quantity: 1, precio: 0 }] // precio placeholder para el formateador
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

  // 1. Agregamos los dos parámetros obligatorios que manda la interfaz entre los paréntesis
  const confirmEgress = async (tituloTicket: string, notaTicket: string): Promise<boolean> => {
    if (cart.length === 0) return false

    try {
      // 💡 2. Creamos el ID único para que todos los productos de este carrito compartan el mismo tiquet
      const nuevoTicketId = crypto.randomUUID()

      // Mandamos cada artículo del ticket a la base de datos
      for (const item of cart) {
        await registrarMovimientoStock({
          p_producto_id: item.id,
          p_cantidad: item.quantity,
          p_tipo: 'SALIDA',
          p_descripcion: `${item.nombre} (${item.presentacion})`, // Nombre del item para el desglose interno
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

  const cargarMovimientosReal = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .order('fecha', { ascending: false }) // Ordenamos por tu columna 'fecha' para ver lo más nuevo arriba
      .limit(10) // Traemos solo los últimos 10 para no sobrecargar el inicio

    if (error) {
      console.error('Error al traer movimientos:', error.message)
      return
    }
    if (data) {
      setMovements(data)
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
                await cargarProductosReal()   // Recarga la lista de productos
                await cargarMovimientosReal() // Recarga el historial del Dashboard al toque
              }}
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
          />
        )}
        </div>
      </main>
    </div>
  )
}