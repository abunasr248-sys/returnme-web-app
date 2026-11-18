import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, Hash, HandHeart, LoaderCircle, MapPin, Navigation, Send, Siren, X } from 'lucide-react'
import * as api from '../../lib/api'
import type { PublicItem } from '../../lib/types'
import { Button, CategoryIcon, ErrorNote, Field, inputCls, Skeleton } from '../../components/ui'
import { errorMessage } from '../../lib/format'
import FinderShell from './FinderShell'

const SHORT_CODE = /^[A-HJ-NP-Za-hj-np-z2-9]{6}$/

type Loc = { lat: number; lng: number; accuracy: number }
type LocState = { kind: 'idle' } | { kind: 'locating' } | { kind: 'shared'; loc: Loc } | { kind: 'error'; msg: string }

export default function FinderPage() {
  const { token = '' } = useParams()
  const [item, setItem] = useState<PublicItem | null>(null)
  const [state, setState] = useState<'loading' | 'invalid' | 'view' | 'form' | 'done'>('loading')

  const nav = useNavigate()

  useEffect(() => {
    setState('loading')
    // /f/XU79LN: a 6-character backup code resolves to the item's token, then we continue on the token URL.
    if (SHORT_CODE.test(token)) {
      api.lookupCode(token).then(
        (t) => nav(`/f/${encodeURIComponent(t)}`, { replace: true }),
        () => setState('invalid'),
      )
      return
    }
    api.getFound(token).then(
      (i) => { setItem(i); setState('view') },
      () => setState('invalid'),
    )
  }, [token])

  if (state === 'loading') return <FinderShell><LoadingCard /></FinderShell>
  if (state === 'invalid' || !item) return <FinderShell><Inactive /></FinderShell>
  if (state === 'done') return <FinderShell><ThankYou item={item} /></FinderShell>

  return (
    <FinderShell>
      {item.status === 'lost' && (
        <div className="rise mb-4 flex items-center gap-3 rounded-2xl bg-alarm px-4 py-3.5 text-white shadow-[0_6px_20px_-8px_rgba(200,65,46,.7)]">
          <Siren size={24} aria-hidden className="shrink-0" />
          <p className="text-[17px] font-bold leading-snug">The owner is looking for this item.</p>
        </div>
      )}

      <article className="rise relative overflow-hidden rounded-[2rem] border border-line bg-card p-6 shadow-[0_10px_30px_-18px_rgba(20,61,58,.45)]">
        <span className="absolute right-6 top-6 h-4 w-4 rounded-full border-2 border-line bg-paper" aria-hidden />
        <CategoryIcon category={item.category} size="lg" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-muted">You found</p>
        <h1 className="font-display text-[2.4rem] font-extrabold leading-[1.05] text-pine">{item.name}</h1>
        <p className="mt-2 text-xl text-ink">This belongs to <strong>{item.owner_first_name}</strong>.</p>

        {(item.finder_note || item.dropoff_instructions) && <div className="tag-dash my-5" />}
        {item.finder_note && (
          <blockquote className="text-[17px] leading-relaxed text-ink">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-muted">A note from {item.owner_first_name}</span>
            “{item.finder_note}”
          </blockquote>
        )}
        {item.dropoff_instructions && <DropOff text={item.dropoff_instructions} className="mt-4" />}
      </article>

      {state === 'view' && (
        <div className="rise mt-6" style={{ animationDelay: '.08s' }}>
          <Button size="lg" variant="accent" className="w-full !h-[4.5rem] !text-xl" onClick={() => setState('form')}>
            <HandHeart size={26} aria-hidden /> Notify the owner
          </Button>
          <p className="mt-3 text-center text-sm text-muted">
            Takes 10 seconds. {item.owner_first_name} gets an alert right away.
          </p>
        </div>
      )}
      {state === 'form' && <NotifyForm token={token} firstName={item.owner_first_name} onCancel={() => setState('view')} onDone={() => setState('done')} />}
    </FinderShell>
  )
}

function DropOff({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`flex gap-3 rounded-2xl bg-marigold-soft p-4 ${className}`}>
      <MapPin size={22} className="mt-0.5 shrink-0 text-[#a66d0c]" aria-hidden />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a5a08]">Where to leave it</p>
        <p className="mt-0.5 text-[17px] font-medium leading-snug text-ink">{text}</p>
      </div>
    </div>
  )
}

