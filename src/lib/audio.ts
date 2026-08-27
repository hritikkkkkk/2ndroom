/**
 * Web Audio API sound engine — matches the live site exactly.
 * All audio is gated by the global mute state.
 */

let audioCtx: AudioContext | null = null
let soundEnabled = true

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (Ctor) audioCtx = new Ctor()
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/** Toggle mute — returns the new state (true = sound on). */
export function toggleSound(): boolean {
  soundEnabled = !soundEnabled
  if (soundEnabled) getCtx()
  return soundEnabled
}

export function isSoundEnabled(): boolean {
  return soundEnabled
}

/**
 * Wheel scroll tick — two short triangle oscillators pitched up/down.
 * @param isCenter true when the center item just changed (slightly different pitch)
 */
export function playScrollTick(isCenter = false): void {
  if (!soundEnabled) return
  const ctx = getCtx()
  if (!ctx) return
  try {
    const t = ctx.currentTime
    const freq = isCenter ? 1600 + Math.random() * 600 : 1100 + Math.random() * 300
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(isCenter ? 2800 : 2000, t)
    filter.Q.setValueAtTime(2.5, t)
    const duration = isCenter ? 0.015 : 0.022
    const gainVal = isCenter ? 0.08 : 0.12
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(300, t + duration)
    gain.gain.setValueAtTime(gainVal, t)
    gain.gain.exponentialRampToValueAtTime(1e-4, t + duration)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + duration + 0.002)
  } catch (_) { /* ignore */ }
}

/** Spin button — two triangle oscillators sweeping down. */
export function playSpinSound(): void {
  if (!soundEnabled) return
  const ctx = getCtx()
  if (!ctx) return
  try {
    const t = ctx.currentTime
    for (let i = 0; i < 2; i++) {
      const offset = t + i * 0.04
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(1200, offset)
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(i === 0 ? 1200 : 1800, offset)
      osc.frequency.exponentialRampToValueAtTime(300, offset + 0.025)
      gain.gain.setValueAtTime(0.18, offset)
      gain.gain.exponentialRampToValueAtTime(0.001, offset + 0.03)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.start(offset)
      osc.stop(offset + 0.037)
    }
  } catch (_) { /* ignore */ }
}

/** Completion chime — sine sweep upward. */
export function playCompletionSound(): void {
  if (!soundEnabled) return
  const ctx = getCtx()
  if (!ctx) return
  try {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, t)
    osc.frequency.exponentialRampToValueAtTime(1040, t + 0.09)
    gain.gain.setValueAtTime(0.15, t)
    gain.gain.exponentialRampToValueAtTime(1e-4, t + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.16)
  } catch (_) { /* ignore */ }
}

/** Call this on any user gesture to unlock the AudioContext on iOS/Safari. */
export function unlockAudio(): void {
  getCtx()
}
