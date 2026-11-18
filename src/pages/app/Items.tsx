import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Plus, Sparkles, Tag } from 'lucide-react'
import * as api from '../../lib/api'
import type { ItemWithMeta } from '../../lib/types'
import { Button, CategoryIcon, ErrorNote, Skeleton, StatusBadge, toast } from '../../components/ui'
import { errorMessage, timeAgo } from '../../lib/format'
import { useAlerts, useSession } from '../../lib/session'

export default function Items() {
  const { user } = useSession()
  const { alerts, refresh: refreshAlerts } = useAlerts()
  const [items, setItems] = useState<ItemWithMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const load = useCallback(() => api.listItems().then(setItems, (e) => setError(errorMessage(e))), [])
  useEffect(() => { load() }, [load, alerts])

  async function seed() {
    setSeeding(true)
    try {
      await api.loadSampleItems()
      await Promise.all([load(), refreshAlerts()])
      toast('Added 3 sample items with scans')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSeeding(false)
    }
  }

  const first = user?.display_name.split(/\s+/)[0]

  return (
    <div>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">Hi {first}</p>
          <h1 className="font-display text-4xl font-extrabold text-pine">My items</h1>
        </div>
        {items && items.length > 0 && (
          <Link to="/app/items/new" className="inline-flex h-12 items-center gap-1.5 rounded-2xl bg-pine px-4 font-semibold text-paper shadow-[0_2px_0_#0a2321] hover:bg-[#1a4b47]">
            <Plus size={20} aria-hidden /> Add item
          </Link>
        )}
      </header>

      <div className="mt-6 space-y-3">
        <ErrorNote>{error}</ErrorNote>
        {!items && !error && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[5.5rem] w-full !rounded-[1.5rem]" />)}

        {items?.length === 0 && (
          <div className="rise rounded-[2rem] border-2 border-dashed border-line bg-card px-6 py-10 text-center">
            <span className="mx-auto inline-flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-marigold-soft text-[#a66d0c]"><Tag size={30} aria-hidden /></span>
            <h2 className="mt-5 font-display text-2xl font-bold text-pine">Add your first item and stick a QR on it</h2>
            <p className="mx-auto mt-2 max-w-xs text-muted">Bags, laptops, keys, bottles, ID cards. Anything you’d hate to lose.</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link to="/app/items/new" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-pine px-5 text-lg font-semibold text-paper shadow-[0_2px_0_#0a2321]">
                <Plus size={20} aria-hidden /> Add item
              </Link>
              <Button variant="ghost" onClick={seed} loading={seeding}>
                {!seeding && <Sparkles size={18} aria-hidden />} Load sample items
              </Button>
            </div>
          </div>
        )}

        {items?.map((it, i) => (
          <Link
            key={it.id}
            to={`/app/items/${it.id}`}
            style={{ animationDelay: `${i * 0.04}s` }}
            className={`rise flex items-center gap-4 rounded-[1.5rem] border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-16px_rgba(20,61,58,.5)] ${it.status === 'lost' ? 'border-alarm/40' : 'border-line'}`}
          >
            <CategoryIcon category={it.category} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-bold">{it.name}</p>
                {it.unread_count > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-alarm" aria-label={`${it.unread_count} unread`} />}
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted"><Clock size={13} aria-hidden /> {it.last_scanned_at ? `Scanned ${timeAgo(it.last_scanned_at)}` : 'Never scanned'}</p>
            </div>
            <StatusBadge status={it.status} />
          </Link>
        ))}

        {items && items.length > 0 && items.length < 3 && !items.some((i) => i.name === 'Blue Backpack') && (
          <button onClick={seed} disabled={seeding} className="w-full py-3 text-sm font-semibold text-pine hover:underline">
            {seeding ? 'Loading…' : 'Load sample items'}
          </button>
        )}
      </div>
    </div>
  )
}
