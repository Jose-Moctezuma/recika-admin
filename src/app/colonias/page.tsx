import { supabaseAdmin } from "@/lib/supabase-admin"
import type { RankingColonia } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Datos en vivo — no se debe congelar en el build.
export const dynamic = "force-dynamic"

export default async function ColoniasPage() {
  const { data, error } = await supabaseAdmin
    .from("ranking_colonias")
    .select("*")
    .order("total_reportes", { ascending: false })

  const ranking = (data ?? []) as RankingColonia[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Colonias</h1>
        <p className="text-sm text-muted-foreground">
          Ranking de colonias por número de reportes
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          No se pudo cargar el ranking: {error.message}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colonia</TableHead>
              <TableHead>Total reportes</TableHead>
              <TableHead>Urgencia alta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((fila) => (
              <TableRow key={fila.colonia}>
                <TableCell className="font-medium">{fila.colonia}</TableCell>
                <TableCell>{fila.total_reportes}</TableCell>
                <TableCell>
                  {fila.urgentes > 0 ? (
                    <Badge style={{ backgroundColor: "#FCEBEB", color: "#791F1F" }} className="border-transparent">
                      {fila.urgentes}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
