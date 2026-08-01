'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Registration } from '@/lib/types'
import { formatNorwegian } from '@/lib/dates'
 
export default function HistoryPage() {
  const supabase = createClient()
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [sortDesc, setSortDesc] = useState(true)
 
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
 
  const sorted = [...regs].sort((a, b) => sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
  const total = regs.reduce((sum, r) => sum + r.minutes, 0)
 
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Min historikk</h1>
        <span className="text-sm text-gray-500">Totalt: {total} min</span>
      </div>
 
      {loading ? (
        <p className="text-gray-500">Laster...</p>
      ) : regs.length === 0 ? (
        <p className="text-gray-500">
          Du har ingen registreringer enda.{' '}
          <Link href="/register" className="text-indigo-600 hover:underline">Registrer din første økt</Link>
        </p>
      ) : (
        <>
          <button
            onClick={() => setSortDesc(!sortDesc)}
            className="mb-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Sorter etter dato {sortDesc ? '↓ (nyest først)' : '↑ (eldst først)'}
          </button>
 
          {/* Mobilvisning: kort-liste */}
          <div className="sm:hidden space-y-2">
            {sorted.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{formatNorwegian(r.date)}</p>
                  <p className="text-sm text-gray-500">{r.minutes} minutter</p>
                </div>
                <Link href={`/register?date=${r.date}`}
                  className="text-indigo-600 text-sm font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
                  Rediger
                </Link>
              </div>
            ))}
          </div>
 
          {/* Desktop-visning: tabell */}
          <div className="hidden sm:block bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-2">Dato</th>
                  <th className="px-4 py-2">Minutter</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2">{formatNorwegian(r.date)}</td>
                    <td className="px-4 py-2">{r.minutes} min</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/register?date=${r.date}`} className="text-indigo-600 hover:underline">Rediger</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
