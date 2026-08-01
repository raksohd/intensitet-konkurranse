'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile, Registration } from '@/lib/types'
import { buildLeaderboard } from '@/lib/leaderboard'
import { todayISO, formatNorwegian, computeMissingDates, computeStreak, getStatus } from '@/lib/dates'
import { COMPETITION_START, COMPETITION_END } from '@/lib/constants'
 
export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [myRegs, setMyRegs] = useState<Registration[]>([])
  const [allRegs, setAllRegs] = useState<Registration[]>([])
  const [minutesInput, setMinutesInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
 
  const load = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profile }, { data: allProfiles }, { data: regs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*').eq('is_active', true),
      supabase.from('registrations').select('*'),
    ])
    setMe(profile)
    setProfiles(allProfiles || [])
    setAllRegs(regs || [])
    setMyRegs((regs || []).filter((r) => r.user_id === user.id))
    setLoading(false)
  }
 
  useEffect(() => { load() }, [])
 
  if (loading || !me) return <div className="text-center py-20 text-gray-500">Laster...</div>
 
  const status = getStatus()
  const today = todayISO()
  const todaysReg = myRegs.find((r) => r.date === today)
  const myRegisteredDates = new Set(myRegs.map((r) => r.date))
  const missingDates = computeMissingDates(myRegisteredDates)
  const streak = computeStreak(myRegisteredDates)
 
  const leaderboard = buildLeaderboard(profiles, allRegs)
  const myRow = leaderboard.find((r) => r.userId === me.id)
  const myRank = myRow?.rank ?? '-'
  const myTotal = myRow?.minutes ?? 0
 
  let gapToNext: number | null = null
  let nextName = ''
  if (myRow && myRow.rank > 1) {
    const above = leaderboard.find((r) => r.rank === myRow.rank - 1)
    if (above) { gapToNext = above.minutes - myRow.minutes; nextName = above.name }
  }
 
  const saveToday = async (e: React.FormEvent) => {
    e.preventDefault()
    const minutes = parseInt(minutesInput, 10)
    if (isNaN(minutes) || minutes < 0) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('registrations').upsert(
      { user_id: user.id, date: today, minutes },
      { onConflict: 'user_id,date' }
    )
    setSaving(false)
    if (!error) {
      setSaveMsg('Lagret!')
      setMinutesInput('')
      load()
    }
  }
 
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hei, {me.full_name.split(' ')[0] || 'der'}! 👋</h1>
        <p className="text-gray-500">Her er statusen din i konkurransen.</p>
      </div>
 
      {status === 'not-started' && (
        <div className="bg-blue-50 text-blue-800 rounded-xl p-4 text-sm">
          Konkurransen starter {formatNorwegian(COMPETITION_START)}. Gjør deg klar!
        </div>
      )}
      {status === 'ended' && (
        <div className="bg-purple-50 text-purple-800 rounded-xl p-4 text-sm">
          Konkurransen er avsluttet ({formatNorwegian(COMPETITION_END)}). Takk for innsatsen! 🎉
        </div>
      )}
 
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Mine minutter totalt" value={myTotal} />
        <StatCard label="Min plassering" value={`#${myRank} av ${leaderboard.length}`} />
        <StatCard
          label={gapToNext !== null ? `Til ${nextName}` : 'Plassering'}
          value={gapToNext !== null ? `${gapToNext} min` : (myRow?.rank === 1 ? '🏆 Du leder!' : '-')}
        />
        <StatCard label="Streak" value={`${streak} dager`} />
      </div>
 
      {status === 'active' && (
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold mb-3">Dagens registrering ({formatNorwegian(today)})</h2>
          {todaysReg ? (
            <div className="flex items-center justify-between">
              <p className="text-green-700 font-medium">✅ Registrert: {todaysReg.minutes} minutter</p>
              <Link href={`/register?date=${today}`} className="text-indigo-600 text-sm hover:underline">Endre</Link>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-3">Du har ikke registrert dagens økt enda.</p>
              <form onSubmit={saveToday} className="flex gap-2">
                <input type="number" min={0} required value={minutesInput}
                  onChange={(e) => setMinutesInput(e.target.value)}
                  placeholder="Antall minutter"
                  className="flex-1 border rounded-lg px-3 py-2" />
                <button disabled={saving}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Lagrer...' : 'Lagre'}
                </button>
              </form>
              {saveMsg && <p className="text-green-700 text-sm mt-2">{saveMsg}</p>}
            </>
          )}
        </div>
      )}
 
      {missingDates.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-5">
          <h2 className="font-semibold mb-2 text-amber-900">Glemt å registrere? 🕵️</h2>
          <p className="text-sm text-amber-800 mb-3">Du mangler registrering for {missingDates.length} dag(er):</p>
          <div className="flex flex-wrap gap-2">
            {missingDates.slice(0, 10).map((d) => (
              <Link key={d} href={`/register?date=${d}`}
                className="text-sm bg-white border border-amber-300 rounded-lg px-3 py-1 hover:bg-amber-100">
                {formatNorwegian(d)}
              </Link>
            ))}
            {missingDates.length > 10 && <span className="text-sm text-amber-700">+{missingDates.length - 10} til</span>}
          </div>
        </div>
      )}
 
      <div className="flex gap-3">
        <Link href="/leaderboard" className="flex-1 text-center bg-white shadow rounded-xl py-3 font-medium hover:bg-gray-50">
          Se leaderboard 🏆
        </Link>
        <Link href="/history" className="flex-1 text-center bg-white shadow rounded-xl py-3 font-medium hover:bg-gray-50">
          Min historikk 📋
        </Link>
      </div>
    </div>
  )
}
 
function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  )
}
