import { supabaseAdmin } from "@/lib/supabase-admin"
import type { Reporte } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

// Datos en vivo — no se debe congelar en el build.
export const dynamic = "force-dynamic"

const URGENCIA_ESTILO: Record<Reporte["urgencia"], { bg: string; color: string; label: string }> = {
  alta: { bg: "#FCEBEB", color: "#791F1F", label: "Alta" },
  media: { bg: "#FAEEDA", color: "#633806", label: "Media" },
  baja: { bg: "#E1F5EE", color: "#085041", label: "Baja" },
}

export default async function ReportesPage() {
  // Se consulta la tabla base (no la vista mapa_reportes): esa vista excluye
  // reportes sin coordenadas (los remotos) y no expone "desde_sitio".
  const { data, error } = await supabaseAdmin
    .from("reportes")
    .select("*")
    .order("created_at", { ascending: false })

  const reportes = (data ?? []) as Reporte[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Tiraderos clandestinos reportados por la comunidad
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los reportes: {error.message}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Colonia</TableHead>
              <TableHead>Tipo de residuo</TableHead>
              <TableHead>Urgencia</TableHead>
              <TableHead>Desde sitio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportes.map((reporte) => {
              const urgencia = URGENCIA_ESTILO[reporte.urgencia]
              return (
                <TableRow key={reporte.id}>
                  <TableCell>
                    {new Date(reporte.created_at).toLocaleString("es-MX", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>{reporte.colonia ?? "—"}</TableCell>
                  <TableCell>{reporte.tipo_residuo ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      style={{ backgroundColor: urgencia.bg, color: urgencia.color }}
                      className="border-transparent"
                    >
                      {urgencia.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reporte.desde_sitio ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
