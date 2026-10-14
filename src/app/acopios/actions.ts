"use server"

import { revalidatePath } from "next/cache"
import { exigirAdmin, esUuid } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { validarCentro } from "@/lib/acopios-validacion"

type Resultado = { ok: true; id: string } | { ok: false; error: string; pideConfirmacion?: boolean }

// Los centros NO se borran: se desactivan (estado = 'inactivo') y dejan de verse en la app. No hay
// acción de borrado. verificado_en_campo y notas_verificacion NO se escriben aquí a propósito: se
// habilitarán cuando se cierre el acceso directo a la tabla (migración 0010), porque mientras la
// tabla siga legible para la app esas columnas se podrían leer.

// Crea (sin `id`) o actualiza (con `id`) un centro. Todo lo que llega del cliente se vuelve a validar
// aquí: el formulario es una comodidad, no una barrera.
export async function guardarCentro(entrada: unknown): Promise<Resultado> {
  const admin = await exigirAdmin()
  if ("error" in admin) return { ok: false, error: admin.error }

  const id = typeof entrada === "object" && entrada !== null ? (entrada as { id?: unknown }).id : undefined
  if (id !== undefined && id !== null && !esUuid(id)) return { ok: false, error: "Identificador no válido." }

  // Al editar, los materiales que ya tiene la fila se conservan aunque no sean de los 9 chips.
  let tiposActuales: string[] = []
  if (esUuid(id)) {
    const { data, error } = await supabaseAdmin.from("centros_acopio").select("tipos_material").eq("id", id).maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: false, error: "No se encontró el centro (¿ya lo cambió alguien más?)." }
    tiposActuales = (data.tipos_material as string[] | null) ?? []
  }

  const validado = validarCentro(entrada, tiposActuales)
  if (!validado.ok) return validado

  if (esUuid(id)) {
    const { error, count } = await supabaseAdmin
      .from("centros_acopio")
      .update(validado.valor, { count: "exact" })
      .eq("id", id)
    if (error) return { ok: false, error: error.message }
    if (!count) return { ok: false, error: "No se encontró el centro (¿ya lo cambió alguien más?)." }
    revalidatePath("/acopios")
    return { ok: true, id }
  }

  const { data, error } = await supabaseAdmin.from("centros_acopio").insert(validado.valor).select("id").single()
  if (error) return { ok: false, error: error.message }
  revalidatePath("/acopios")
  return { ok: true, id: data.id as string }
}

async function cambiarEstado(id: unknown, estado: "inactivo" | "activo"): Promise<Resultado> {
  const admin = await exigirAdmin()
  if ("error" in admin) return { ok: false, error: admin.error }
  if (!esUuid(id)) return { ok: false, error: "Identificador no válido." }

  const { error, count } = await supabaseAdmin.from("centros_acopio").update({ estado }, { count: "exact" }).eq("id", id)
  if (error) return { ok: false, error: error.message }
  if (!count) return { ok: false, error: "No se encontró el centro (¿ya lo cambió alguien más?)." }
  revalidatePath("/acopios")
  return { ok: true, id }
}

export async function desactivarCentro(id: string): Promise<Resultado> {
  return cambiarEstado(id, "inactivo")
}

export async function reactivarCentro(id: string): Promise<Resultado> {
  return cambiarEstado(id, "activo")
}
