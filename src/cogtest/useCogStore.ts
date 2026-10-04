import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { reducer, unfinishedSurvey, unfinishedTest, type Action } from './reducer'
import { emptyStore, loadStore, makeId, saveStore, storageChange, type LoadResult } from './storage'
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
  startSurvey: (dogId: string) => string
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
  // The last store taken from another tab: it is already in storage, so it is not written back.
  const external = useRef<Store | null>(null)
  // Ids handed out by startTest that the store may not reflect yet (before the next render).
  const pendingStarts = useRef(new Map<string, string>())
  const pendingSurveyStarts = useRef(new Map<string, string>())
  useEffect(() => {
    storeRef.current = store
    for (const [dogId, testId] of pendingStarts.current) {
      if (store.tests.some((test) => test.id === testId)) pendingStarts.current.delete(dogId)
    }
    for (const [dogId, surveyId] of pendingSurveyStarts.current) {
      if (store.surveys.some((survey) => survey.id === surveyId)) pendingSurveyStarts.current.delete(dogId)
    }
    if (status !== 'ok' || store === initialStore || store === external.current) return
    // Persisting is synchronization with an external system; its failure is reported via status.
    // oxlint-disable-next-line react/set-state-in-effect
    if (!saveStore(getStorage(), store)) setStatus('unavailable')
  }, [store, status, initialStore])

  // Another tab changed the data: take it over so neither tab overwrites the other with an old copy.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      const storage = getStorage()
      if (event.storageArea && storage && event.storageArea !== storage) return
      const change = storageChange(event.key, event.newValue)
      if (!change) return
      if (change.kind === 'corrupt') {
        setStatus('corrupt')
        setCorruptRaw(change.raw)
        return
      }
      const next = change.kind === 'ok' ? change.store : emptyStore()
      external.current = next
      setStatus('ok')
      setCorruptRaw(undefined)
      dispatch({ type: 'replaceAll', store: next })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const startTest = useCallback((dogId: string) => {
    const existing = unfinishedTest(storeRef.current, dogId)
    if (existing) return existing.id
    const pending = pendingStarts.current.get(dogId)
    if (pending) return pending
    const testId = makeId()
    pendingStarts.current.set(dogId, testId)
    dispatch({ type: 'startTest', dogId, now: new Date().toISOString(), testId })
    return testId
  }, [])

  const startSurvey = useCallback((dogId: string) => {
    const existing = unfinishedSurvey(storeRef.current, dogId)
    if (existing) return existing.id
    const pending = pendingSurveyStarts.current.get(dogId)
    if (pending) return pending
    const surveyId = makeId()
    pendingSurveyStarts.current.set(dogId, surveyId)
    dispatch({ type: 'startSurvey', dogId, now: new Date().toISOString(), surveyId })
    return surveyId
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

  return { store, status, corruptRaw, dispatch, startTest, startSurvey, resetCorrupt }
}
