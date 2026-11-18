import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BellOff, Download, ExternalLink, FlaskConical, Pencil, Printer, RefreshCw, TriangleAlert } from 'lucide-react'
import * as api from '../../lib/api'
import type { ItemWithMeta, Scan } from '../../lib/types'
import { Button, CategoryIcon, ErrorNote, Sheet, Skeleton, StatusBadge, toast } from '../../components/ui'
import ScanCard from '../../components/ScanCard'
import { errorMessage, timeAgo } from '../../lib/format'
import { downloadPng, downloadStickerPdf, downloadStickerSheet, qrDataUrl } from '../../lib/qr'
import { useAlerts } from '../../lib/session'
import BackLink from './BackLink'

export default function ItemDetail() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const justCreated = params.get('new') === '1'
  const { alerts, refresh: refreshAlerts } = useAlerts()
  const [item, setItem] = useState<ItemWithMeta | null>(null)
  const [scans, setScans] = useState<Scan[] | null>(null)
  const [qr, setQr] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const load = useCallback(async () => {
    try {
      const [it, sc] = await Promise.all([api.getItem(id), api.listItemScans(id)])
      setItem(it)
      setScans(sc)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [id])
  useEffect(() => { load() }, [load, alerts])
  useEffect(() => { if (item) qrDataUrl(item.token, 480).then(setQr) }, [item?.token])

  async function run(key: string, fn: () => Promise<unknown>, msg?: string) {
    setBusy(key)
    try {
      await fn()
      await Promise.all([load(), refreshAlerts()])
      if (msg) toast(msg)
    } catch (e) {
      toast(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  if (error) return <div><BackLink to="/app/items" label="My items" /><div className="mt-4"><ErrorNote>{error}</ErrorNote></div></div>
  if (!item) return <DetailSkeleton />

  const muted = !!item.muted_until && new Date(item.muted_until) > new Date()
  const lost = item.status === 'lost'

  return (
    <div>
      <div className="flex items-center justify-between">
        <BackLink to="/app/items" label="My items" />
        <Link to={`/app/items/${id}/edit`} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-pine hover:bg-pine-soft">
          <Pencil size={16} aria-hidden /> Edit
        </Link>
      </div>

      <header className="rise mt-3 flex items-center gap-4">
        <CategoryIcon category={item.category} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-extrabold text-pine">{item.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted"><StatusBadge status={item.status} /> {timeAgo(item.last_scanned_at)}</div>
        </div>
      </header>

      {/* Safe / Lost toggle */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-card p-1" role="radiogroup" aria-label="Item status">
        {(['safe', 'lost'] as const).map((s) => {
          const on = item.status === s
          return (
            <button
              key={s}
              role="radio"
              aria-checked={on}
              disabled={busy === 'status'}
              onClick={() => !on && run('status', () => api.setStatus(id, s), s === 'lost' ? 'Marked as lost. Finders will see a stronger message.' : 'Marked as safe')}
              className={`h-12 rounded-xl text-[15px] font-bold transition ${on ? (s === 'lost' ? 'bg-alarm text-white' : 'bg-leaf text-white') : 'text-muted hover:bg-paper'}`}
            >
              {s === 'lost' ? 'Mark as Lost' : 'Mark as Safe'}
            </button>
          )
        })}
      </div>
      {lost && <p className="mt-2 text-sm text-alarm">Finders now see: “The owner is looking for this item.”</p>}

      {/* QR card */}
      <section className={`rise mt-6 rounded-[2rem] border bg-card p-5 ${justCreated ? 'border-marigold ring-4 ring-marigold/25' : 'border-line'}`}>
        {justCreated && <p className="mb-3 text-center text-sm font-bold text-[#8a5a08]">Saved! Print this and stick it on your {item.name.toLowerCase()}.</p>}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="w-48 shrink-0 rounded-2xl border border-line bg-white p-2">
            {qr ? <img src={qr} alt={`QR code for ${item.name}`} className="aspect-square w-full" /> : <div className="skeleton aspect-square w-full" />}
            <p className="mt-1 text-center font-mono text-base font-bold tracking-[0.3em] text-pine">{item.short_code}</p>
          </div>
          <div className="w-full space-y-2.5">
            <Button variant="primary" className="w-full" loading={busy === 'png'} onClick={() => run('png', () => downloadPng(item))}>
              {busy !== 'png' && <Download size={18} aria-hidden />} Download sticker (PNG)
            </Button>
            <Button variant="secondary" className="w-full" loading={busy === 'pdf1'} onClick={() => run('pdf1', () => downloadStickerPdf(item))}>
              {busy !== 'pdf1' && <Download size={18} aria-hidden />} Download sticker (PDF)
            </Button>
            <Button variant="secondary" className="w-full" loading={busy === 'sheet'} onClick={() => run('sheet', () => downloadStickerSheet(item))}>
              {busy !== 'sheet' && <Printer size={18} aria-hidden />} Download print sheet (12 stickers)
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setConfirmRegen(true)}>
              <RefreshCw size={18} aria-hidden /> Regenerate QR code
            </Button>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mt-4 grid grid-cols-2 gap-2.5">
        <a
          href={`/f/${item.token}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-card text-[15px] font-semibold hover:border-pine/40"
        >
          <ExternalLink size={18} aria-hidden /> Test it
        </a>
        <Button variant="secondary" loading={busy === 'sim'} onClick={() => run('sim', () => api.simulateScan(id), 'Test scan created. Check your alerts.')}>
          {busy !== 'sim' && <FlaskConical size={18} aria-hidden />} Simulate a scan
        </Button>
      </section>

      {/* Scan history */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-pine">Scan history</h2>
          <Button
            size="sm"
            variant={muted ? 'accent' : 'secondary'}
            loading={busy === 'mute'}
            onClick={() => run('mute', () => api.muteItem(id, muted ? null : 1), muted ? 'Alerts back on' : 'Muted for 1 hour')}
          >
            {busy !== 'mute' && <BellOff size={16} aria-hidden />} {muted ? 'Unmute' : 'Mute this item for 1 hour'}
          </Button>
        </div>
        {muted && (
          <p className="mt-2 text-sm text-muted">
            Muted until {new Date(item.muted_until!).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}. New scans are saved quietly without an alert.
          </p>
        )}
        <div className="mt-4 space-y-3">
          {!scans && <Skeleton className="h-28 w-full" />}
          {scans?.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-line p-6 text-center text-muted">
              No scans yet. When someone finds your {item.name.toLowerCase()}, their message shows up here.
            </div>
          )}
          {scans?.map((s) => (
            <ScanCard
              key={s.id}
              scan={s}
              onClick={s.read ? undefined : () => run('read', () => api.markRead(s.id))}
              onDelete={() => run('del', () => api.deleteScan(s.id), 'Scan deleted')}
            />
          ))}
        </div>
      </section>

      <Sheet open={confirmRegen} onClose={() => setConfirmRegen(false)} title="Regenerate QR code?">
        <div className="flex gap-3 rounded-2xl bg-alarm-soft p-4 text-sm text-alarm">
          <TriangleAlert size={20} aria-hidden />
          <p>Stickers you’ve already printed will stop working right away and show “This QR code is not active.” You’ll need to print and stick new ones.</p>
        </div>
        <div className="mt-5 grid gap-2.5">
          <Button
            variant="danger"
            loading={busy === 'regen'}
            onClick={() => run('regen', () => api.regenerateToken(id), 'New QR code ready. The old one no longer works.').then(() => setConfirmRegen(false))}
          >
            Yes, make a new QR code
          </Button>
          <Button variant="secondary" onClick={() => setConfirmRegen(false)}>Cancel</Button>
        </div>
      </Sheet>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-28" />
      <div className="flex items-center gap-4"><Skeleton className="h-16 w-16" /><div className="flex-1 space-y-2"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-5 w-1/3" /></div></div>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-64 w-full !rounded-[2rem]" />
    </div>
  )
}
