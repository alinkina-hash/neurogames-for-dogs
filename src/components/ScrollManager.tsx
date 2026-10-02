import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

// Last scroll position of each history entry, keyed by location.key.
const positions = new Map<string, number>()

/**
 * Opens every new screen at the top, and restores the previous position when the
 * user goes back (browser back button or the in-app back link).
 */
function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  // Updated before we scroll, so the scroll event our own scrollTo() fires is
  // recorded for the new screen rather than overwriting the one we just left.
  const currentKey = useRef(location.key)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    const remember = () => positions.set(currentKey.current, window.scrollY)
    window.addEventListener('scroll', remember, { passive: true })
    return () => window.removeEventListener('scroll', remember)
  }, [])

  useLayoutEffect(() => {
    currentKey.current = location.key
    const saved = navigationType === 'POP' ? positions.get(location.key) : undefined
    window.scrollTo(0, saved ?? 0)
  }, [location.key, navigationType])

  return null
}

export default ScrollManager
