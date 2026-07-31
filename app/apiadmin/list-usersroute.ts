import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
 
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })
 
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 })
 
  const admin = createAdminClient()
  const { data: profiles } = await admin.from('profiles').select('*').order('created_at')
  const { data: authUsers } = await admin.auth.admin.listUsers()
 
  const merged = (profiles || []).map((p) => {
    const authUser = authUsers?.users.find((u) => u.id === p.id)
    return {
      id: p.id,
      full_name: p.full_name,
      is_admin: p.is_admin,
      is_active: p.is_active,
      email: authUser?.email || '',
    }
  })
 
  return NextResponse.json({ users: merged })
}
