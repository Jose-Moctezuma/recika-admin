import "server-only"
import { supabaseServer } from "@/lib/supabase-server"

// Cada server action se autoriza a sí misma: nunca confía en que el botón solo se muestre a un
// admin en la interfaz (eso no es una barrera de seguridad, cualquiera puede llamar al endpoint
// directamente). Lee la sesión de las cookies de QUIEN llama (supabaseServer, sujeta a RLS) y solo
// si trae app_metadata.is_admin=true devuelve su id; la escritura la hace después la propia acción
// con supabaseAdmin (service_role, solo en servidor). La identidad sale siempre de la sesión, nunca
// de datos que mande el cliente.
export async function exigirAdmin(): Promise<{ id: string } | { error: string }> {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { error: "No hay sesión activa. Vuelve a iniciar sesión." }
  if (user.app_metadata?.is_admin !== true) {
    return { error: "Tu cuenta no tiene permisos de administrador." }
  }
  return { id: user.id }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor)
}
