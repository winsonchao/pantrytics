import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, BellRing } from 'lucide-react'

interface CookingTimerProps {
  initialSeconds: number
  label?: string
  onComplete?: () => void
}

export function CookingTimer({ initialSeconds, label, onComplete }: CookingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setIsRunning(false)
            setHasFinished(true)
            if (onComplete) onComplete()
            playBeep()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, timeLeft, onComplete])

  function playBeep() {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 1.2)
      }
    } catch {
      // Audio might be blocked by browser autoplay policy
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleReset = () => {
    setIsRunning(false)
    setHasFinished(false)
    setTimeLeft(initialSeconds)
  }

  const percentage = Math.max(0, Math.min(100, ((initialSeconds - timeLeft) / initialSeconds) * 100))

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
      hasFinished
        ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
        : isRunning
        ? 'bg-orange-50 border-orange-200 text-orange-950'
        : 'bg-slate-50 border-slate-200 text-slate-700'
    }`}>
      <div className="flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wider">
        {hasFinished ? (
          <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
        ) : null}
        <span>{formatTime(timeLeft)}</span>
      </div>

      {label ? <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">{label}</span> : null}

      {/* Mini Progress Bar */}
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full transition-all duration-300 ${hasFinished ? 'bg-amber-500' : 'bg-orange-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            if (hasFinished) {
              handleReset()
            } else {
              setIsRunning(!isRunning)
            }
          }}
          className={`p-1 rounded-lg text-xs font-medium transition-colors ${
            isRunning
              ? 'bg-orange-200 hover:bg-orange-300 text-orange-900'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
          title={isRunning ? '暫停' : '開始計時'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          title="重設"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
