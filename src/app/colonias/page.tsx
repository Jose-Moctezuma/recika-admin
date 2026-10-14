import { supabaseAdmin } from "@/lib/supabase-admin"
import type { Colonia } from "@/lib/types"
import type { FilaRanking } from "@/lib/ranking-colonias"
import { ColoniasPanel } from "@/components/colonias-panel"

// Datos en vivo — no se debe congelar en el build.
export const dynamic = "force-dynamic"

export default async function ColoniasPage() {
  // Todas las colonias (también las ocultas) para editarlas; y el ranking de la vista pública
  // ranking_colonias. Las escrituras van por las server actions de ./actions.ts, que verifican que
  // quien llama sea admin.
  const [colonias, ranking] = await Promise.all([
    supabaseAdmin.from("colonias").select("*").order("nombre"),
    supabaseAdmin.from("ranking_colonias").select("*").order("total_reportes", { ascending: false }),
  ])

  return (
    <ColoniasPanel
      colonias={(colonias.data ?? []) as Colonia[]}
      ranking={(ranking.data ?? []) as FilaRanking[]}
      errorColonias={colonias.error?.message}
      errorRanking={ranking.error?.message}
    />
  )
}
