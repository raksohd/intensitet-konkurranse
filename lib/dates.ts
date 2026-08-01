import {
  addDays, eachDayOfInterval, endOfWeek, format, isAfter, isBefore,
  max as dfMax, min as dfMin, parseISO, startOfWeek,
} from 'date-fns'
import { COMPETITION_START, COMPETITION_END } from './constants'
 
export const toISO = (d: Date) => format(d, 'yyyy-MM-dd')
export const todayISO = () => toISO(new Date())
 
export const formatNorwegian = (isoDate: string) => format(parseISO(isoDate), 'dd.MM.yyyy')
 
export const competitionStart = parseISO(COMPETITION_START)
export const competitionEnd = parseISO(COMPETITION_END)
 
export function getStatus(): 'not-started' | 'active' | 'ended' {
  const today = new Date()
  if (isBefore(today, competitionStart)) return 'not-started'
  if (isAfter(today, competitionEnd)) return 'ended'
  return 'active'
}
 
export function getWeekRange(date: Date) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  }
}
 
// Dager før i dag (og innenfor konkurranseperioden) uten registrering.
export function computeMissingDates(registeredDates: Set<string>): string[] {
  const today = new Date()
  const upperBoundary = dfMin([addDays(today, -1), competitionEnd])
  if (isBefore(upperBoundary, competitionStart)) return []
  const days = eachDayOfInterval({ start: competitionStart, end: upperBoundary })
  return days.map(toISO).filter((d) => !registeredDates.has(d)).reverse()
}
 
// Antall dager på rad med registrering, regnet bakover fra i dag/i går.
export function computeStreak(registeredDates: Set<string>): number {
  const today = new Date()
  let cursor = registeredDates.has(toISO(today)) ? today : addDays(today, -1)
  if (!registeredDates.has(toISO(cursor))) return 0
  let streak = 0
  while (registeredDates.has(toISO(cursor)) && !isBefore(cursor, competitionStart)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
 
function daysBetweenInclusive(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1
}
 
// Gjennomsnitt minutter/dag de siste N dagene (innenfor konkurranseperioden).
// Brukes for både "siste 7 dager" og "siste 4 uker" (n=28) - alltid snitt PER DAG,
// for å unngå misvisende høye tall tidlig i konkurransen.
export function computeAverageLastNDays(
  regs: { date: string; minutes: number }[],
  n: number
): number {
  const today = dfMin([new Date(), competitionEnd])
  const windowStart = dfMax([competitionStart, addDays(today, -(n - 1))])
  const windowStartISO = toISO(windowStart)
  const todayISOStr = toISO(today)
 
  const sum = regs
    .filter((r) => r.date >= windowStartISO && r.date <= todayISOStr)
    .reduce((acc, r) => acc + r.minutes, 0)
 
  const elapsedDays = daysBetweenInclusive(windowStart, today)
  const denom = Math.max(1, Math.min(n, elapsedDays))
  return Math.round((sum / denom) * 10) / 10
}
 
export { dfMax, dfMin }
