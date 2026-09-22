import { supabase } from "@/lib/supabase"
import type { CentroAcopio } from "@/lib/types"
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

export default async function AcopiosPage() {
  const { data, error } = await supabase
    .from("centros_acopio")
    .select("*")
    .order("nombre")

  const centros = (data ?? []) as CentroAcopio[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Centros de acopio</h1>
        <p className="text-sm text-muted-foreground">
          Puntos de acopio registrados en Chetumal
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los centros de acopio: {error.message}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Materiales</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centros.map((centro) => (
              <TableRow key={centro.id}>
                <TableCell className="font-medium">{centro.nombre}</TableCell>
                <TableCell>{centro.direccion}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {centro.tipos_material.map((material) => (
                      <Badge key={material} variant="outline">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{centro.horario}</TableCell>
                <TableCell>
                  <Badge variant={centro.estado === "activo" ? "default" : "secondary"}>
                    {centro.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