function NotifyForm({ token, firstName, onCancel, onDone }: { token: string; firstName: string; onCancel: () => void; onDone: () => void }) {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [loc, setLoc] = useState<LocState>({ kind: 'idle' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function shareLocation() {
    if (!('geolocation' in navigator)) return setLoc({ kind: 'error', msg: 'Your browser can’t share location. You can describe the place in the message instead.' })
    setLoc({ kind: 'locating' })
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ kind: 'shared', loc: { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) } }),
      (err) =>
        setLoc({
          kind: 'error',
          msg: err.code === err.PERMISSION_DENIED
            ? 'Location permission was declined. That’s fine, you can describe the place in the message.'
            : 'We couldn’t get your location. Try again, or describe the place in the message.',
        }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await api.submitScan(token, {
        finder_message: message,
        finder_name: name,
        finder_contact: contact,
        website,
        ...(loc.kind === 'shared' ? loc.loc : {}),
      })
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="rise relative mt-6 space-y-5 rounded-[2rem] border border-line bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Message {firstName}</h2>
        <button type="button" onClick={onCancel} className="rounded-full p-2 text-muted hover:bg-paper" aria-label="Close form"><X size={20} /></button>
      </div>
      <p className="-mt-3 text-sm text-muted">Everything here is optional. You can just tap send.</p>

      <Field label="Where did you find it?">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} className={inputCls} placeholder="Found it near Block B canteen" />
      </Field>

      <div className="grid gap-4">
        <Field label="Your name">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputCls} placeholder="So they can thank you" autoComplete="given-name" />
        </Field>
        <Field label="How can they reach you?" hint="Phone, email or Instagram. Only the owner sees this.">
          <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} className={inputCls} placeholder="Optional" />
        </Field>
      </div>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" /></label>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-4">
        {loc.kind === 'shared' ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-soft text-leaf"><Navigation size={20} aria-hidden /></span>
            <div className="flex-1">
              <p className="font-semibold">Location added</p>
              <p className="text-xs text-muted">Accurate to about {loc.loc.accuracy} m</p>
            </div>
            <button type="button" onClick={() => setLoc({ kind: 'idle' })} className="text-sm font-semibold text-alarm">Remove</button>
          </div>
        ) : (
          <>
            <Button type="button" variant="secondary" className="w-full" onClick={shareLocation} loading={loc.kind === 'locating'}>
              {loc.kind !== 'locating' && <Navigation size={18} aria-hidden />}
              {loc.kind === 'locating' ? 'Finding your location…' : 'Share my location'}
            </Button>
            <p className="mt-2.5 text-xs leading-relaxed text-muted">
              Only if you tap this: we ask your browser for your location once and show {firstName} a pin on a map. We never track you.
            </p>
            {loc.kind === 'error' && <p className="mt-2 flex gap-1.5 text-xs font-medium text-alarm"><CircleAlert size={14} className="mt-px shrink-0" />{loc.msg}</p>}
          </>
        )}
      </div>

      <ErrorNote>{error}</ErrorNote>
      <Button type="submit" size="lg" className="w-full" loading={sending}>
        {!sending && <Send size={20} aria-hidden />} {sending ? 'Sending…' : `Send to ${firstName}`}
      </Button>
    </form>
  )
}

function ThankYou({ item }: { item: PublicItem }) {
  return (
    <div className="rise flex flex-1 flex-col">
      <div className="rounded-[2rem] bg-pine p-7 text-paper">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-marigold text-ink"><HandHeart size={30} aria-hidden /></span>
        <h1 className="mt-5 font-display text-[2.2rem] font-extrabold leading-tight">Thank you!</h1>
        <p className="mt-2 text-lg leading-relaxed text-paper/85">
          {item.owner_first_name} has been notified that you found their <strong className="text-paper">{item.name.toLowerCase()}</strong>. People like you make campus better.
        </p>
      </div>
      {item.dropoff_instructions && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-muted">One last thing:</p>
          <DropOff text={item.dropoff_instructions} />
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted">You can close this page now.</p>
    </div>
  )
}

function Inactive() {
  return (
    <div className="rise rounded-[2rem] border border-line bg-card p-7 text-center">
      <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-paper text-muted"><CircleAlert size={32} aria-hidden /></span>
      <h1 className="mt-5 font-display text-3xl font-bold">This QR code is not active.</h1>
      <p className="mt-2 text-muted">The owner may have replaced this sticker. If you have the item, please hand it to the campus security desk.</p>
      <Link to="/f" className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl border border-line px-5 font-semibold text-pine hover:border-pine/40">
        <Hash size={18} aria-hidden /> Enter a backup code instead
      </Link>
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="rounded-[2rem] border border-line bg-card p-6" aria-label="Loading">
      <Skeleton className="h-16 w-16" />
      <Skeleton className="mt-5 h-4 w-24" />
      <Skeleton className="mt-3 h-10 w-3/4" />
      <Skeleton className="mt-3 h-6 w-1/2" />
      <Skeleton className="mt-6 h-20 w-full" />
      <div className="mt-6 flex justify-center text-muted"><LoaderCircle className="animate-spin" size={20} /></div>
    </div>
  )
}
