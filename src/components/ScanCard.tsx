import { lazy, Suspense, type ReactNode } from 'react'
import { MapPin, MessageCircle, Trash2, User } from 'lucide-react'
import type { Scan } from '../lib/types'
import { fullTime, timeAgo } from '../lib/format'
import { Skeleton } from './ui'

const LazyMap = lazy(() => import('./MapPin'))

export default function ScanCard({
  scan,
  title,
  onClick,
  onDelete,
}: {
  scan: Scan
  title?: ReactNode
  onClick?: () => void
  onDelete?: () => void
}) {
  const unread = !scan.read
  return (
    <article
      onClick={onClick}
      className={`rise relative rounded-[1.5rem] border p-4 transition ${onClick ? 'cursor-pointer' : ''} ${unread ? 'border-marigold bg-marigold-soft/60 shadow-[0_8px_20px_-14px_rgba(240,169,43,.9)]' : 'border-line bg-card'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title}
          <p className="text-sm text-muted" title={fullTime(scan.scanned_at)}>
            {timeAgo(scan.scanned_at)} · {fullTime(scan.scanned_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {unread && <span className="rounded-full bg-alarm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">New</span>}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="rounded-xl p-2 text-muted hover:bg-alarm-soft hover:text-alarm"
              aria-label="Delete scan"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 flex gap-2 text-[16px] leading-relaxed">
        <MessageCircle size={18} className="mt-1 shrink-0 text-pine" aria-hidden />
        {scan.finder_message ? <span>“{scan.finder_message}”</span> : <span className="italic text-muted">No message, just a scan.</span>}
      </p>

      {(scan.finder_name || scan.finder_contact) && (
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
          <User size={16} className="shrink-0 text-pine" aria-hidden />
          {[scan.finder_name, scan.finder_contact].filter(Boolean).join(' · ')}
        </p>
      )}

      {scan.lat != null && scan.lng != null && (
        <div className="mt-3">
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <LazyMap lat={scan.lat} lng={scan.lng} accuracy={scan.accuracy} />
          </Suspense>
          <a
            href={`https://www.openstreetmap.org/?mlat=${scan.lat}&mlon=${scan.lng}#map=18/${scan.lat}/${scan.lng}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-pine hover:underline"
          >
            <MapPin size={13} aria-hidden /> Open in maps{scan.accuracy ? ` · about ${scan.accuracy} m accuracy` : ''}
          </a>
        </div>
      )}
    </article>
  )
}
