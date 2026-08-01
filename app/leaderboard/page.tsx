'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Registration } from '@/lib/types'
import { buildLeaderboard } from '@/lib/leaderboard'
import { formatNorwegian, toISO, dfMax, dfMin } from '@/lib/dates'
import { COMPETITION_START, COMPETITION_END } from '@/lib/constants'
import {
  eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, parseISO, format,
} from 'date-fns'
 
type Tab = 'total' | 'month' | 'week' | 'day'
 
export default function LeaderboardPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [regs, setRegs] = useState<Registration[]>([])
  const [meId, setMeId] = useState('')
  const [tab, setTab] = useState<Tab>('total')
  const [loading, setLoading] = useState(true)
 
  const start = parseISO(COMPETITION_START)
  const end = parseISO(COMPETITION_END)
  const clampedToday = dfMax([start, dfMin([end, new Date()])])
 
  const [monthIndex, setMonthIndex] = useState(0)
  const [weekIndex, setWeekIndex] = useState(0)
  const [dayISO, setDayISO] = useState(toISO(clampedToday))
 
  const months = useMemo(() => eachMonthOfInterval({ start, end }), [])
  const weeks = useMemo(() => eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }), [])
 
  useEffect(() => {
    const mi = months.findIndex((m) => format(m, 'yyyy-MM') === format(clampedToday, 'yyyy-MM'))
    if (mi >= 0) setMonthIndex(mi)
    const wi = weeks.findIndex((w) =>
      clampedToday >= startOfWeek(w, { weekStartsOn: 1 }) && clampedToday <= endOfWeek(w, { weekStartsOn: 1 })
    )
    if (wi >= 0) setWeekIndex(wi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
 
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMeId(user?.id || '')
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from('profiles').select('*').eq('is_active', true),
        supabase.from('registrations').select('*'),
      ])
      setProfiles(p || [])
      setRegs(r || [])
      setLoading(false)
    }
    load()
  }, [])
 
  const lastRegByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of regs) {
      const current = map.get(r.user_id)
      if (!current || r.date > current) map.set(r.user_id, r.date)
    }
    return map
  }, [regs])
 
  if (loading) return <div className="text-center py-20 text-gray-500">Laster...</div>
 
  let fromISO: string | undefined
  let toISOFilter: string | undefined
  let title = 'Totalt leaderboard'
 
  if (tab === 'month') {
    const m = months[monthIndex]
    fromISO = toISO(startOfMonth(m))
    toISOFilter = toISO(endOfMonth(m))
    title = format(m, 'MMMM yyyy')
  } else if (tab === 'week') {
    const w = weeks[weekIndex]
    fromISO = toISO(startOfWeek(w, { weekStartsOn: 1 }))
    toISOFilter = toISO(endOfWeek(w, { weekStartsOn: 1 }))
    title = `Uke: ${formatNorwegian(fromISO)} - ${formatNorwegian(toISOFilter)}`
  } else if (tab === 'day') {
    fromISO = dayISO
    toISOFilter = dayISO
    title = formatNorwegian(dayISO)
  }
 
  const rows = buildLeaderboard(profiles, regs, fromISO, toISOFilter)
 
  const badgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-300 text-yellow-900'
    if (rank === 2) return 'bg-gray-300 text-gray-800'
    if (rank === 3) return 'bg-orange-300 text-orange-900'
    return 'bg-indigo-100 text-indigo-700'
  }
  const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null)
 
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Leaderboard 🏆</h1>
 
      <select
        value={tab}
        onChange={(e) => setTab(e.target.value as Tab)}
        className="lg:hidden w-full mb-4 border rounded-lg px-3 py-2 bg-white text-sm font-medium"
      >
        <option value="total">Totalt</option>
        <option value="month">Måned</option>
        <option value="week">Uke</option>
        <option value="day">Dag</option>
      </select>
 
      <div className="hidden lg:flex gap-2 mb-4">
        {(['total', 'month', 'week', 'day'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              tab === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 shadow'
            }`}>
            {t === 'total' ? 'Totalt' : t === 'month' ? 'Måned' : t === 'week' ? 'Uke' : 'Dag'}
          </button>
        ))}
      </div>
 
      {tab === 'month' && (
        <div className="flex items-center gap-2 mb-3">
          <button disabled={monthIndex <= 0} onClick={() => setMonthIndex((i) => i - 1)}
            className="px-2 py-1 bg-white rounded shadow disabled:opacity-30">←</button>
          <span className="text-sm font-medium capitalize">{title}</span>
          <button disabled={monthIndex >= months.length - 1} onClick={() => setMonthIndex((i) => i + 1)}
            className="px-2 py-1 bg-white rounded shadow disabled:opacity-30">→</button>
        </div>
      )}
      {tab === 'week' && (
        <div className="flex items-center gap-2 mb-3">
          <button disabled={weekIndex <= 0} onClick={() => setWeekIndex((i) => i - 1)}
            className="px-2 py-1 bg-white rounded shadow disabled:opacity-30">←</button>
          <span className="text-sm font-medium">{title}</span>
          <button disabled={weekIndex >= weeks.length - 1} onClick={() => setWeekIndex((i) => i + 1)}
            className="px-2 py-1 bg-white rounded shadow disabled:opacity-30">→</button>
        </div>
      )}
      {tab === 'day' && (
        <div className="mb-3">
          <input type="date" value={dayISO} min={COMPETITION_START} max={COMPETITION_END}
            onChange={(e) => setDayISO(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full lg:w-auto" />
        </div>
      )}
      {tab === 'total' && (
        <p className="text-sm text-gray-500 mb-3">
          Hele konkurranseperioden: {formatNorwegian(COMPETITION_START)} - {formatNorwegian(COMPETITION_END)}
        </p>
      )}
 
      {/* Kortvisning med header - brukes på mobil og nettbrett (portrett OG liggende) */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3 px-3 pb-2">
          <div className="w-11 flex-shrink-0"></div>
          <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Navn</div>
          <div className="flex-shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wide">Minutter</div>
        </div>
        <div className="space-y-2">
          {rows.map((r) => {
            const lastDate = lastRegByUserId.get(r.userId)
            return (
              <div key={r.userId}
                className={`bg-white rounded-xl shadow p-3 flex items-center gap-3 ${
                  r.userId === meId ? 'ring-2 ring-indigo-400 bg-indigo-50/40' : ''
                }`}>
                <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${badgeStyle(r.rank)}`}>
                  {medal(r.rank) || r.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${r.userId === meId ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {r.name}{r.userId === meId ? ' (deg)' : ''}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-indigo-600 leading-tight">{r.minutes}</p>
                  {lastDate && (
                    <p className="text-[11px] text-gray-400 leading-tight whitespace-nowrap">
                      Sist: {formatNorwegian(lastDate)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
 
      {/* Tabellvisning - kun store skjermer (PC) */}
      <div className="hidden lg:block bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Navn</th>
              <th className="px-4 py-2">Sist registrert</th>
              <th className="px-4 py-2 text-right">Minutter</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const lastDate = lastRegByUserId.get(r.userId)
              return (
                <tr key={r.userId} className={`border-t ${r.userId === meId ? 'bg-indigo-50 font-semibold' : ''}`}>
                  <td className="px-4 py-2">{medal(r.rank) || r.rank}</td>
                  <td className="px-4 py-2">{r.name}{r.userId === meId ? ' (deg)' : ''}</td>
                  <td className="px-4 py-2 text-gray-500">{lastDate ? formatNorwegian(lastDate) : '-'}</td>
                  <td className="px-4 py-2 text-right">{r.minutes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
