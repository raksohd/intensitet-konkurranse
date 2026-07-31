'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
 
export default function AccountPage() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (password.length < 6) { setErr('Minst 6 tegn.'); return }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setErr(error.message); return }
    setMsg('Passord oppdatert!')
    setPassword('')
  }
 
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Min konto</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Nytt passord</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2" />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700">
          Oppdater passord
        </button>
      </form>
    </div>
  )
}
