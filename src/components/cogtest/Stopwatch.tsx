import { useCallback, useEffect, useRef, useState } from 'react'

interface StopwatchProps {
  limitSeconds?: number
  onStop(seconds: number): void
  onReset?(): void
}

/**
 * Whole-second stopwatch. Time comes from performance.now() deltas, so throttled timers do not drift
 * and wall-clock changes do not affect it; the value is never negative.
 */
function Stopwatch({ limitSeconds, onStop, onReset }: StopwatchProps) {
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const startedAt = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const callbacks = useRef({ onStop, limitSeconds })
  useEffect(() => {
    callbacks.current = { onStop, limitSeconds }
  })

  const clear = useCallback(() => {
    window.clearInterval(timer.current)
    timer.current = undefined
  }, [])

  useEffect(() => clear, [clear])

  function elapsed() {
    return Math.max(0, Math.floor((performance.now() - startedAt.current) / 1000))
  }

  function start() {
    startedAt.current = performance.now()
    setSeconds(0)
    setRunning(true)
    clear()
    timer.current = window.setInterval(() => {
      const { limitSeconds: limit, onStop: stop } = callbacks.current
      const value = elapsed()
      if (limit !== undefined && value >= limit) {
        clear()
        setSeconds(limit)
        setRunning(false)
        stop(limit)
        return
      }
      setSeconds(value)
    }, 200)
  }

  function stop() {
    clear()
    const value = elapsed()
    const limit = callbacks.current.limitSeconds
    const final = limit !== undefined ? Math.min(value, limit) : value
    setSeconds(final)
    setRunning(false)
    callbacks.current.onStop(final)
  }

  function reset() {
    clear()
    setRunning(false)
    setSeconds(0)
    onReset?.()
  }

  return (
    <div className="stopwatch">
      <div className="stopwatch-digits" role="timer" aria-label="Секундомер">
        {seconds}
        <span className="stopwatch-unit"> с</span>
      </div>
      <div className="stopwatch-buttons">
        {running ? (
          <button type="button" className="button stopwatch-main" onClick={stop}>
            Стоп
          </button>
        ) : (
          <button type="button" className="button stopwatch-main" onClick={start}>
            Старт
          </button>
        )}
        <button type="button" className="chip" onClick={reset} disabled={!running && seconds === 0}>
          Сбросить
        </button>
      </div>
    </div>
  )
}

export default Stopwatch
