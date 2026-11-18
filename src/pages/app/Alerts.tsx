import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, CheckCheck, RefreshCw } from 'lucide-react'
import * as api from '../../lib/api'
import { Button, CategoryIcon, ErrorNote, Skeleton } from '../../components/ui'
import ScanCard from '../../components/ScanCard'
import { useAlerts } from '../../lib/session'

export default function Alerts() {
  const { alerts, unread, error, refresh } = useAlerts()
  const [marking, setMarking] = useState(false)

  async function open(a: api.Alert) {
    if (a.read) return
    await api.markRead(a.id)
    refresh()
  }

  return (
    <div>
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-pine">Alerts</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" /></span>
            Checking for new scans every 15 seconds
          </p>
        </div>
        {unread > 0 ? (
          <Button size="sm" variant="secondary" loading={marking} onClick={async () => { setMarking(true); await api.markAllRead(); await refresh(); setMarking(false) }}>
            {!marking && <CheckCheck size={16} aria-hidden />} Mark all read
          </Button>
        ) : (
          <button onClick={refresh} className="rounded-xl p-2.5 text-muted hover:bg-pine-soft hover:text-pine" aria-label="Refresh alerts"><RefreshCw size={18} /></button>
        )}
      </header>

      {unread > 0 && <p className="mt-4 text-sm font-semibold text-[#8a5a08]">{unread} new · tap an alert to mark it read</p>}

      <div className="mt-4 space-y-3">
        <ErrorNote>{error}</ErrorNote>
        {!alerts && !error && [0, 1].map((i) => <Skeleton key={i} className="h-36 w-full !rounded-[1.5rem]" />)}
        {alerts?.length === 0 && (
          <div className="rise rounded-[2rem] border-2 border-dashed border-line bg-card px-6 py-10 text-center">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-pine-soft text-pine"><BellRing size={30} aria-hidden /></span>
            <h2 className="mt-5 font-display text-2xl font-bold text-pine">No alerts yet</h2>
            <p className="mx-auto mt-2 max-w-xs text-muted">When someone scans one of your stickers, their message lands here. Try “Simulate a scan” on any item.</p>
            <Link to="/app/items" className="mt-6 inline-flex h-12 items-center rounded-2xl bg-pine px-5 font-semibold text-paper">Go to my items</Link>
          </div>
        )}
        {alerts?.map((a) => (
          <ScanCard
            key={a.id}
            scan={a}
            onClick={() => open(a)}
            title={
              <Link to={`/app/items/${a.item_id}`} onClick={(e) => e.stopPropagation()} className="mb-1 flex items-center gap-2.5 hover:underline">
                <CategoryIcon category={a.item_category} size="sm" />
                <span className="truncate text-lg font-bold">{a.item_name}</span>
              </Link>
            }
          />
        ))}
      </div>
    </div>
  )
}
