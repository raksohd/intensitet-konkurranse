'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Registration } from '@/lib/types'
import { COMPETITION_START } from '@/lib/constants'
import { toISO } from '@/lib/dates'
import { eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek, parseISO, format, isAfter } from 'date-fns'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
 
export default function StatistikkPage() {
  const supabase = createClient()
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('registrations').select('*').eq('user_id', user.id)
      setRegs(data || [])
      setLoading(false)
    }
    load()
  }, [])
 
  const dailyData = useMemo(() => {
    if (regs.length === 0) return []
    const byDate = new Map(regs.map((r) => [r.date, r.minutes]))
    const lastDate = [...regs].map((r) => r.date).sort().slice(-1)[0]
    const start = parseISO(COMPETITION_START)
    const end = parseISO(lastDate)
    if (isAfter(start, end)) return []
    return eachDayOfInterval({ start, end }).map((d) => {
      const iso = toISO(d)
      return { date: format(d, 'dd.MM'), minutter: byDate.get(iso) || 0 }
    })
  }, [regs])
 
  const weeklyData = useMemo(() => {
    if (regs.length === 0) return []
    const lastDate = [...regs].map((r) => r.date).sort().slice(-1)[0]
    const start = parseISO(COMPETITION_START)
    const end = parseISO(lastDate)
    if (isAfter(start, end)) return []
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((w) => {
      const wStart = startOfWeek(w, { weekStartsOn: 1 })
      const wEnd = endOfWeek(w, { weekStartsOn: 1 })
      const sum = regs
        .filter((r) => r.date >= toISO(wStart) && r.date <= toISO(wEnd))
        .reduce((acc, r) => acc + r.minutes, 0)
      return { uke: `${format(wStart, 'dd.MM.yy')}-${format(wEnd, 'dd.MM.yy')}`, minutter: sum }
    })
  }, [regs])
 
  if (loading) return <div className="text-center py-20 text-gray-500">Laster...</div>
 
  if (regs.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">Statistikk 📊</h1>
        <p className="text-gray-500">
          Du har ingen registreringer enda. Statistikken vises her når du har registrert minst én økt.
        </p>
      </div>
    )
  }
 
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Statistikk 📊</h1>
 
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold mb-4">Daglige minutter</h2>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="minutter" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
 
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold mb-4">Ukentlige minutter</h2>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="uke" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="minutter" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
