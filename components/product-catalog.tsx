"use client"

import { useState } from 'react'
import { Search, Plus, Filter, FileText, Upload, Check, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatCurrency } from '@/lib/data'
import type { Product } from '@/lib/data'

interface ProductCatalogProps {
  products: Product[]
  onAddProduct: (product: Omit<Product, 'id'>) => void
}

const categories = ['Analgésicos', 'Descartables', 'Antiinflamatorios', 'Antibióticos'] as const

export function ProductCatalog({ products, onAddProduct }: ProductCatalogProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    presentation: '',
    category: 'Analgésicos' as Product['category'],
    minStock: 0,
  })
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    drug: '',
    presentation: '',
    category: 'Analgésicos' as Product['category'],
    stock: 0,
    minStock: 0,
    price: 0,
  })

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.drug.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.presentation) {
      onAddProduct(newProduct)
      setNewProduct({
        name: '',
        drug: '',
        presentation: '',
        category: 'Analgésicos',
        stock: 0,
        minStock: 0,
        price: 0,
      })
      setIsDialogOpen(false)
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

    setIsLoading(true)
    setLoadingProgress(0)

    // Simulate file processing with progress updates
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + Math.random() * 30
      })
    }, 300)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2500))
    
    clearInterval(interval)
    setLoadingProgress(100)
    setIsLoading(false)
    setShowSuccess(true)

    // Show success for 2 seconds then close
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setShowSuccess(false)
    setUploadedFile(null)
    setLoadingProgress(0)
    setIsPriceModalOpen(false)
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock < minStock) return 'destructive'
    if (stock < minStock * 1.5) return 'secondary'
    return 'default'
  }

  // Open edit modal with product data
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product)
    setEditFormData({
      name: product.name,
      presentation: product.presentation,
      category: product.category,
      minStock: product.minStock,
    })
    setIsEditModalOpen(true)
  }

  // Save edited product
  const handleSaveEdit = () => {
    if (editingProduct) {
      // Here you would typically call an API to update the product
      console.log('Saving product:', { ...editingProduct, ...editFormData })
      setIsEditModalOpen(false)
      setEditingProduct(null)
    }
  }

  // Open delete confirmation modal
  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteModalOpen(true)
  }

  // Confirm product deletion (logical delete)
  const handleConfirmDelete = () => {
    if (productToDelete) {
      // Here you would typically call an API to mark the product as inactive
      console.log('Deleting product:', productToDelete.id)
      setIsDeleteModalOpen(false)
      setProductToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Catálogo de Productos</h1>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} productos encontrados
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Update Prices Button */}
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
                  Suba la lista de precios en formato PDF. El sistema procesará el archivo y actualizará los precios automáticamente en base al nombre o código del producto.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="pdf-input"
                  />
                  <label htmlFor="pdf-input" className="cursor-pointer">
                    {uploadedFile ? (
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <div className="rounded-lg bg-red-100 p-3">
                            <FileText className="h-8 w-8 text-red-600" />
                          </div>
                        </div>
                        <p className="font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <FileText className="h-12 w-12 text-red-600" />
                        </div>
                        <p className="font-medium text-foreground">
                          Arrastre su archivo PDF aquí o haga clic para buscar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Formato soportado: PDF
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Procesando archivo...</span>
                      <span className="text-muted-foreground">{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {showSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">
                      Precios actualizados correctamente
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPriceModalOpen(false)
                    setUploadedFile(null)
                    setLoadingProgress(0)
                    setShowSuccess(false)
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcessFile}
                  disabled={!uploadedFile || isLoading}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {showSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Completado
                    </>
                  ) : isLoading ? (
                    <>
                      <Upload className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Procesar Archivo'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Product Button */}
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
              <DialogDescription>
                Complete los datos del nuevo producto para agregarlo al catálogo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ej: Ibuprofeno 400mg"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="drug">Droga/Componente</Label>
                <Input
                  id="drug"
                  value={newProduct.drug}
                  onChange={(e) => setNewProduct({ ...newProduct, drug: e.target.value })}
                  placeholder="Ej: Ibuprofeno"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="presentation">Presentación</Label>
                  <Input
                    id="presentation"
                    value={newProduct.presentation}
                    onChange={(e) => setNewProduct({ ...newProduct, presentation: e.target.value })}
                    placeholder="Ej: Caja x 20 comp."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value as Product['category'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock Inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minStock">Stock Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Precio ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })}
                    placeholder="Ej: 850"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProduct}>
                Guardar Producto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o droga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium">Producto</TableHead>
                <TableHead className="font-medium">Presentación</TableHead>
                <TableHead className="font-medium">Categoría</TableHead>
                <TableHead className="text-right font-medium">Precio</TableHead>
                <TableHead className="text-right font-medium">Stock Actual</TableHead>
                <TableHead className="text-right font-medium">Stock Mín.</TableHead>
                <TableHead className="text-center font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.presentation}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getStockStatus(product.stock, product.minStock)}>
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {product.minStock}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-1.5 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifique los datos del producto seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre del Producto</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Ej: Ibuprofeno 400mg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-presentation">Presentación</Label>
              <Input
                id="edit-presentation"
                value={editFormData.presentation}
                onChange={(e) => setEditFormData({ ...editFormData, presentation: e.target.value })}
                placeholder="Ej: Caja x 20 comp."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value as Product['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
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
                  value={editFormData.minStock}
                  onChange={(e) => setEditFormData({ ...editFormData, minStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="bg-red-600 hover:bg-red-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Baja</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas dar de baja este producto? No se mostrará en el catálogo activo.
            </DialogDescription>
          </DialogHeader>
          {productToDelete && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Producto: <span className="font-medium text-foreground">{productToDelete.name}</span>
              </p>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Volver
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              variant="destructive"
            >
              Confirmar Baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
