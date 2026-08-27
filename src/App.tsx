import { useState, useEffect, Fragment } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
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

const DISMISS_KEY = '2ndroom:auth-prompt-dismissed'

type View = 'main' | 'session'

export default function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [user,      setUser]      = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)   // prevents flash before session loads
  const [dismissed, setDismissed] = useState(
    () => !!sessionStorage.getItem(DISMISS_KEY),
  )

  // Derive display name from the Supabase user's Google metadata
  const userName: string =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    (user?.user_metadata?.name as string | undefined)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there'

  // Load session on mount, then subscribe to auth changes
  useEffect(() => {
    // 1. Get existing session (persisted across refreshes by Supabase automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    // 2. Subscribe to future auth events (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Clear banner dismiss on fresh login so the status pill shows
        sessionStorage.removeItem(DISMISS_KEY)
        setDismissed(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // onAuthStateChange fires → setUser(null) automatically
    sessionStorage.removeItem(DISMISS_KEY)
    setDismissed(false)
  }

  // ── App state ───────────────────────────────────────────────────────────────
  const [view,            setView]           = useState<View>('main')
  const [activeTopicId,   setActiveTopicId]  = useState<string | undefined>()
  const [sessionDuration, setSessionDuration] = useState<number | null>(null)
  const [isMobile,        setIsMobile]       = useState(false)
  const [topicState,      setTopicState]     = useState<Record<string, TopicStatus>>(loadTopicState)
  const [activityData,    setActivityData]   = useState(loadActivityData)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  // Don't render until Supabase has resolved the initial session —
  // avoids a flash where the banner shows briefly before the session loads.
  if (!authReady) return null

  return (
    <Fragment>
      <WaveBackground isMobile={isMobile} />

      {view === 'session' && (
        <Session
          completedTopics={topicState}
          onComplete={handleTopicComplete}
          onClose={handleSessionClose}
          initialTopicId={activeTopicId}
          duration={sessionDuration}
        />
      )}

      {view === 'main' && (
        <div className="app">
          <Header onMenuToggle={() => {}} userName={userName} />
          <main className="main-content">
            <div className="viewport-section">
              <Hero onSpin={handleSpin} />
            </div>
          </main>
        </div>
      )}

      <AuthPrompt
        user={user}
        dismissed={dismissed}
        onDismiss={handleDismiss}
        onSignOut={handleSignOut}
      />
    </Fragment>
  )
}
