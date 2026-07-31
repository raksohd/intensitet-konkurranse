'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
 
type AdminUser = {
  id: string
  full_name: string
  email: string
  is_admin: boolean
  is_active: boolean
}
 
export default function AdminPage() {
  const supabase = createClient()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
 
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [createMsg, setCreateMsg] = useState('')
  const [createErr, setCreateErr] = useState('')
  const [creating, setCreating] = useState(false)
 
  const loadUsers = async () => {
    const res = await fetch('/api/admin/list-users')
    const json = await res.json()
    if (res.ok) setUsers(json.users)
  }
 
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setAuthorized(false); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { setAuthorized(false); return }
      setAuthorized(true)
      await loadUsers()
      setLoading(false)
    }
    init()
  }, [])
 
  const genPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    let pw = ''
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)]
    setPassword(pw)
  }
 
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateErr(''); setCreateMsg(''); setCreating(true)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: name, email, password }),
    })
    const json = await res.json()
    setCreating(false)
    if (!res.ok) { setCreateErr(json.error || 'Noe gikk galt'); return }
    setCreateMsg(`Bruker opprettet! Gi følgende til ${name}: E-post: ${email} / Passord: ${password}`)
    setName(''); setEmail(''); setPassword('')
    loadUsers()
  }
 
  const toggleActive = async (u: AdminUser) => {
    await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, is_active: !u.is_active }),
    })
    loadUsers()
  }
 
  const toggleAdmin = async (u: AdminUser) => {
    await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, is_admin: !u.is_admin }),
    })
    loadUsers()
  }
 
  if (authorized === null) return <div className="text-center py-20 text-gray-500">Laster...</div>
  if (authorized === false) return <div className="text-center py-20 text-red-600">Du har ikke tilgang til denne siden.</div>
 
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Administrer deltakere</h1>
 
      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-semibold mb-3">Legg til ny deltaker</h2>
        <form onSubmit={createUser} className="space-y-3">
          <input required placeholder="Fullt navn" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2" />
          <input required type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2" />
          <div className="flex gap-2">
            <input required placeholder="Passord (min 6 tegn)" value={password} onChange={(e) => setPassword(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2" />
            <button type="button" onClick={genPassword}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Generer</button>
          </div>
          {createErr && <p className="text-sm text-red-600">{createErr}</p>}
          {createMsg && <p className="text-sm text-green-700">{createMsg}</p>}
          <button disabled={creating}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50">
            {creating ? 'Oppretter...' : 'Opprett deltaker'}
          </button>
        </form>
      </div>
 
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <h2 className="font-semibold p-5 pb-0">Alle deltakere</h2>
        {loading ? <p className="p-5 text-gray-500">Laster...</p> : (
          <table className="w-full text-sm mt-3">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2">Navn</th>
                <th className="px-4 py-2">E-post</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Admin</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.full_name}</td>
                  <td className="px-4 py-2 text-gray-500">{u.email}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.is_active ? 'Aktiv' : 'Deaktivert'}
                    </span>
                  </td>
                  <td className="px-4 py-2">{u.is_admin ? '👑' : ''}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => toggleActive(u)} className="text-indigo-600 hover:underline text-xs">
                      {u.is_active ? 'Deaktiver' : 'Aktiver'}
                    </button>
                    <button onClick={() => toggleAdmin(u)} className="text-gray-500 hover:underline text-xs">
                      {u.is_admin ? 'Fjern admin' : 'Gjør til admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
