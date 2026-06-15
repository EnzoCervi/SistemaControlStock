'use client'

import { useState, useTransition, useMemo } from 'react'
import { Search, Plus, Filter, FileText, Check, Pencil, Trash2 } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import { crearProducto, editarProducto, bajaLogicaProducto } from '@/app/actions/product'
import { type Producto } from '@/app/page'

interface ProductCatalogProps {
  products: Producto[]
  onRefresh: () => Promise<void>
}

const categories = ['Analgésicos', 'Descartables', 'Antiinflamatorios', 'Antibióticos'] as const

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
    stock_actual: 1,
    stock_minimo: 0,
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
    if (
      newProduct.nombre.trim() !== '' && 
      newProduct.presentacion.trim() !== '' &&
      newProduct.categoria.trim() !== '' &&
      newProduct.stock_actual >= 1 &&
      newProduct.precio_compra > 0 &&
      newProduct.porcentaje_ganancia >= 0
    ) {
      startTransition(async () => {
        try {
          await crearProducto({
            nombre: newProduct.nombre,
            presentacion: newProduct.presentacion,
            categoria: newProduct.categoria,
            stock_actual: newProduct.stock_actual,
            stock_minimo: newProduct.stock_minimo,
            precio_compra: newProduct.precio_compra,
            porcentaje_ganancia: Math.floor(newProduct.porcentaje_ganancia)
          })
          await onRefresh()
          setNewProduct({
            nombre: '',
            presentacion: '',
            categoria: 'Analgésicos',
            stock_actual: 1,
            stock_minimo: 0,
            precio_compra: 0,
            porcentaje_ganancia: 30,
          })
          setIsDialogOpen(false)
        } catch (err) {
          console.error('Error al guardar:', err)
        }
      })
    } else {
      alert('Por favor, complete todos los campos obligatorios. El stock inicial debe ser de al menos 1 unidad y el precio de compra debe ser mayor a 0.')
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

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        setUploadedFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadedFile(files[0])
    }
  }

  const handleProcessFile = async () => {
    if (!uploadedFile) return
    setIsLoadingFile(true)
    setLoadingProgress(0)

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + Math.random() * 30
      })
    }, 300)

    await new Promise((resolve) => setTimeout(resolve, 2500))
    clearInterval(interval)
    setLoadingProgress(100)
    setIsLoadingFile(false)
    setShowSuccess(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))
    setShowSuccess(false)
    setUploadedFile(null)
    setLoadingProgress(0)
    setIsPriceModalOpen(false)
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
          <Dialog open={isPriceModalOpen} onOpenChange={setIsPriceModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-400 text-slate-700 hover:bg-slate-100">
                <FileText className="h-4 w-4" />
                Actualizar Precios (PDF)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Actualizar Precios desde Lista PDF</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Suba la lista de precios en formato PDF. El sistema procesará el archivo automáticamente.
                </p>
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="pdf-input" />
                  <label htmlFor="pdf-input" className="cursor-pointer">
                    {uploadedFile ? (
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <div className="rounded-lg bg-red-100 p-3">
                            <FileText className="h-8 w-8 text-red-600" />
                          </div>
                        </div>
                        <p className="font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <FileText className="h-12 w-12 text-red-600" />
                        </div>
                        <p className="font-medium text-foreground">Arrastre su archivo PDF aquí o haga clic</p>
                      </div>
                    )}
                  </label>
                </div>

                {isLoadingFile && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Procesando archivo...</span>
                      <span>{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
                    </div>
                  </div>
                )}

                {showSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Precios actualizados correctamente</span>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => { setIsPriceModalOpen(false); setUploadedFile(null) }} disabled={isLoadingFile}>
                  Cancelar
                </Button>
                <Button onClick={handleProcessFile} disabled={!uploadedFile || isLoadingFile}>
                  {showSuccess ? 'Completado' : isLoadingFile ? 'Procesando...' : 'Procesar Archivo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Añadir Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Producto</DialogTitle>
                <DialogDescription>Complete los datos del nuevo producto para el catálogo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    value={newProduct.nombre}
                    onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                    placeholder="Ej: Ibuprofeno 400mg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="presentation">Presentación</Label>
                    <Input
                      id="presentation"
                      value={newProduct.presentacion}
                      onChange={(e) => setNewProduct({ ...newProduct, presentacion: e.target.value })}
                      placeholder="Ej: Caja x 20 comp."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={newProduct.categoria}
                      onValueChange={(value) => setNewProduct({ ...newProduct, categoria: value })}
                    >
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
                    <Input
                      id="precio_compra"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ej: 1500.00"
                      value={newProduct.precio_compra || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, precio_compra: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="porcentaje_ganancia">Porcentaje de Ganancia *</Label>
                    <Input
                      id="porcentaje_ganancia"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Ej: 30"
                      value={newProduct.porcentaje_ganancia || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, porcentaje_ganancia: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="precio_venta" className="text-muted-foreground">Precio de Venta (Calculado Automáticamente)</Label>
                  <Input
                    id="precio_venta"
                    type="text"
                    value={`$ ${precioVentaCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    disabled
                    className="bg-muted text-muted-foreground font-semibold border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="1"
                      value={newProduct.stock_actual}
                      onChange={(e) => setNewProduct({ ...newProduct, stock_actual: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minStock">Stock Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={newProduct.stock_minimo}
                      onChange={(e) => setNewProduct({ ...newProduct, stock_minimo: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>Cancelar</Button>
                <Button onClick={handleAddProduct} disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar Producto'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
        <CardContent className="p-0 overflow-x-hidden [&>div]:overflow-x-hidden [&_div]:mt-0 [&_div]:pt-0 [&_table]:mt-0">
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
                    {(() => {
                      const actual = Number(product.stock_actual) || 0
                      const minimo = Number(product.stock_minimo) || 0
                      
                      if (actual < minimo) {
                        return (
                          <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                            {product.stock_actual}
                          </span>
                        )
                      }
                      if (actual < minimo * 1.5) {
                        return (
                          <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                            {product.stock_actual}
                          </span>
                        )
                      }
                      return (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          {product.stock_actual}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">{product.stock_minimo}</TableCell>
                  <TableCell className="text-center pr-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-1.5 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Editar producto"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(product)}
                        className="p-1.5 rounded-md text-gray-600 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Dar de baja"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No se encontraron productos activos en el catálogo
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 🟢 MODAL DE EDICIÓN REFRACTORADO CON LA FILA FINANCIERA ESPEJO */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifique los datos del producto seleccionado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre del Producto</Label>
              <Input
                id="edit-name"
                value={editFormData.nombre}
                onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-presentation">Presentación</Label>
              <Input
                id="edit-presentation"
                value={editFormData.presentacion}
                onChange={(e) => setEditFormData({ ...editFormData, presentacion: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select
                  value={editFormData.categoria}
                  onValueChange={(value) => setEditFormData({ ...editFormData, categoria: value })}
                >
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
                <Input
                  id="edit-minStock"
                  type="number"
                  min="0"
                  value={editFormData.stock_minimo}
                  onChange={(e) => setEditFormData({ ...editFormData, stock_minimo: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* 💵 FILA INYECTADA: Inputs financieros para alterar costos y porcentaje de ganancia */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-precio_compra">Precio de Compra *</Label>
                <Input
                  id="edit-precio_compra"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 1500.00"
                  value={editFormData.precio_compra || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, precio_compra: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-porcentaje_ganancia">Porcentaje de Ganancia *</Label>
                <Input
                  id="edit-porcentaje_ganancia"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Ej: 30"
                  value={editFormData.porcentaje_ganancia || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, porcentaje_ganancia: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Caja deshabilitada de visualización reactiva del precio final de venta editado */}
            <div className="grid gap-2">
              <Label htmlFor="edit-precio_venta" className="text-muted-foreground">
                Precio de Venta (Calculado Automáticamente)
              </Label>
              <Input
                id="edit-precio_venta"
                type="text"
                value={`$ ${precioVentaCalculadoEdit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                disabled
                className="bg-muted text-muted-foreground font-semibold border-border"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Baja</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas dar de baja este producto? No se mostrará en el catálogo activo.
            </DialogDescription>
          </DialogHeader>
          {productToDelete && (
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                Producto: <span className="font-medium text-foreground">{productToDelete.nombre}</span>
              </p>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isPending}>Volver</Button>
            <Button onClick={handleConfirmDelete} variant="destructive" disabled={isPending}>
              {isPending ? 'Procesando...' : 'Confirmar Baja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}