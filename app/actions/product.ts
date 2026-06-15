'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Producto } from '../page'

// 1. Añadir Producto (Corrección de duplicación de Stock Inicial)
export async function crearProducto(producto: Omit<Producto, 'id' | 'activo' | 'precio_venta'>) {
  const supabase = await createClient()

  // Calcula el precio de venta final aplicando el margen de ganancia entero
  const precio_venta = Number((producto.precio_compra * (1 + producto.porcentaje_ganancia / 100)).toFixed(2))

  // 💡 SOLUCIÓN: Insertamos el producto con stock_actual en 0. 
  // Dejamos que el RPC se encargue de sumarle el stock real en el siguiente paso.
  const { data: nuevoProducto, error: prodError } = await supabase
    .from('productos')
    .insert([{
      nombre: producto.nombre,
      presentacion: producto.presentacion,
      categoria: producto.categoria,
      stock_actual: 0, 
      stock_minimo: producto.stock_minimo,
      precio_compra: producto.precio_compra,
      porcentaje_ganancia: producto.porcentaje_ganancia,
      precio_venta: precio_venta,
      activo: true
    }])
    .select()
    .single()

  if (prodError) {
    throw new Error(prodError.message)
  }

  // Si el usuario ingresó un stock inicial en el formulario, procesamos la entrada por el RPC
  if (producto.stock_actual > 0) {
    const ticketId = crypto.randomUUID()
    
    const { error: movError } = await supabase.rpc('registrar_movimiento', {
      p_producto_id: nuevoProducto.id,
      p_cantidad: producto.stock_actual, // Pasamos la cantidad real que viene del formulario
      p_tipo: 'ENTRADA',
      p_descripcion: nuevoProducto.presentacion || 'Sin presentación', // Viaja la presentación para el subtítulo gris
      p_ticket_id: ticketId,
      p_ticket_titulo: `Carga manual: ${nuevoProducto.nombre}`,
      p_ticket_nota: null
    })

    if (movError) {
      console.error('Error al registrar movimiento inicial por RPC:', movError.message)
    }
  }

  revalidatePath('/')
  return nuevoProducto as Producto
}

// 2. Editar Producto
export async function editarProducto(
  id: string,
  formData: {
    nombre: string
    presentacion: string
    categoria: string
    stock_minimo: number
    precio_compra: number        
    porcentaje_ganancia: number  
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('productos')
    .update({
      nombre: formData.nombre,
      presentacion: formData.presentacion,
      categoria: formData.categoria,
      stock_minimo: formData.stock_minimo,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

// 3. Baja Lógica (Modifica el estado de actividad)
export async function bajaLogicaProducto(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

interface MovimientoParams {
  p_producto_id: string
  p_cantidad: number
  p_tipo: 'ENTRADA' | 'SALIDA'
  p_descripcion: string
  p_ticket_id?: string
  p_ticket_titulo: string
  p_ticket_nota?: string | null
}

export async function registrarMovimientoStock({
  p_producto_id,
  p_cantidad,
  p_tipo,
  p_descripcion,
  p_ticket_id,
  p_ticket_titulo,
  p_ticket_nota = null,
}: MovimientoParams) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('registrar_movimiento', {
    p_producto_id, 
    p_cantidad,
    p_tipo,
    p_descripcion,
    p_ticket_id,
    p_ticket_titulo,
    p_ticket_nota,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data 
}

export async function obtenerProductosFrecuentesAction() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('obtener_productos_frecuentes')

  if (error) {
    console.error('Error al obtener los productos frecuentes:', error)
    return []
  }

  return data as Producto[]
}