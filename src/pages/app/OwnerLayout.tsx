import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, Package, Settings } from 'lucide-react'
import { AlertsProvider, useAlerts, useSession } from '../../lib/session'

export default function OwnerLayout() {
  const { user, ready } = useSession()
  const loc = useLocation()
  if (!ready) return <div className="min-h-dvh bg-paper" />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return (
    <AlertsProvider>
      <div className="min-h-dvh bg-paper">
        <div className="mx-auto max-w-xl px-5 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <Outlet />
        </div>
        <Tabs />
      </div>
    </AlertsProvider>
  )
}

function Tabs() {
  const { unread } = useAlerts()
  const tabs = [
    { to: '/app/items', label: 'Items', icon: Package },
    { to: '/app/alerts', label: 'Alerts', icon: Bell, badge: unread },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Main">
      <div className="mx-auto grid max-w-xl grid-cols-3">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `relative flex h-[4.25rem] flex-col items-center justify-center gap-1 text-xs font-semibold transition ${isActive ? 'text-pine' : 'text-muted hover:text-ink'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-1 w-10 rounded-b-full bg-marigold" />}
                <span className="relative">
                  <t.icon size={24} strokeWidth={isActive ? 2.3 : 1.8} aria-hidden />
                  {!!t.badge && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-5 rounded-full bg-alarm px-1.5 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-card">
                      {t.badge > 9 ? '9+' : t.badge}
                    </span>
                  )}
                </span>
                {t.label}
                {!!t.badge && <span className="sr-only">, {t.badge} unread</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
