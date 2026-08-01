import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
 
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })
 
  const { fullName } = await request.json()
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return NextResponse.json({ error: 'Navnet må være minst 2 tegn.' }, { status: 400 })
  }
 
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', user.id)
 
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
