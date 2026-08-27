import { useState, useEffect, Fragment } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Session from './components/Session'
import WaveBackground from './components/WaveBackground'
import AuthPrompt from './components/AuthPrompt'
import {
  loadTopicState,
  saveTopicState,
  loadActivityData,
  saveActivityData,
  recordActivity,
  type TopicStatus,
} from './lib/storage'

type View = 'main' | 'session'

export default function App() {
  const [view,             setView]             = useState<View>('main')
  const [activeTopicId,    setActiveTopicId]     = useState<string | undefined>()
  const [sessionDuration,  setSessionDuration]   = useState<number | null>(null)
  const [isMobile,         setIsMobile]          = useState(false)
  const [topicState,       setTopicState]        = useState<Record<string, TopicStatus>>(loadTopicState)
  const [activityData,     setActivityData]      = useState(loadActivityData)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Lock body scroll in session view
  useEffect(() => {
    document.body.style.overflow = view === 'session' ? 'auto' : 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [view])

  const handleSpin = (topicId: string, duration: number | null) => {
    setActiveTopicId(topicId)
    setSessionDuration(duration)
    setView('session')
  }

  const handleTopicComplete = (topicId: string) => {
    const next = { ...topicState, [topicId]: 'completed' as TopicStatus }
    setTopicState(next)
    saveTopicState(next)

    const updatedActivity = recordActivity(activityData)
    setActivityData(updatedActivity)
    saveActivityData(updatedActivity)
  }

  const handleSessionClose = () => {
    setView('main')
    setActiveTopicId(undefined)
    setSessionDuration(null)
  }

  return (
    <Fragment>
      {/* Always-present wave background */}
      <WaveBackground isMobile={isMobile} />

      {/* Session overlay */}
      {view === 'session' && (
        <Session
          completedTopics={topicState}
          onComplete={handleTopicComplete}
          onClose={handleSessionClose}
          initialTopicId={activeTopicId}
          duration={sessionDuration}
        />
      )}

      {/* Main view */}
      {view === 'main' && (
        <div className="app">
          <Header onMenuToggle={() => {}} />
          <main className="main-content">
            <div className="viewport-section">
              <Hero onSpin={handleSpin} />
            </div>
          </main>
        </div>
      )}

      {/* Auth prompt (always rendered, manages its own visibility) */}
      <AuthPrompt />
    </Fragment>
  )
}
