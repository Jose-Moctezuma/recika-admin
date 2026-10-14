import { supabaseAdmin } from "@/lib/supabase-admin"
import type { CentroAcopio, Reporte } from "@/lib/types"
import { ReportesPanel } from "@/components/reportes-panel"

// Datos en vivo — no se debe congelar en el build.
export const dynamic = "force-dynamic"

export default async function ReportesPage() {
  // Se leen las dos tablas COMPLETAS (todos los estados) con service_role: el panel necesita ver
  // atendidos y descartados también (para revertirlos, o solo para consultarlos), a diferencia
  // del mapa público de la app (mapa_reportes), que desde la migración 0008 solo trae 'pendiente'.
  // Lo mismo para centros_acopio: la app ya lee de la vista centros_acopio_publico (sin
  // 'inactivo' ni las columnas de verificación); el panel sigue leyendo la tabla completa.
  const [{ data, error }, { data: acopiosData, error: errorAcopios }] = await Promise.all([
    supabaseAdmin.from("reportes").select("*").order("created_at", { ascending: false }),
    supabaseAdmin
      .from("centros_acopio")
      .select("id, nombre, direccion, lat, lng, tipos_material, horario, estado"),
  ])

  const reportes = (data ?? []) as Reporte[]
  const acopios = (acopiosData ?? []) as CentroAcopio[]

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-destructive">No se pudieron cargar los reportes: {error.message}</p>
      </div>
    )
  }

  // El panel ocupa todo el alto de la pantalla (columna de detalle fija a la derecha), así que
  // se renderiza sin envoltorio; el aviso de error de acopios va dentro de su columna izquierda.
  return <ReportesPanel reportes={reportes} acopios={acopios} errorAcopios={errorAcopios?.message} />
}
