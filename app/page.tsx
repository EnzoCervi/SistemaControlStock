"use client"

import { useState, useMemo } from 'react'
import { initialProducts, frequentProducts, type Product, type CartItem } from '@/lib/data'
import { Sidebar } from '@/components/sidebar'
import { Dashboard } from '@/components/dashboard'
import { ProductCatalog } from '@/components/product-catalog'
import { BulkUpload } from '@/components/bulk-upload'
import { QuickEgress } from '@/components/quick-egress'

export type ViewType = 'dashboard' | 'catalog' | 'upload' | 'egress'

export default function StockManagementApp() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Calculate KPIs
  const totalStock = useMemo(() => 
    products.reduce((acc, p) => acc + p.stock, 0), [products]
  )
  
  const lowStockAlerts = useMemo(() => 
    products.filter(p => p.stock < p.minStock), [products]
  )
  
  const monthlyMovements = 384 // Simulated

  // Product operations
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: String(Date.now()),
    }
    setProducts(prev => [...prev, newProduct])
  }

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: newStock } : p))
    )
  }

  const bulkUpdateStock = (updates: { id: string; stock: number }[]) => {
    setProducts(prev =>
      prev.map(p => {
        const update = updates.find(u => u.id === p.id)
        return update ? { ...p, stock: update.stock } : p
      })
    )
  }

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
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
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    )
  }

  const confirmEgress = () => {
    // Deduct stock
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id)
      if (product) {
        updateProductStock(item.id, product.stock - item.quantity)
      }
    })
    // Clear cart
    setCart([])
    return true
  }

  const frequentProductsList = useMemo(() => 
    products.filter(p => frequentProducts.includes(p.id)), [products]
  )

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
              monthlyMovements={monthlyMovements}
              lowStockProducts={lowStockAlerts}
              products={products}
            />
          )}
          
          {currentView === 'catalog' && (
            <ProductCatalog
              products={products}
              onAddProduct={addProduct}
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
              frequentProducts={frequentProductsList}
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
