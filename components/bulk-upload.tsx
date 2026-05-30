"use client"

import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface BulkUploadProps {
  onBulkUpdate: (updates: { id: string; stock: number }[]) => void
  productCount: number
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export function BulkUpload({ onBulkUpdate, productCount }: BulkUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [uploadedCount, setUploadedCount] = useState(0)

  const simulateUpload = useCallback(() => {
    setStatus('uploading')
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setStatus('success')
          const count = Math.floor(Math.random() * 5) + 3
          setUploadedCount(count)
          // Simulate stock update
          onBulkUpdate([])
          return 100
        }
        return prev + 10
      })
    }, 200)
  }, [onBulkUpdate])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    simulateUpload()
  }

  const handleFileSelect = () => {
    simulateUpload()
  }

  const resetUpload = () => {
    setStatus('idle')
    setProgress(0)
    setUploadedCount(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Carga Masiva de Stock</h1>
        <p className="text-sm text-muted-foreground">
          Importe una planilla Excel para actualizar el inventario rápidamente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Zone */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Importar Planilla</CardTitle>
            <CardDescription>
              Arrastre un archivo Excel o haga clic para seleccionar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'idle' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileSelect}
                className={cn(
                  "flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  {isDragging ? 'Suelte el archivo aquí' : 'Arrastre su archivo Excel aquí'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  o haga clic para seleccionar (.xlsx, .xls)
                </p>
              </div>
            )}

            {status === 'uploading' && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-border bg-muted/30">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 animate-pulse text-primary" />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  Procesando archivo...
                </p>
                <div className="mt-4 w-full max-w-xs">
                  <Progress value={progress} className="h-2" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{progress}% completado</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="mt-4 text-sm font-medium text-emerald-700">
                  ¡Carga exitosa!
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  {uploadedCount} productos actualizados correctamente
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetUpload}
                  className="mt-4"
                >
                  Cargar otro archivo
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="mt-4 text-sm font-medium text-destructive">
                  Error al procesar el archivo
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Verifique el formato e intente nuevamente
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetUpload}
                  className="mt-4"
                >
                  Reintentar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Download */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Plantilla de Ejemplo</CardTitle>
            <CardDescription>
              Descargue la plantilla para asegurar el formato correcto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    plantilla_stock.xlsx
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Formato: ID, Nombre, Stock Nuevo
                  </p>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full gap-2">
                <Download className="h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Instrucciones:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    1
                  </span>
                  Descargue la plantilla de ejemplo
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    2
                  </span>
                  Complete los datos de stock para cada producto
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    3
                  </span>
                  Guarde el archivo y arrástrelo a la zona de carga
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Tip:</span> Actualmente hay{' '}
                <span className="font-medium text-primary">{productCount} productos</span> en
                el catálogo que pueden ser actualizados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
