import { createClient } from '@supabase/supabase-js'

// Cliente de solo servidor: usa la service_role key, que bypasea RLS por
// completo. Nunca debe importarse desde un componente 'use client' ni
// exponerse con el prefijo NEXT_PUBLIC_.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
