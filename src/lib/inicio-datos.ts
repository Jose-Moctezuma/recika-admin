import "server-only"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { contarPendientes, leerPendientesRecientes } from "@/lib/pendientes"
import {
  calcularResumen,
  rangoPeriodo,
  type FilaReporte,
  type PendienteReciente,
  type Periodo,
  type RangoPeriodo,
  type ResumenInicio,
} from "@/lib/inicio-calculos"

// SOLO LECTURA. Esta pantalla no escribe nada. Se lee con el cliente service_role del panel (que
// solo existe en servidor; ver supabase-admin.ts) porque `reportes` no es legible con la clave
// anon, y se piden únicamente las columnas que la pantalla usa: nunca user_id, descripcion ni
// referencia_lugar.
const COLUMNAS_REPORTE = "created_at, estado, colonia, como_se_entero"

// Cuántos pendientes recientes lista la tarjeta "Por revisar".
const PENDIENTES_RECIENTES = 5

// PostgREST devuelve como máximo 1000 filas por consulta (límite del proyecto): se lee por páginas
// para que "Todo" no se corte en silencio cuando haya más reportes.
const TAMANO_PAGINA = 1000
const MAX_PAGINAS = 50

async function leerReportes(rango: RangoPeriodo): Promise<{ filas: FilaReporte[]; error?: string }> {
  const filas: FilaReporte[] = []
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    let consulta = supabaseAdmin
      .from("reportes")
      .select(COLUMNAS_REPORTE)
      // Orden total (created_at + id) para que dos páginas nunca repitan ni se salten una fila.
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(pagina * TAMANO_PAGINA, (pagina + 1) * TAMANO_PAGINA - 1)
    if (rango.desdeISO) consulta = consulta.gte("created_at", rango.desdeISO)
    if (rango.hastaISO) consulta = consulta.lt("created_at", rango.hastaISO)

    const { data, error } = await consulta
    if (error) return { filas: [], error: error.message }
    filas.push(...((data ?? []) as FilaReporte[]))
    if ((data?.length ?? 0) < TAMANO_PAGINA) break
  }
  return { filas }
}

export interface LeccionesInicio {
  completadas: number | null
  activas: number | null
  error?: string
}

async function leerLecciones(rango: RangoPeriodo): Promise<LeccionesInicio> {
  // Una fila de usuarios_progreso se crea al completar la lección (lib/lecciones.ts en la app), así
  // que su created_at es el momento en que se completó. Solo se cuentan filas: no se lee user_id.
  let completadas = supabaseAdmin
    .from("usuarios_progreso")
    .select("*", { count: "exact", head: true })
    .eq("completada", true)
  if (rango.desdeISO) completadas = completadas.gte("created_at", rango.desdeISO)
  if (rango.hastaISO) completadas = completadas.lt("created_at", rango.hastaISO)

  const activas = supabaseAdmin
    .from("lecciones")
    .select("*", { count: "exact", head: true })
    .eq("activa", true)

  const [resCompletadas, resActivas] = await Promise.all([completadas, activas])
  const error = resCompletadas.error?.message ?? resActivas.error?.message
  return { completadas: resCompletadas.count, activas: resActivas.count, error }
}

// Estado ACTUAL de la cola de revisión: no depende del periodo elegido.
export interface PendientesInicio {
  total: number | null
  recientes: PendienteReciente[]
  error?: string
}

export interface DatosInicio {
  rango: RangoPeriodo
  resumen: ResumenInicio | null
  errorReportes?: string
  pendientes: PendientesInicio
  lecciones: LeccionesInicio
}

export async function cargarInicio(periodo: Periodo): Promise<DatosInicio> {
  const rango = rangoPeriodo(periodo, new Date())
  const [reportes, lecciones, total, recientes] = await Promise.all([
    leerReportes(rango),
    leerLecciones(rango),
    contarPendientes(),
    leerPendientesRecientes(PENDIENTES_RECIENTES),
  ])
  return {
    rango,
    resumen: reportes.error ? null : calcularResumen(reportes.filas, rango),
    errorReportes: reportes.error,
    pendientes: {
      total: total.total,
      recientes: recientes.filas,
      error: total.error ?? recientes.error,
    },
    lecciones,
  }
}
