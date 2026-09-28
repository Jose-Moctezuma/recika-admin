"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import type { MotivoDescarte } from "@/lib/types"

const MOTIVOS_VALIDOS: readonly MotivoDescarte[] = ["falso", "duplicado", "prueba"]

type Resultado = { ok: true } | { ok: false; error: string }

// Cada acción se autoriza a sí misma: nunca confía en que el botón solo se muestre a un admin
// en la interfaz (eso no es una barrera de seguridad, cualquiera puede llamar al endpoint
// directamente). Lee la sesión de las cookies de QUIEN llama (supabaseServer, sujeta a RLS) y
// solo si trae app_metadata.is_admin=true hace la escritura, con supabaseAdmin (service_role,
// que nunca se usa para leer "quién soy": la identidad siempre sale de la sesión, no del cliente).
async function exigirAdmin(): Promise<{ id: string } | { error: string }> {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { error: "No hay sesión activa. Vuelve a iniciar sesión." }
  if (user.app_metadata?.is_admin !== true) {
    return { error: "Tu cuenta no tiene permisos de administrador." }
  }
  return { id: user.id }
}

export async function marcarAtendido(reporteId: string): Promise<Resultado> {
  const admin = await exigirAdmin()
  if ("error" in admin) return { ok: false, error: admin.error }
  if (typeof reporteId !== "string" || reporteId.trim() === "") {
    return { ok: false, error: "Falta el id del reporte." }
  }

  const { error, count } = await supabaseAdmin
    .from("reportes")
    .update(
      {
        estado: "atendido",
        motivo_descarte: null,
        estado_actualizado_at: new Date().toISOString(),
        estado_actualizado_por: admin.id,
      },
      { count: "exact" }
    )
    .eq("id", reporteId)

  if (error) return { ok: false, error: error.message }
  if (!count) return { ok: false, error: "No se encontró el reporte (¿ya lo actualizó alguien más?)." }

  revalidatePath("/reportes")
  return { ok: true }
}

export async function descartarReporte(reporteId: string, motivo: string): Promise<Resultado> {
  const admin = await exigirAdmin()
  if ("error" in admin) return { ok: false, error: admin.error }
  if (typeof reporteId !== "string" || reporteId.trim() === "") {
    return { ok: false, error: "Falta el id del reporte." }
  }
  // El motivo llega como string desde un <select>: se valida contra la misma lista que la
  // migración 0008 acepta en la base (defensa en profundidad — el CHECK de la base es lo que
  // realmente lo impide, esto solo da un mensaje claro en vez de un error genérico de la base).
  if (!MOTIVOS_VALIDOS.includes(motivo as MotivoDescarte)) {
    return { ok: false, error: "Elige un motivo de descarte válido (falso, duplicado o prueba)." }
  }

  const { error, count } = await supabaseAdmin
    .from("reportes")
    .update(
      {
        estado: "descartado",
        motivo_descarte: motivo,
        estado_actualizado_at: new Date().toISOString(),
        estado_actualizado_por: admin.id,
      },
      { count: "exact" }
    )
    .eq("id", reporteId)

  if (error) return { ok: false, error: error.message }
  if (!count) return { ok: false, error: "No se encontró el reporte (¿ya lo actualizó alguien más?)." }

  revalidatePath("/reportes")
  return { ok: true }
}

// Un reporte atendido o descartado puede regresarse a pendiente (reaparece en el mapa público).
export async function revertirAPendiente(reporteId: string): Promise<Resultado> {
  const admin = await exigirAdmin()
  if ("error" in admin) return { ok: false, error: admin.error }
  if (typeof reporteId !== "string" || reporteId.trim() === "") {
    return { ok: false, error: "Falta el id del reporte." }
  }

  const { error, count } = await supabaseAdmin
    .from("reportes")
    .update(
      {
        estado: "pendiente",
        motivo_descarte: null,
        estado_actualizado_at: new Date().toISOString(),
        estado_actualizado_por: admin.id,
      },
      { count: "exact" }
    )
    .eq("id", reporteId)

  if (error) return { ok: false, error: error.message }
  if (!count) return { ok: false, error: "No se encontró el reporte (¿ya lo actualizó alguien más?)." }

  revalidatePath("/reportes")
  return { ok: true }
}
