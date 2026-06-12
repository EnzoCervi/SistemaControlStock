'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Producto } from '../page'

// 1. Añadir Producto
// 1. Añadir Producto con Auditoría Dinámica de Entrada
// 1. Añadir Producto con Auditoría Obligatoria de Tiquet
export async function crearProducto(formData: {
  nombre: string
  presentacion: string
  categoria: string
  stock_actual: number
  stock_minimo: number
}) {
  const supabase = await createClient()
  
  // A. Insertamos el producto y recuperamos el objeto creado con su ID real de la nube
  const { data: nuevoProducto, error: errorProducto } = await supabase
    .from('productos')
    .insert([
      {
        nombre: formData.nombre,
        presentacion: formData.presentacion,
        categoria: formData.categoria,
        stock_actual: formData.stock_actual,
        stock_minimo: formData.stock_minimo,
        activo: true
      }
    ])
    .select()
    .single()

  if (errorProducto) throw new Error(errorProducto.message)

  // B. Si el producto se creó bien y tiene stock inicial, registramos el tiquet obligatorio
  if (nuevoProducto && formData.stock_actual > 0) {
    // 🆔 Generamos el ID único del tiquet para esta carga inicial en el servidor
    const ticketIdAlta = crypto.randomUUID()

    const { error: errorMovimiento } = await supabase
      .from('movimientos')
      .insert([
        {
          producto_id: nuevoProducto.id, // Enlazamos al ID real del producto
          cantidad: formData.stock_actual,
          tipo: 'ENTRADA',
          descripcion: 'Apertura de inventario', 
          ticket_id: ticketIdAlta,                          
          ticket_titulo: `Carga manual: ${formData.nombre}`, 
          ticket_nota: null                                 
        }
      ])

    if (errorMovimiento) {
      console.error('Error al registrar movimiento inicial:', errorMovimiento.message)
    }
  }

  revalidatePath('/')
}

// 2. Editar Producto
export async function editarProducto(
  id: string,
  formData: {
    nombre: string
    presentacion: string
    categoria: string
    stock_minimo: number
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

  // 💡 El lado izquierdo (la clave) debe mapear EXACTO como se llama en el SQL de Supabase
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