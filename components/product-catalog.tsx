'use client'

import { useState, useTransition, useMemo } from 'react'
import { Search, Plus, Filter, FileText, Pencil, Trash2, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import { crearProducto, editarProducto, bajaLogicaProducto, ajustarStock } from '@/app/actions/product'
import { type Producto } from '@/app/page'

interface ProductCatalogProps {
  products: Producto[]
  onRefresh: () => Promise<void>
}

const categories = ['Analgésicos', 'Descartables', 'Antiinflamatorios', 'Antibióticos'] as const

const adjustmentReasons = [
  'Error de tipeo / Carga inicial',
  'Rotura',
  'Vencimiento',
  'Uso personal',
  'Otro'
] as const

export function ProductCatalog({ products, onRefresh }: ProductCatalogProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [isPending, startTransition] = useTransition()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)

  const [editFormData, setEditFormData] = useState({
    nombre: '',
    presentacion: '',
    categoria: 'Analgésicos',
    stock_minimo: 0,
    precio_compra: 0,        
    porcentaje_ganancia: 30, 
  })
  
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)
  const [adjustingProduct, setAdjustingProduct] = useState<Producto | null>(null)
  const [adjustFormData, setAdjustFormData] = useState({
    nuevo_stock: 0,
    motivo: 'Error de tipeo / Carga inicial' as typeof adjustmentReasons[number]
  })
  
  const precioVentaCalculadoEdit = useMemo(() => {
    const compra = editFormData.precio_compra || 0
    const ganancia = editFormData.porcentaje_ganancia || 0
    return Number((compra * (1 + ganancia / 100)).toFixed(2))
  }, [editFormData.precio_compra, editFormData.porcentaje_ganancia])
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null)
  
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    presentacion: '',
    categoria: 'Analgésicos',
    stock_actual: '' as any,  // 🎯 CORREGIDO: Cambiá el 1 por comillas vacías
    stock_minimo: '' as any,  // 🎯 CORREGIDO: Cambiá el 0 por comillas vacías
    precio_compra: 0,
    porcentaje_ganancia: 30,
  })

  const precioVentaCalculado = useMemo(() => {
    const compra = newProduct.precio_compra || 0
    const ganancia = newProduct.porcentaje_ganancia || 0
    return Number((compra * (1 + ganancia / 100)).toFixed(2))
  }, [newProduct.precio_compra, newProduct.porcentaje_ganancia])

  const filteredProducts = products.filter((product) => {
    const nombreProducto = product.nombre || ''
    const matchesSearch = nombreProducto.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.categoria === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = () => {
    // 🎯 Quitamos el bloqueo físico de stock de este IF comercial básico
    if (
      newProduct.nombre.trim() !== '' && 
      newProduct.presentacion.trim() !== '' &&
      newProduct.categoria.trim() !== '' &&
      newProduct.precio_compra > 0 &&
      newProduct.porcentaje_ganancia >= 0
    ) {
      startTransition(async () => {
        try {
          // Despachamos al backend parseando los números reales
          await crearProducto({
            nombre: newProduct.nombre,
            presentacion: newProduct.presentacion,
            categoria: newProduct.categoria,
            stock_actual: Number(newProduct.stock_actual), 
            stock_minimo: Number(newProduct.stock_minimo), 
            precio_compra: newProduct.precio_compra,
            porcentaje_ganancia: Math.floor(newProduct.porcentaje_ganancia)
          })
          await onRefresh()
          setNewProduct({
            nombre: '',
            presentacion: '',
            categoria: 'Analgésicos',
            stock_actual: '' as any,      // 🎯 ACÁ: Cambiá el 1 por comillas vacías
            stock_minimo: '' as any,      // 🎯 ACÁ: Cambiá el 0 por comillas vacías
            precio_compra: 0,
            porcentaje_ganancia: 30,
          })
          setIsDialogOpen(false)
        } catch (err: any) {
          alert(err.message || 'Ocurrió un error al procesar la solicitud.')
        }
      })
    } else {
      alert('Por favor, complete todos los campos obligatorios del formulario.')
    }
  }

  const handleSaveEdit = () => {
    if (editingProduct) {
      startTransition(async () => {
        try {
          await editarProducto(editingProduct.id, {
            ...editFormData,
            porcentaje_ganancia: Math.floor(editFormData.porcentaje_ganancia)
          })
          await onRefresh()
          setIsEditModalOpen(false)
          setEditingProduct(null)
        } catch (err) {
          console.error('Error al editar:', err)
        }
      })
    }
  }

  const handleSaveAdjustment = () => {
    if (adjustingProduct) {
      const stockActual = adjustingProduct.stock_actual || 0
      const nuevoStock = adjustFormData.nuevo_stock
      const delta = nuevoStock - stockActual

      if (delta === 0) {
        alert('El nuevo stock debe ser diferente al stock actual.')
        return
      }
      if (nuevoStock < 0) {
        alert('El stock disponible no puede quedar en números negativos.')
        return
      }

      startTransition(async () => {
        try {
          // 🎯 CORREGIDO: Estructura limpia "Ajuste stock: Nombre del Producto"
          await ajustarStock(adjustingProduct.id, {
            cantidad: Math.abs(delta),
            tipo: delta > 0 ? 'ENTRADA' : 'SALIDA',
            descripcion: `Ajuste stock: ${adjustingProduct.nombre}`,
            nuevo_stock: nuevoStock
          })
          await onRefresh()
          setIsAdjustmentModalOpen(false)
          setAdjustingProduct(null)
        } catch (err) {
          console.error('Error al ajustar stock:', err)
        }
      })
    }
  }

  const handleConfirmDelete = () => {
    if (productToDelete) {
      startTransition(async () => {
        try {
          await bajaLogicaProducto(productToDelete.id)
          await onRefresh()
          setIsDeleteModalOpen(false)
          setProductToDelete(null)
        } catch (err) {
          console.error('Error al dar de baja:', err)
        }
      })
    }
  }

  const handleOpenEditModal = (product: Producto) => {
    setEditingProduct(product)
    setEditFormData({
      nombre: product.nombre,
      presentacion: product.presentacion,
      categoria: product.categoria,
      stock_minimo: product.stock_minimo,
      precio_compra: product.precio_compra || 0,        
      porcentaje_ganancia: product.porcentaje_ganancia || 0,
    })
    setIsEditModalOpen(true)
  }

  const handleOpenAdjustmentModal = (product: Producto) => {
    setAdjustingProduct(product)
    setAdjustFormData({
      nuevo_stock: product.stock_actual,
      motivo: 'Error de tipeo / Carga inicial'
    })
    setIsAdjustmentModalOpen(true)
  }

  const handleOpenDeleteModal = (product: Producto) => {
    setProductToDelete(product)
    setIsDeleteModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Catálogo de Productos</h1>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} productos encontrados
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsPriceModalOpen(true)} className="gap-2 border-slate-400 text-slate-700 hover:bg-slate-100">
            <FileText className="h-4 w-4" />
            Actualizar Precios (PDF)
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir Producto
          </Button>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 [&>div]:overflow-x-hidden">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-center text-slate-700">Producto</TableHead>
                <TableHead className="font-semibold text-center text-slate-700">Presentación</TableHead>
                <TableHead className="font-semibold text-center text-slate-700">Categoría</TableHead>
                <TableHead className="font-semibold text-center text-slate-700">Precio Compra</TableHead>
                <TableHead className="font-semibold text-center text-slate-700">Ganancia</TableHead>
                <TableHead className="font-semibold text-center text-slate-700">Precio Venta</TableHead>
                <TableHead className="font-semibold text-center text-slate-700">Stock Actual</TableHead>
                <TableHead className="font-semibold text-center text-slate-700">Stock Mín.</TableHead>
                <TableHead className="font-semibold text-center text-slate-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="transition-all duration-300 hover:translate-x-1">
                  <TableCell className="font-medium text-center">{product.nombre}</TableCell>
                  <TableCell className="text-muted-foreground text-center">{product.presentacion || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal">{product.categoria}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    ${Number(product.precio_compra || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      {product.porcentaje_ganancia || 0}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-foreground">
                    ${Number(product.precio_venta || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {(() => {
                        const actual = Number(product.stock_actual) || 0
                        const minimo = Number(product.stock_minimo) || 0
                        
                        if (actual < minimo) {
                          return (
                            <span className="w-12 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-red-600 text-white border border-transparent shadow-sm">
                              {product.stock_actual}
                            </span>
                          )
                        }
                        if (actual < minimo * 1.5) {
                          return (
                            <span className="w-12 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-transparent shadow-sm">
                              {product.stock_actual}
                            </span>
                          )
                        }
                        return (
                          <span className="w-12 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                            {product.stock_actual}
                          </span>
                        )
                      })()}

                      <button
                        onClick={() => handleOpenAdjustmentModal(product)}
                        className="text-slate-400 hover:text-primary p-1 rounded-md transition-colors cursor-pointer hover:bg-slate-200 focus:outline-none flex items-center justify-center"
                        title="Ajustar stock físico (Mermas / Roturas)"
                      >
                        <Settings className="h-4 w-4 shrink-0" />
                      </button>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center text-muted-foreground">{product.stock_minimo}</TableCell>
                  <TableCell className="text-center pr-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                        title="Editar producto"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(product)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center"
                        title="Dar de baja"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODALES CON CONTROL DE CICLO DE VIDA ACTIVO */}
      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Producto</DialogTitle>
              <DialogDescription>Complete los datos del nuevo producto para el catálogo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input id="name" value={newProduct.nombre} onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })} placeholder="Ej: Ibuprofeno 400mg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="presentation">Presentación</Label>
                  <Input id="presentation" value={newProduct.presentacion} onChange={(e) => setNewProduct({ ...newProduct, presentacion: e.target.value })} placeholder="Ej: Caja x 20 comp." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={newProduct.categoria} onValueChange={(value) => setNewProduct({ ...newProduct, categoria: value })} >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="precio_compra">Precio de Compra *</Label>
                  <Input id="precio_compra" type="number" step="0.01" min="0" placeholder="Ej: 1500.00" value={newProduct.precio_compra || ''} onChange={(e) => setNewProduct({ ...newProduct, precio_compra: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="porcentaje_ganancia">Porcentaje de Ganancia *</Label>
                  <Input id="porcentaje_ganancia" type="number" step="1" min="0" placeholder="Ej: 30" value={newProduct.porcentaje_ganancia || ''} onChange={(e) => setNewProduct({ ...newProduct, porcentaje_ganancia: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="precio_venta" className="text-muted-foreground">Precio de Venta (Calculado Automáticamente)</Label>
                <Input id="precio_venta" type="text" value={`$ ${precioVentaCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} disabled className="bg-muted text-muted-foreground font-semibold border-border" />
              </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="1"
                      value={newProduct.stock_actual}
                      // 🎯 CORREGIDO: Ahora sí despacha el estado al formulario de forma limpia
                      onChange={(e) => setNewProduct({ ...newProduct, stock_actual: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minStock">Stock Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={newProduct.stock_minimo}
                      // 🎯 OPTIMIZADO: Validación elástica por si borran todo el casillero con Backspace
                      onChange={(e) => setNewProduct({ ...newProduct, stock_minimo: e.target.value })}
                    />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button onClick={handleAddProduct} disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Producto'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isEditModalOpen && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
              <DialogDescription>Modifique los datos del producto seleccionado.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre del Producto</Label>
                <Input id="edit-name" value={editFormData.nombre} onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-presentation">Presentación</Label>
                <Input id="edit-presentation" value={editFormData.presentacion} onChange={(e) => setEditFormData({ ...editFormData, presentacion: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Categoría</Label>
                  <Select value={editFormData.categoria} onValueChange={(value) => setEditFormData({ ...editFormData, categoria: value })} >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-minStock">Stock Mínimo</Label>
                  <Input id="edit-minStock" type="number" min="0" value={editFormData.stock_minimo} onChange={(e) => setEditFormData({ ...editFormData, stock_minimo: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-precio_compra">Precio de Compra *</Label>
                  <Input id="edit-precio_compra" type="number" step="0.01" min="0" value={editFormData.precio_compra || ''} onChange={(e) => setEditFormData({ ...editFormData, precio_compra: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-porcentaje_ganancia">Porcentaje de Ganancia *</Label>
                  <Input id="edit-porcentaje_ganancia" type="number" step="1" min="0" value={editFormData.porcentaje_ganancia || ''} onChange={(e) => setEditFormData({ ...editFormData, porcentaje_ganancia: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-precio_venta" className="text-muted-foreground">Precio de Venta (Calculado Automáticamente)</Label>
                <Input id="edit-precio_venta" type="text" value={`$ ${precioVentaCalculadoEdit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} disabled className="bg-muted text-muted-foreground font-semibold border-border" />
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 🚀 MODAL DE AJUSTE CON FILAS VERTICALES PROTEGIDAS CONTRA OVERFLOW */}
      {/* 🚀 MODAL DE AJUSTE ADAPTADO PARA CUMPLIR CON RADIX UI Y ACCESIBILIDAD */}
      {isAdjustmentModalOpen && (
        <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
          <DialogContent className="sm:max-w-[440px] p-6 gap-0">
            {/* 🎯 SE REINTRODUCEN LOS COMPONENTES NATIVOS CON ESTILOS PERSONALIZADOS */}
            <DialogHeader className="text-center sm:text-left pb-1">
              <DialogTitle className="text-lg font-bold text-foreground">
                Ajustar Inventario Físico
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Corrija las unidades disponibles en estantería para resolver mermas, pérdidas o roturas.
              </DialogDescription>
            </DialogHeader>

            {adjustingProduct && (
              <div className="grid gap-4 py-4">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold block uppercase tracking-wide mb-1 text-amber-700">💡 Recordatorio importante:</span>
                  Si estás corrigiendo un error de una factura de compra, realizá una carga nueva o anulá el ticket desde el Historial para mantener la consistencia en el flujo de caja.
                </div>

                <div className="text-xs bg-muted/60 p-3 rounded-lg space-y-1 text-muted-foreground border border-border/40">
                  <p>Producto: <span className="font-bold text-foreground">{adjustingProduct.nombre}</span></p>
                  <p>Stock actual digital: <span className="font-bold text-foreground">{adjustingProduct.stock_actual} unidades</span></p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="adj-stock" className="text-xs font-semibold">Nuevo Stock Real</Label>
                    <Input
                      id="adj-stock"
                      type="number"
                      min="0"
                      value={adjustFormData.nuevo_stock}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, nuevo_stock: parseInt(e.target.value) || 0 })}
                      className="h-10 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  
                  <div className="grid gap-1.5">
                    <Label htmlFor="adj-reason" className="text-xs font-semibold">Motivo del Ajuste</Label>
                    <Select
                      value={adjustFormData.motivo}
                      onValueChange={(value) => setAdjustFormData({ ...adjustFormData, motivo: value as any })}
                    >
                      <SelectTrigger id="adj-reason" className="w-full h-10 bg-background border-border flex justify-between items-center px-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {adjustmentReasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => { setIsAdjustmentModalOpen(false); setAdjustingProduct(null); }} disabled={isPending} className="mt-2 sm:mt-0">
                Cancelar
              </Button>
              <Button onClick={handleSaveAdjustment} disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isPending ? 'Procesando...' : 'Confirmar Ajuste'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isDeleteModalOpen && (
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirmar Baja</DialogTitle>
              <DialogDescription>¿Estás seguro de que deseas dar de baja este producto? No se mostrará en el catálogo activo.</DialogDescription>
            </DialogHeader>
            {productToDelete && (
              <div className="py-2">
                <p className="text-sm text-muted-foreground">Producto: <span className="font-medium text-foreground">{productToDelete.nombre}</span></p>
              </div>
            )}
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isPending}>Volver</Button>
              <Button onClick={handleConfirmDelete} variant="destructive" disabled={isPending}>{isPending ? 'Procesando...' : 'Confirmar Baja'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}