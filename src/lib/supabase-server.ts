import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Cliente con la sesión del admin (cookies): las consultas corren con su rol
// y quedan sujetas a RLS. Para datos sin restricción usar supabase-admin.ts.
export async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          // Un Server Component no puede escribir cookies; el proxy ya refresca la sesión.
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
