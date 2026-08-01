'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
 
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Passordet må være minst 6 tegn.'); return }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); return }
    setMessage('Passord oppdatert! Du blir sendt videre...')
    setTimeout(() => router.push('/dashboard'), 1500)
  }
 
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6">
        <h1 className="text-lg font-bold mb-4">Velg nytt passord</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Nytt passord" className="w-full border rounded-lg px-3 py-2" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium">Lagre</button>
        </form>
      </div>
    </div>
  )
}
