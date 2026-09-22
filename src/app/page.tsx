import { supabaseAdmin } from "@/lib/supabase-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Datos en vivo (conteos/rankings) — no se debe congelar en el build.
export const dynamic = "force-dynamic"

type Metrica = { etiqueta: string; valor: number | null; error?: string }

async function contarReportesTotal(): Promise<Metrica> {
  const { count, error } = await supabaseAdmin
    .from("reportes")
    .select("*", { count: "exact", head: true })
  return { etiqueta: "Total de reportes", valor: count, error: error?.message }
}

async function contarReportesHoy(): Promise<Metrica> {
  const inicioDelDia = new Date()
  inicioDelDia.setHours(0, 0, 0, 0)

  const { count, error } = await supabaseAdmin
    .from("reportes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", inicioDelDia.toISOString())
  return { etiqueta: "Reportes hoy", valor: count, error: error?.message }
}

async function contarColoniasConReportes(): Promise<Metrica> {
  const { data, error } = await supabaseAdmin.from("ranking_colonias").select("colonia")
  return { etiqueta: "Colonias con reportes", valor: data?.length ?? null, error: error?.message }
}

async function contarLeccionesCompletadas(): Promise<Metrica> {
  const { count, error } = await supabaseAdmin
    .from("usuarios_progreso")
    .select("*", { count: "exact", head: true })
    .eq("completada", true)
  return { etiqueta: "Lecciones completadas", valor: count, error: error?.message }
}

export default async function InicioPage() {
  const metricas = await Promise.all([
    contarReportesTotal(),
    contarReportesHoy(),
    contarColoniasConReportes(),
    contarLeccionesCompletadas(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de ReciKa en Chetumal
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica) => (
          <Card key={metrica.etiqueta}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metrica.etiqueta}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrica.error ? (
                <p className="text-xs text-destructive">{metrica.error}</p>
              ) : (
                <p className="text-4xl font-bold" style={{ color: "#085041" }}>
                  {metrica.valor}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
