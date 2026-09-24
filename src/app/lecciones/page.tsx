import { supabaseServer } from "@/lib/supabase-server"
import type { Leccion } from "@/lib/types"
import { LeccionesTabla } from "@/components/lecciones-tabla"

export default async function LeccionesPage() {
  const supabase = await supabaseServer()
  // "contenido" no se muestra en la tabla, pero el formulario de edición lo
  // precarga: sin él, guardar una edición borraría el contenido existente.
  const { data, error } = await supabase
    .from("lecciones")
    .select("id, titulo, contenido, categoria, duracion_min, orden, activa")
    .order("orden")

  const lecciones = (data ?? []) as Leccion[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Lecciones</h1>
        <p className="text-sm text-muted-foreground">
          Contenido educativo que se muestra en la sección Aprender de la app
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar las lecciones: {error.message}
        </p>
      ) : (
        <LeccionesTabla lecciones={lecciones} />
      )}
    </div>
  )
}
