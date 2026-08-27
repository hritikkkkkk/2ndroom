import { useState } from 'react'
import { isSoundEnabled, toggleSound, unlockAudio } from '../lib/audio'

interface HeaderProps {
  onMenuToggle: () => void
  userName: string
}

export default function Header({ onMenuToggle, userName }: HeaderProps) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [soundOn, setSoundOn] = useState(isSoundEnabled())

  const handleSoundToggle = () => {
    const next = toggleSound()
    setSoundOn(next)
  }

  return (
    <header className="header">
      <div className="header__logo">2ndroom.</div>

      <div className="header__center">
        {greeting}, {userName}.
      </div>

      <div className="header__right">
        <button
          className={`header__sound-btn${soundOn ? '' : ' header__sound-btn--muted'}`}
          onClick={handleSoundToggle}
          aria-label={soundOn ? 'Mute scrolling sound' : 'Unmute scrolling sound'}
          title={soundOn ? 'Sound On' : 'Sound Muted'}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button
          className="header__menu-btn"
          onClick={() => { unlockAudio(); onMenuToggle() }}
          aria-label="Open menu"
          id="menu-trigger"
        >
          •••
        </button>
      </div>
    </header>
  )
}
