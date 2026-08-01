'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
 
export default function AccountPage() {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [nameMsg, setNameMsg] = useState('')
  const [nameErr, setNameErr] = useState('')
  const [savingName, setSavingName] = useState(false)
 
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
 
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      setFullName(data?.full_name || '')
    }
    load()
  }, [])
 
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameErr(''); setNameMsg(''); setSavingName(true)
    const res = await fetch('/api/profile/update-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName }),
    })
    const json = await res.json()
    setSavingName(false)
    if (!res.ok) { setNameErr(json.error || 'Noe gikk galt'); return }
    setNameMsg('Navn oppdatert!')
  }
 
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (password.length < 6) { setErr('Minst 6 tegn.'); return }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setErr(error.message); return }
    setMsg('Passord oppdatert!')
    setPassword('')
  }
 
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-bold">Min konto</h1>
 
      <form onSubmit={handleNameSubmit} className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h2 className="font-semibold">Visningsnavn</h2>
        <div>
          <label className="text-sm font-medium">Navn som vises på leaderboard</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="F.eks. Oskar Nagelsaker" />
        </div>
        {nameErr && <p className="text-sm text-red-600">{nameErr}</p>}
        {nameMsg && <p className="text-sm text-green-700">{nameMsg}</p>}
        <button disabled={savingName}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50">
          {savingName ? 'Lagrer...' : 'Oppdater navn'}
        </button>
      </form>
 
      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h2 className="font-semibold">Passord</h2>
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
