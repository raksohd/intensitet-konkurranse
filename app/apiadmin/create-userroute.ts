import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
 
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })
 
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 })
 
  const { email, password, fullName } = await request.json()
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'Mangler felt' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Passord må være minst 6 tegn' }, { status: 400 })
  }
 
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
 
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, userId: data.user?.id })
}
