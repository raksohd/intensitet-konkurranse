import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
 
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })
 
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 })
 
  const { userId, is_active, is_admin } = await request.json()
  if (!userId) return NextResponse.json({ error: 'Mangler bruker-id' }, { status: 400 })
 
  const admin = createAdminClient()
  const updates: Record<string, boolean> = {}
  if (typeof is_active === 'boolean') updates.is_active = is_active
  if (typeof is_admin === 'boolean') updates.is_admin = is_admin
 
  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from('profiles').update(updates).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }
 
  if (typeof is_active === 'boolean') {
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: is_active ? 'none' : '87600h',
    })
  }
 
  return NextResponse.json({ success: true })
}
