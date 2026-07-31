'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COMPETITION_START, COMPETITION_END } from '@/lib/constants'
import { todayISO } from '@/lib/dates'
 
function RegisterInner() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const initialDate = searchParams.get('date') || todayISO()
  const maxDate = todayISO() > COMPETITION_END ? COMPETITION_END : todayISO()
 
  const [date, setDate] = useState(initialDate)
  const [minutes, setMinutes] = useState('')
  const [existing, setExisting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
 
  const loadExisting = async (d: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('registrations').select('*')
      .eq('user_id', user.id).eq('date', d).maybeSingle()
    if (data) { setMinutes(String(data.minutes)); setExisting(true) }
    else { setMinutes(''); setExisting(false) }
  }
 
  useEffect(() => { loadExisting(date) }, [date])
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setMessage('')
    const m = parseInt(minutes, 10)
    if (isNaN(m) || m < 0) { setError('Skriv inn et gyldig antall minutter (0 eller mer).'); return }
    if (date < COMPETITION_START || date > COMPETITION_END) {
      setError(`Dato må være mellom ${COMPETITION_START} og ${COMPETITION_END}.`); return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('registrations').upsert(
      { user_id: user.id, date, minutes: m },
      { onConflict: 'user_id,date' }
    )
    setSaving(false)
    if (error) { setError('Noe gikk galt: ' + error.message); return }
    setMessage(existing ? 'Registreringen ble oppdatert!' : 'Registrering lagret!')
    setExisting(true)
  }
 
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Registrer intensitetsminutter</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Dato</label>
          <input type="date" value={date} min={COMPETITION_START} max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Antall intensitetsminutter</label>
          <input type="number" min={0} required value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="f.eks. 45" />
        </div>
        {existing && (
          <p className="text-xs text-gray-500">
            Du har allerede en registrering denne dagen – lagring vil oppdatere den.
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button disabled={saving}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Lagrer...' : 'Lagre registrering'}
        </button>
      </form>
    </div>
  )
}
 
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">Laster...</div>}>
      <RegisterInner />
    </Suspense>
  )
}
