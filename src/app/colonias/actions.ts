"use server"

import { revalidatePath } from "next/cache"
import { exigirAdmin, esUuid } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { validarColonia } from "@/lib/colonias-validacion"

type Resultado = { ok: true; id: string } | { ok: false; error: string }

// Las colonias NO se borran: se ocultan (activa = false) y la app deja de listarlas. No hay acción de
// borrado. Solo se escriben nombre, días, horario, ruta y visibilidad: nunca centro_lat/centro_lng
// (la sugerencia de colonia por GPS) ni nada más, así que editar aquí no los toca.
//
// Formato (el mismo que ya leen la app y las filas actuales): ver colonias-validacion.ts.

// Crea (sin `id`) o actualiza (con `id`) una colonia.
export async function guardarColonia(entrada: unknown): Promise<Resultado> {
  const admin = await exigirAdmin()
  if ("error" in admin) return { ok: false, error: admin.error }

  const id = typeof entrada === "object" && entrada !== null ? (entrada as { id?: unknown }).id : undefined
  if (id !== undefined && id !== null && !esUuid(id)) return { ok: false, error: "Identificador no válido." }

  // Todas las colonias (también las ocultas) para detectar nombres repetidos: la comparación es sin
  // acentos ni mayúsculas, y no se puede hacer con un UNIQUE de la base (no hay migraciones aquí).
  const { data: existentes, error: errorLeer } = await supabaseAdmin.from("colonias").select("id, nombre, horario")
  if (errorLeer) return { ok: false, error: errorLeer.message }
  const filas = (existentes ?? []) as { id: string; nombre: string; horario: string | null }[]

  const actual = esUuid(id) ? filas.find((f) => f.id === id) : undefined
  if (esUuid(id) && !actual) return { ok: false, error: "No se encontró la colonia (¿ya la cambió alguien más?)." }

  const validado = validarColonia(entrada, {
    otras: filas.map((f) => ({ id: f.id, nombre: f.nombre })),
    horarioActual: actual?.horario ?? null,
    idActual: esUuid(id) ? id : undefined,
  })
  if (!validado.ok) return validado

  if (esUuid(id)) {
    const { error, count } = await supabaseAdmin.from("colonias").update(validado.valor, { count: "exact" }).eq("id", id)
    if (error) return { ok: false, error: mensajeDeError(error) }
    if (!count) return { ok: false, error: "No se encontró la colonia (¿ya la cambió alguien más?)." }
    revalidatePath("/colonias")
    return { ok: true, id }
  }

  const { data, error } = await supabaseAdmin.from("colonias").insert(validado.valor).select("id").single()
  if (error) return { ok: false, error: mensajeDeError(error) }
  revalidatePath("/colonias")
  return { ok: true, id: data.id as string }
}

function mensajeDeError(error: { code?: string; message: string }): string {
  // 23505 = violación de UNIQUE: si la base tuviera un índice único por nombre, otra persona pudo
  // crear la misma colonia justo antes.
  return error.code === "23505" ? "Ya existe una colonia con ese nombre." : error.message
}
