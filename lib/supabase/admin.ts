import { createClient as createSupabaseClient } from '@supabase/supabase-js'
 
// Brukes KUN i server-ruter (API-routes). Aldri i klient-kode.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
