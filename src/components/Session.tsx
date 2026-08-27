import { useState, useEffect, useRef, useCallback } from 'react'
import { ALL_TOPICS, type Topic } from '../data/topics'
import type { TopicStatus } from '../lib/storage'
import { playCompletionSound } from '../lib/audio'

interface SessionProps {
  completedTopics: Record<string, TopicStatus>
  onComplete: (topicId: string) => void
  onClose: () => void
  initialTopicId?: string
  duration: number | null  // minutes, or null for no timer
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function pickTopic(
  completedTopics: Record<string, TopicStatus>,
  preferredId?: string,
): Topic {
  if (preferredId) {
    const found = ALL_TOPICS.find((t) => t.id === preferredId)
    if (found) return found
  }
  // Find first in-progress
  const inProgress = ALL_TOPICS.filter((t) => completedTopics[t.id] === 'in-progress')
  if (inProgress.length > 0) return inProgress[0]
  // First not-started
  const notStarted = ALL_TOPICS.filter((t) => !completedTopics[t.id] || completedTopics[t.id] === 'not-started')
  if (notStarted.length > 0) return notStarted[0]
  return ALL_TOPICS[0]
}

const RING_RADIUS  = 70
const RING_CIRCUM  = 2 * Math.PI * RING_RADIUS

export default function Session({
  completedTopics,
  onComplete,
  onClose,
  initialTopicId,
  duration,
}: SessionProps) {
  const topic         = pickTopic(completedTopics, initialTopicId)
  const totalSeconds  = duration !== null ? duration * 60 : null

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [running,     setRunning]     = useState(false)
  const [done,        setDone]        = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const handleComplete = useCallback(() => {
    clearTimer()
    onComplete(topic.id)
    setDone(true)
    playCompletionSound()
    setTimeout(onClose, 1400)
  }, [topic.id, onComplete, onClose])

  // Countdown when running
  useEffect(() => {
    if (!running || secondsLeft === null) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearTimer()
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [running, handleComplete])  // secondsLeft intentionally excluded to avoid reset

  const toggleRunning = () => setRunning((r) => !r)

  // Ring progress [0,1]
  const ringProgress = totalSeconds && secondsLeft !== null
    ? 1 - secondsLeft / totalSeconds
    : 0

  // ── No timer mode ──────────────────────────────────────────────────────────
  const noTimerContent = done ? (
    <div className="session__done">
      <span className="session__done-mark">●</span>
      {' '}Completed. Well done.
    </div>
  ) : (
    <button
      className="session__mark-btn"
      onClick={handleComplete}
      id="mark-understood-btn"
    >
      Mark as understood →
    </button>
  )

  // ── Timer mode ─────────────────────────────────────────────────────────────
  const startLabel =
    secondsLeft === totalSeconds ? 'Start' : running ? 'Pause' : 'Resume'

  const timerContent = (
    <div className="session__timer-block">
      <div className="session__ring-wrap">
        <svg
          className="session__ring"
          viewBox="0 0 160 160"
        >
          <circle
            cx="80" cy="80" r={RING_RADIUS}
            className="session__ring-track"
          />
          <circle
            cx="80" cy="80" r={RING_RADIUS}
            className="session__ring-fill"
            style={{
              strokeDasharray: `${RING_CIRCUM}`,
              strokeDashoffset: `${(1 - ringProgress) * RING_CIRCUM}px`,
            }}
          />
        </svg>
        <div className="session__ring-time">
          {done ? '✓' : formatTime(secondsLeft ?? 0)}
        </div>
      </div>

      {!done && (
        <div className="session__timer-actions">
          <button className="session__timer-btn" onClick={toggleRunning}>
            {startLabel}
          </button>
          <button className="session__mark-btn" onClick={handleComplete}>
            Done →
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="session">
      <div className="session__inner">
        <button className="session__back" onClick={onClose}>
          ← Back
        </button>

        <div className="session__meta">
          <span className="session__category">{topic.category}</span>
          <span className="session__number">Topic {topic.number}</span>
        </div>

        <div className="session__topic-section">
          <p className="session__label">Today's topic</p>
          <h2 className="session__topic-title">{topic.title}</h2>
          {topic.description && (
            <p className="session__description">{topic.description}</p>
          )}
        </div>

        <div className="session__actions">
          {totalSeconds === null ? noTimerContent : timerContent}
        </div>
      </div>
    </div>
  )
}
