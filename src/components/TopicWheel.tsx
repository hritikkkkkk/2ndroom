import { useEffect, useRef } from 'react'
import { ALL_TOPICS, type Topic } from '../data/topics'
import { playScrollTick, playSpinSound, playCompletionSound } from '../lib/audio'

// ── Constants matching the live site exactly ──────────────────────────────────
const ITEM_HEIGHT   = 52    // px per wheel slot
const VISIBLE_ITEMS = 11    // number of DOM items
const FOCUS_OFFSET  = 4     // index of the "center" slot among visible items
const LOOK_AHEAD    = 1     // extra items to look ahead when reading data
const CONTAINER_H   = 468   // total wheel container height
const CENTER_TOP    = 208   // top position of center highlight band
const BASE_SPEED    = 0.008 // default scroll speed (topics/frame)

interface TopicWheelProps {
  spinTrigger: number       // increment to trigger a spin
  selectedCategory: string  // 'all' or a category name
  onSpin: (topicId: string) => void
  completedTopicIds: string[]  // list of completed topic IDs to filter out
}

export default function TopicWheel({ spinTrigger, selectedCategory, onSpin, completedTopicIds }: TopicWheelProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const itemRefs      = useRef<(HTMLDivElement | null)[]>([])
  const posRef        = useRef(0)           // fractional scroll position (topic index)
  const prevCenterRef = useRef(-1)          // last rendered center index (for tick sound)
  const speedRef      = useRef(BASE_SPEED)
  const rafRef        = useRef(0)
  const isSpinningRef = useRef(false)
  const topicsRef     = useRef<Topic[]>(ALL_TOPICS)
  const spinTriggerRef = useRef(spinTrigger)
  const onSpinRef     = useRef(onSpin)
  onSpinRef.current   = onSpin

  // ── Update filtered topic list when category or completed topics change ────
  useEffect(() => {
    let filtered = ALL_TOPICS
    
    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory)
    }
    
    // Filter out completed topics for authenticated users
    if (completedTopicIds.length > 0) {
      filtered = filtered.filter((t) => !completedTopicIds.includes(t.id))
    }
    
    // If all topics are completed, show a message or use all topics
    topicsRef.current = filtered.length > 0 ? filtered : ALL_TOPICS
    posRef.current = 0
    prevCenterRef.current = -1
  }, [selectedCategory, completedTopicIds])

  // ── Main rAF loop — runs once, never re-created ──────────────────────────────
  useEffect(() => {
    function frame() {
      const topics = topicsRef.current
      const n      = topics.length
      posRef.current += speedRef.current
      if (posRef.current >= n) posRef.current -= n

      const frac   = posRef.current
      const center = Math.floor(frac)
      const offset = frac - center  // sub-item fractional offset [0,1)

      // Sound tick when center changes
      if (center !== prevCenterRef.current) {
        prevCenterRef.current = center
        playScrollTick(isSpinningRef.current)
      }

      for (let i = 0; i < VISIBLE_ITEMS; i++) {
        const el = itemRefs.current[i]
        if (!el) continue

        // Y position of this slot relative to container top
        const y = (i - FOCUS_OFFSET - offset) * ITEM_HEIGHT
        el.style.transform = `translateY(${y}px)`

        // Topic for this slot (wraps around)
        const topicIdx = ((center - LOOK_AHEAD + i - FOCUS_OFFSET) % n + n * 1000) % n
        const topic    = topics[topicIdx] ?? topics[0]

        // Distance from center in item units
        const distFromCenter = (y + ITEM_HEIGHT / 2 - CONTAINER_H / 2) / ITEM_HEIGHT
        const dist = Math.abs(distFromCenter)

        // Visual weight — replicating the live site's exact formulas
        const opacity    = Math.max(0.07, 1 - dist * 0.27)
        const fontSize   = Math.max(0.9, 1.35 - dist * 0.1)
        const fontWeight = dist < 0.55 ? '500' : '400'
        const color      = dist < 0.55 ? '#0a0a0a' : '#888'

        el.style.opacity    = String(opacity)
        el.style.fontSize   = `${fontSize}rem`
        el.style.fontWeight = fontWeight
        el.style.color      = color

        const titleEl = el.querySelector('.twi-title') as HTMLElement | null
        const catEl   = el.querySelector('.twi-cat')   as HTMLElement | null
        if (titleEl) titleEl.textContent = topic.title
        if (catEl)   catEl.textContent   = dist < 0.55 ? topic.category : ''
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])  // intentionally empty — refs keep it live

  // ── Spin trigger ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Skip the initial mount (trigger starts at 0)
    if (spinTrigger === spinTriggerRef.current) return
    spinTriggerRef.current = spinTrigger

    if (isSpinningRef.current) return
    isSpinningRef.current = true
    playSpinSound()

    const topics = topicsRef.current
    const targetIdx = Math.floor(Math.random() * topics.length)

    speedRef.current = 0.4

    // After 1500ms start decelerating
    const startDeccel = setTimeout(() => {
      const deccel = setInterval(() => {
        speedRef.current *= 0.93
        if (speedRef.current <= 0.009) {
          speedRef.current = BASE_SPEED
          clearInterval(deccel)
          isSpinningRef.current = false
          playCompletionSound()
          onSpinRef.current(topics[targetIdx].id)
        }
      }, 40)
    }, 1500)

    return () => clearTimeout(startDeccel)
  }, [spinTrigger])

  return (
    <div
      className="topic-wheel"
      style={{ height: CONTAINER_H }}
      ref={containerRef}
    >
      {/* Top fade */}
      <div className="topic-wheel__fade topic-wheel__fade--top" />

      {/* Center highlight band */}
      <div
        className="topic-wheel__center"
        style={{ top: CENTER_TOP, height: ITEM_HEIGHT }}
      />

      {/* Scrolling items */}
      <div
        className="topic-wheel__items"
        style={{ height: CONTAINER_H }}
      >
        {Array.from({ length: VISIBLE_ITEMS }, (_, i) => (
          <div
            key={i}
            ref={(el) => { itemRefs.current[i] = el }}
            className="topic-wheel__item"
            style={{
              height: ITEM_HEIGHT,
              position: 'absolute',
              width: '100%',
              top: 0,
            }}
          >
            <span className="twi-title" />
            <span className="twi-cat" />
          </div>
        ))}
      </div>

      {/* Bottom fade */}
      <div className="topic-wheel__fade topic-wheel__fade--bottom" />
    </div>
  )
}
