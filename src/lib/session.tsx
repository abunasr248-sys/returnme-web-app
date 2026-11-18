import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import * as api from './api'
import type { Profile } from './types'

interface SessionCtx {
  user: Profile | null
  ready: boolean
  refreshUser: () => Promise<void>
}
const Ctx = createContext<SessionCtx>({ user: null, ready: false, refreshUser: async () => {} })

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [ready, setReady] = useState(false)
  const refreshUser = useCallback(async () => {
    setUser(await api.currentUser())
    setReady(true)
  }, [])
  useEffect(() => { refreshUser() }, [refreshUser])
  return <Ctx.Provider value={{ user, ready, refreshUser }}>{children}</Ctx.Provider>
}
export const useSession = () => useContext(Ctx)

// ---------- alerts, polled every 15 s while the owner app is open ----------
interface AlertsCtx {
  alerts: api.Alert[] | null
  unread: number
  error: string | null
  refresh: () => Promise<void>
}
const ACtx = createContext<AlertsCtx>({ alerts: null, unread: 0, error: null, refresh: async () => {} })
export const POLL_MS = 15_000

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<api.Alert[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)
  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      setAlerts(await api.listAlerts())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t load alerts.')
    } finally {
      busy.current = false
    }
  }, [])
  useEffect(() => {
    refresh()
    const t = setInterval(() => { if (document.visibilityState === 'visible') refresh() }, POLL_MS)
    const onVis = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [refresh])
  const unread = alerts?.filter((a) => !a.read).length ?? 0
  return <ACtx.Provider value={{ alerts, unread, error, refresh }}>{children}</ACtx.Provider>
}
export const useAlerts = () => useContext(ACtx)
