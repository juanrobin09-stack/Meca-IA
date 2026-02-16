import { useCallback, useRef } from 'react'

const AudioContext = window.AudioContext || (window as any).webkitAudioContext

function vibrate(pattern: number | number[]) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

function createOscillatorSound(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }, [])

  const playClick = useCallback(() => {
    vibrate(5)
    const ctx = getCtx()
    createOscillatorSound(ctx, 800, 0.08, 'sine', 0.1)
  }, [getCtx])

  const playSuccess = useCallback(() => {
    vibrate([10, 50, 10])
    const ctx = getCtx()
    createOscillatorSound(ctx, 523, 0.15, 'sine', 0.12)
    setTimeout(() => createOscillatorSound(ctx, 659, 0.15, 'sine', 0.12), 100)
    setTimeout(() => createOscillatorSound(ctx, 784, 0.2, 'sine', 0.12), 200)
  }, [getCtx])

  const playError = useCallback(() => {
    vibrate([30, 50, 30])
    const ctx = getCtx()
    createOscillatorSound(ctx, 300, 0.2, 'square', 0.08)
    setTimeout(() => createOscillatorSound(ctx, 200, 0.3, 'square', 0.08), 150)
  }, [getCtx])

  const playNotification = useCallback(() => {
    vibrate([10, 30, 10])
    const ctx = getCtx()
    createOscillatorSound(ctx, 880, 0.1, 'sine', 0.1)
    setTimeout(() => createOscillatorSound(ctx, 1100, 0.15, 'sine', 0.1), 80)
  }, [getCtx])

  const playNavigate = useCallback(() => {
    vibrate(3)
    const ctx = getCtx()
    createOscillatorSound(ctx, 600, 0.06, 'sine', 0.06)
  }, [getCtx])

  const playSend = useCallback(() => {
    vibrate([5, 30, 5])
    const ctx = getCtx()
    createOscillatorSound(ctx, 500, 0.08, 'sine', 0.1)
    setTimeout(() => createOscillatorSound(ctx, 700, 0.1, 'sine', 0.08), 60)
  }, [getCtx])

  return { playClick, playSuccess, playError, playNotification, playNavigate, playSend }
}
