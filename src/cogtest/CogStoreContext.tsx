import { createContext, useContext, type ReactNode } from 'react'
import { useCogStore } from './useCogStore'

type CogStore = ReturnType<typeof useCogStore>

const CogStoreContext = createContext<CogStore | null>(null)

/** Holds the one shared store for every profile and test page. */
export function CogStoreProvider({ children }: { children: ReactNode }) {
  const value = useCogStore()
  return (
    <CogStoreContext.Provider value={value}>
      {children}
    </CogStoreContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useCogStoreContext(): CogStore {
  const value = useContext(CogStoreContext)
  if (!value)
    throw new Error(
      'useCogStoreContext must be used inside <CogStoreProvider>',
    )
  return value
}
