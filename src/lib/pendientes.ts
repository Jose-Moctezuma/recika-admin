import "server-only"
import { supabaseAdmin } from "@/lib/supabase-admin"
import type { PendienteReciente } from "@/lib/inicio-calculos"

// "Pendiente" es un ESTADO ACTUAL, no un dato del periodo: un reporte sin atender de hace dos meses
// sigue pendiente. Por eso el número del menú lateral y la tarjeta "Por revisar" de Inicio salen
// de este mismo módulo (mismo filtro), para que nunca puedan diferir. SOLO LECTURA.
export async function contarPendientes(): Promise<{ total: number | null; error?: string }> {
  const { count, error } = await supabaseAdmin
    .from("reportes")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente")
  return { total: count, error: error?.message }
}

// Los más recientes primero. Solo las columnas que Inicio muestra (nunca user_id, descripcion ni
// referencia_lugar).
export async function leerPendientesRecientes(
  limite: number
): Promise<{ filas: PendienteReciente[]; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from("reportes")
    .select("id, created_at, tipo_residuo, colonia")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limite)
  if (error) return { filas: [], error: error.message }
  return {
    filas: (data ?? []).map((fila) => ({
      id: fila.id as string,
      created_at: fila.created_at as string,
      tipo_residuo: (fila.tipo_residuo as string | null)?.trim() || "Reporte",
      colonia: (fila.colonia as string | null)?.trim() || "Sin colonia",
    })),
  }
}
