import { supabaseAdmin } from "@/lib/supabase-admin"
import type { CentroAcopio } from "@/lib/types"
import { AcopiosPanel } from "@/components/acopios-panel"

// Datos en vivo — no se debe congelar en el build.
export const dynamic = "force-dynamic"

export default async function AcopiosPage() {
  // La tabla completa (todos los estados, también 'inactivo'): el panel gestiona los tres. Las
  // escrituras van por las server actions de ./actions.ts, que verifican que quien llama sea admin.
  const { data, error } = await supabaseAdmin.from("centros_acopio").select("*").order("nombre")

  return <AcopiosPanel centros={(data ?? []) as CentroAcopio[]} error={error?.message} />
}
