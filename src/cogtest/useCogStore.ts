import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { reducer, unfinishedTest, type Action } from './reducer'
import { emptyStore, loadStore, makeId, saveStore, type LoadResult } from './storage'
import type { Store } from './types'

type Status = 'ok' | 'unavailable' | 'corrupt'

function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function initialLoad(): LoadResult {
  try {
    return loadStore(getStorage())
  } catch {
    return { kind: 'unavailable' }
  }
}

export function useCogStore(): {
  store: Store
  status: Status
  corruptRaw?: string
  dispatch: (action: Action) => void
  startTest: (dogId: string) => string
  resetCorrupt: () => void
} {
  const [loaded] = useState(initialLoad)
  const [initialStore] = useState(() => (loaded.kind === 'ok' ? loaded.store : emptyStore()))
  const [store, dispatch] = useReducer((s: Store, a: Action) => reducer(s, a), initialStore)
  const [status, setStatus] = useState<Status>(
    loaded.kind === 'corrupt' ? 'corrupt' : loaded.kind === 'unavailable' ? 'unavailable' : 'ok',
  )
  const [corruptRaw, setCorruptRaw] = useState(loaded.kind === 'corrupt' ? loaded.raw : undefined)

  const storeRef = useRef(store)
  useEffect(() => {
    storeRef.current = store
    if (status !== 'ok' || store === initialStore) return
    // Persisting is synchronization with an external system; its failure is reported via status.
    // oxlint-disable-next-line react/set-state-in-effect
    if (!saveStore(getStorage(), store)) setStatus('unavailable')
  }, [store, status, initialStore])

  const startTest = useCallback((dogId: string) => {
    const existing = unfinishedTest(storeRef.current, dogId)
    if (existing) return existing.id
    const testId = makeId()
    dispatch({ type: 'startTest', dogId, now: new Date().toISOString(), testId })
    return testId
  }, [])

  const resetCorrupt = useCallback(() => {
    const fresh = emptyStore()
    if (saveStore(getStorage(), fresh)) {
      setStatus('ok')
    } else {
      setStatus('unavailable')
    }
    setCorruptRaw(undefined)
    dispatch({ type: 'replaceAll', store: fresh })
  }, [])

  return { store, status, corruptRaw, dispatch, startTest, resetCorrupt }
}
