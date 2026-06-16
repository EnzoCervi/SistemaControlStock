'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Producto } from '../page'

// 1. Añadir Producto (Corrección de duplicación de Stock Inicial)
export async function crearProducto(producto: Omit<Producto, 'id' | 'activo' | 'precio_venta'>) {
  const supabase = await createClient()

  // 🎯 VERIFICACIÓN ESTRICTA EN EL BACKEND
  if (producto.stock_actual < 1) {
    throw new Error('Operación denegada: El stock inicial debe ser de al menos 1 unidad.')
  }
  if (producto.stock_minimo < 0) {
    throw new Error('Operación denegada: El stock mínimo no puede ser un número negativo.')
  }

  // Calcula el precio de venta final aplicando el margen de ganancia entero
  const precio_venta = Number((producto.precio_compra * (1 + producto.porcentaje_ganancia / 100)).toFixed(2))

  // Insertamos el producto con stock_actual en 0.
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

  if (producto.stock_actual > 0) {
    const ticketId = crypto.randomUUID()
    
    const { error: movError } = await supabase.rpc('registrar_movimiento', {
      p_producto_id: nuevoProducto.id,
      p_cantidad: producto.stock_actual,
      p_tipo: 'ENTRADA',
      p_descripcion: nuevoProducto.presentacion || 'Sin presentación',
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

// 🚀 4. NUEVA ACCIÓN: Ajustar Stock de forma puramente física (Ignorado en Finanzas)
export async function ajustarStock(
  productId: string,
  data: {
    cantidad: number
    tipo: 'ENTRADA' | 'SALIDA'
    descripcion: string
    nuevo_stock: number
  }
) {
  const supabase = await createClient()

  // 🎯 SOLUCIÓN: Generamos un UUID real para que la base de datos acepte la transacción de ajuste
  const ticketId = crypto.randomUUID()

  const { data: rpcData, error: rpcError } = await supabase.rpc('registrar_movimiento', {
    p_producto_id: productId,
    p_cantidad: data.cantidad,
    p_tipo: data.tipo,
    p_descripcion: data.descripcion,
    p_ticket_id: ticketId, // 🚀 Viaja el UUID válido exigido por la DB
    p_ticket_titulo: data.descripcion,
    p_ticket_nota: null
  })

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  let movementId = rpcData?.id || (Array.isArray(rpcData) ? rpcData[0]?.id : null)

  if (!movementId) {
    const { data: latestMom } = await supabase
      .from('movimientos')
      .select('id')
      .eq('producto_id', productId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (latestMom) {
      movementId = latestMom.id
    }
  }

  if (movementId) {
    const { error: updateError } = await supabase
      .from('movimientos')
      .update({ es_ajuste: true })
      .eq('id', movementId)

    if (updateError) {
      console.error('Error al marcar el flag es_ajuste en Supabase:', updateError.message)
    }
  }

  revalidatePath('/')
  return { success: true }
}

export async function anularPedidoAction(ticketId: string) {
  const supabase = await createClient()

  // 1. Buscamos todos los movimientos asociados a ese ticket_id
  const { data: movimientos, error: fetchError } = await supabase
    .from('movimientos')
    .select('*')
    .eq('ticket_id', ticketId)

  if (fetchError || !movimientos) {
    throw new Error(fetchError?.message || 'No se encontraron registros de este pedido.')
  }

  // 2. Iteramos los artículos incluidos para revertir sus efectos físicos
  for (const mov of movimientos) {
    if (mov.estado === 'anulado') continue // Seguridad: Evita doble procesamiento

    // Buscamos el stock actual del fármaco
    const { data: prod } = await supabase
      .from('productos')
      .select('stock_actual')
      .eq('id', mov.producto_id)
      .single()

    if (prod) {
      // 🎯 REVERSIÓN DE STOCK
      // Si fue una VENTA (SALIDA): la mercadería vuelve a la estantería (+)
      // Si fue una COMPRA (ENTRADA): la mercadería se devuelve al proveedor (-)
      const nuevoStock = mov.tipo === 'SALIDA'
        ? (prod.stock_actual + mov.cantidad)
        : (prod.stock_actual - mov.cantidad)

      await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', mov.producto_id)
    }

    // 3. Cambiamos el estado del movimiento a anulado
    await supabase
      .from('movimientos')
      .update({ estado: 'anulado' })
      .eq('id', mov.id)
  }

  revalidatePath('/')
}