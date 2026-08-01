'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
 
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('Feil e-post eller passord.'); return }
    router.push('/dashboard')
    router.refresh()
  }
 
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); return }
    setResetSent(true)
  }
 
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-bold text-center mb-1">Intensitetsminutter 2026</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Logg inn for å registrere og se leaderboard</p>
 
        {!resetMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">E-post</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Passord</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Logger inn...' : 'Logg inn'}
            </button>
            <button type="button" onClick={() => setResetMode(true)}
              className="w-full text-sm text-indigo-600 hover:underline">
              Glemt passord?
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {resetSent ? (
              <p className="text-sm text-green-700">Sjekk e-posten din for lenke til å tilbakestille passord.</p>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">E-post</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700">
                  Send lenke
                </button>
              </>
            )}
            <button type="button" onClick={() => { setResetMode(false); setResetSent(false) }}
              className="w-full text-sm text-gray-500 hover:underline">
              Tilbake til innlogging
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
