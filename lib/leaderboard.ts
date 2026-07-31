import { Profile, Registration } from './types'
 
export type LeaderboardRow = {
  rank: number
  userId: string
  name: string
  minutes: number
}
 
export function buildLeaderboard(
  profiles: Profile[],
  registrations: Registration[],
  fromISO?: string,
  toISOFilter?: string
): LeaderboardRow[] {
  const filtered = registrations.filter((r) => {
    if (fromISO && r.date < fromISO) return false
    if (toISOFilter && r.date > toISOFilter) return false
    return true
  })
 
  const totals = new Map<string, number>()
  for (const p of profiles) totals.set(p.id, 0)
  for (const r of filtered) {
    if (!totals.has(r.user_id)) continue
    totals.set(r.user_id, (totals.get(r.user_id) || 0) + r.minutes)
  }
 
  const rows = profiles.map((p) => ({
    userId: p.id,
    name: p.full_name || 'Ukjent',
    minutes: totals.get(p.id) || 0,
  }))
 
  rows.sort((a, b) => b.minutes - a.minutes)
 
  let lastMinutes: number | null = null
  let displayedRank = 0
 
  return rows.map((r, idx) => {
    const rank = idx + 1
    if (r.minutes !== lastMinutes) {
      displayedRank = rank
      lastMinutes = r.minutes
    }
    return { rank: displayedRank, userId: r.userId, name: r.name, minutes: r.minutes }
  })
}
