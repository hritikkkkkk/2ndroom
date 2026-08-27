/**
 * Typed localStorage helpers matching the live site's storage keys.
 */

// ─── Topic completion state ───────────────────────────────────────────────────

export type TopicStatus = 'not-started' | 'in-progress' | 'completed'

const TOPICS_KEY = '2ndroom_topics'

export function loadTopicState(): Record<string, TopicStatus> {
  try {
    const raw = localStorage.getItem(TOPICS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, TopicStatus>) : {}
  } catch {
    return {}
  }
}

export function saveTopicState(state: Record<string, TopicStatus>): void {
  try {
    localStorage.setItem(TOPICS_KEY, JSON.stringify(state))
  } catch { /* ignore quota errors */ }
}

// ─── Activity / streak tracking ──────────────────────────────────────────────

const ACTIVITY_KEY = '2ndroom_activity'

export interface ActivityData {
  activeDates: string[]
  currentStreak: number
  longestStreak: number
  lastUpdated: string
}

const DEFAULT_ACTIVITY: ActivityData = {
  activeDates: [],
  currentStreak: 0,
  longestStreak: 0,
  lastUpdated: '',
}

export function loadActivityData(): ActivityData {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY)
    return raw ? (JSON.parse(raw) as ActivityData) : { ...DEFAULT_ACTIVITY }
  } catch {
    return { ...DEFAULT_ACTIVITY }
  }
}

export function saveActivityData(data: ActivityData): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function computeStreaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 }
  const unique = [...new Set(dates)].sort()
  const today = toDateString(new Date())
  const yesterday = toDateString(new Date(Date.now() - 86400000))
  let current = 0
  let longest = 0
  let run = 1

  for (let i = unique.length - 1; i >= 0; i--) {
    if (i === unique.length - 1) {
      if (unique[i] === today || unique[i] === yesterday) current = 1
    } else {
      const a = new Date(unique[i + 1])
      const b = new Date(unique[i])
      if ((a.getTime() - b.getTime()) / 86400000 === 1) {
        run++
        if (current > 0) current = run
      } else {
        run = 1
      }
    }
    longest = Math.max(longest, run)
  }
  return { current, longest }
}

/** Record today as an active date and recompute streaks. Returns updated data. */
export function recordActivity(current: ActivityData): ActivityData {
  const today = toDateString(new Date())
  const activeDates = current.activeDates.includes(today)
    ? current.activeDates
    : [...current.activeDates, today]
  const { current: currentStreak, longest: longestStreak } = computeStreaks(activeDates)
  return { activeDates, currentStreak, longestStreak, lastUpdated: today }
}
