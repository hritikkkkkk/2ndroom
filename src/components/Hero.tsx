import { useState } from 'react'
import TopicWheel from './TopicWheel'
import { THEME_TABS } from '../data/topics'
import { playSpinSound, unlockAudio } from '../lib/audio'

const TIMER_OPTIONS = [5, 10, 15] as const

interface HeroProps {
  onSpin: (topicId: string, duration: number | null) => void
}

export default function Hero({ onSpin }: HeroProps) {
  const [spinTrigger, setSpinTrigger]         = useState(0)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const handleSpinClick = () => {
    unlockAudio()
    playSpinSound()
    setSpinTrigger((n) => n + 1)
  }

  const handleTopicSelected = (topicId: string) => {
    onSpin(topicId, selectedDuration)
  }

  const handleDurationClick = (mins: number) => {
    unlockAudio()
    setSelectedDuration((prev) => (prev === mins ? null : mins))
  }

  const handleCategoryClick = (id: string) => {
    unlockAudio()
    setSelectedCategory(id)
  }

  return (
    <section
      className="hero"
      aria-label="Hero"
      onClick={unlockAudio}
    >
      {/* ── Left column ─────────────────────────────────────────────── */}
      <div className="hero__left">
        <h1 className="hero__heading">
          <span className="hero__heading-line">Think deeper.</span>
          <span className="hero__heading-line">
            Live <em>better.</em>
          </span>
        </h1>

        <p className="hero__subtext">
          A space for ideas, learning, self-mastery<br />
          and becoming someone who stands out<br />
          in any room.
        </p>

        <div className="hero__actions">
          <button
            className="hero__cta"
            onClick={handleSpinClick}
            id="spin-btn"
            aria-label="Spin to pick a random topic"
          >
            Spin
            <span className="hero__cta-arrow" aria-hidden="true">↻</span>
          </button>

          <div className="hero__timers" role="group" aria-label="Session duration">
            {TIMER_OPTIONS.map((mins) => (
              <button
                key={mins}
                className={`hero__timer-chip${selectedDuration === mins ? ' hero__timer-chip--active' : ''}`}
                onClick={() => handleDurationClick(mins)}
                aria-pressed={selectedDuration === mins}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right column ────────────────────────────────────────────── */}
      <div className="hero__right">
        {/* Theme tabs */}
        <div
          className="hero__theme-bar"
          role="tablist"
          aria-label="Select study theme"
        >
          {THEME_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`hero__theme-tab${selectedCategory === tab.id ? ' hero__theme-tab--active' : ''}`}
              onClick={() => handleCategoryClick(tab.id)}
              role="tab"
              aria-selected={selectedCategory === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Topic wheel */}
        <TopicWheel
          spinTrigger={spinTrigger}
          selectedCategory={selectedCategory}
          onSpin={handleTopicSelected}
        />
      </div>
    </section>
  )
}
