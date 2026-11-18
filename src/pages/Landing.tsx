import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BellRing, EyeOff, MapPin, Printer, ScanLine, ShieldCheck } from 'lucide-react'
import { Logo } from '../components/ui'
import { qrDataUrl } from '../lib/qr'
import { CAMPUS, SHOWCASE_CODE, SHOWCASE_TOKEN } from '../lib/fixtures'
import { useSession } from '../lib/session'

export default function Landing() {
  const { user } = useSession()
  const [qr, setQr] = useState<string>()
  useEffect(() => { qrDataUrl(SHOWCASE_TOKEN, 360).then(setQr) }, [])

  return (
    <div className="grain relative min-h-dvh overflow-hidden bg-paper">
      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between">
          <Logo />
          <Link to={user ? '/app/items' : '/login'} className="rounded-xl px-3 py-2 text-sm font-semibold text-pine hover:bg-pine-soft">
            {user ? 'Open app' : 'Log in'}
          </Link>
        </header>

        <section className="mt-10 grid items-center gap-10 md:mt-16 md:grid-cols-[1.15fr_1fr]">
          <div className="rise">
            <p className="inline-flex items-center gap-2 rounded-full bg-pine-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-pine">
              <MapPin size={13} aria-hidden /> Now on campus at {CAMPUS.name}
            </p>
            <h1 className="mt-5 font-display text-[2.9rem] font-extrabold leading-[0.98] tracking-tight text-pine sm:text-6xl">
              Lost it in the canteen?<br />
              <span className="relative inline-block">
                Get it back
                <svg viewBox="0 0 300 18" className="absolute -bottom-2 left-0 w-full" aria-hidden><path d="M3 13 C 80 3, 200 3, 297 11" stroke="#f0a92b" strokeWidth="6" fill="none" strokeLinecap="round" /></svg>
              </span>{' '}by lunch.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Stick a ReturnMe QR on your bag, laptop or keys. Whoever finds it scans and taps once. You get the alert, they never see your number.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={user ? '/app/items' : '/signup'} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-pine px-6 text-lg font-semibold text-paper shadow-[0_2px_0_#0a2321] hover:bg-[#1a4b47]">
                {user ? 'Go to my items' : 'Tag your first item'} <ArrowRight size={20} aria-hidden />
              </Link>
              <Link to={`/f/${SHOWCASE_TOKEN}`} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-card px-6 text-lg font-semibold text-ink hover:border-pine/40">
                <ScanLine size={20} aria-hidden /> See what a finder sees
              </Link>
            </div>
          </div>

          {/* Sticker mock */}
          <div className="rise relative mx-auto w-full max-w-[19rem]" style={{ animationDelay: '.1s' }}>
            <div className="absolute -right-4 top-8 h-full w-full rotate-6 rounded-[2rem] bg-marigold/80" aria-hidden />
            <div className="relative -rotate-2 rounded-[2rem] border border-line bg-card p-6 shadow-[0_24px_50px_-24px_rgba(20,61,58,.55)]">
              <div className="mx-auto -mt-1 mb-4 h-4 w-4 rounded-full border-2 border-line bg-paper" aria-hidden />
              <div className="aspect-square w-full rounded-2xl bg-white p-2">
                {qr ? <img src={qr} alt="Example ReturnMe QR code" className="h-full w-full" /> : <div className="skeleton h-full w-full" />}
              </div>
              <p className="mt-3 text-center font-mono text-sm font-bold tracking-[0.3em] text-pine">{SHOWCASE_CODE}</p>
              <div className="tag-dash my-3" />
              <p className="text-center font-display text-xl font-bold text-pine">Green Water Bottle</p>
              <p className="text-center text-sm text-muted">Found this? Scan to contact the owner</p>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-3xl font-bold text-pine">Three steps, one sticker.</h2>
          <ol className="mt-8 space-y-4">
            {[
              { icon: Printer, t: 'Add an item, print the sheet', d: 'Name it, leave a note for the finder, then download an A4 sheet of 12 stickers.' },
              { icon: ScanLine, t: 'Someone scans it', d: 'No app, no sign-up. They see your first name, your note and where to drop it off.' },
              { icon: BellRing, t: 'You get the alert', d: 'Their message, optional contact and an optional map pin land in your Alerts tab.' },
            ].map((s, i) => (
              <li key={s.t} className={`flex items-start gap-4 rounded-[1.75rem] border border-line bg-card p-5 md:w-[70%] ${i % 2 ? 'md:ml-auto' : ''}`}>
                <span className="font-display text-4xl font-extrabold leading-none text-marigold">{i + 1}</span>
                <div>
                  <p className="flex items-center gap-2 text-lg font-bold"><s.icon size={18} className="text-pine" aria-hidden />{s.t}</p>
                  <p className="mt-1 text-muted">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 rounded-[2rem] bg-pine p-7 text-paper md:p-10">
          <h2 className="font-display text-3xl font-bold">Private by default.</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            <li className="flex gap-3"><EyeOff className="mt-0.5 shrink-0 text-marigold" aria-hidden /><span>Finders see your first name only. Never your email, phone or full name.</span></li>
            <li className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-marigold" aria-hidden /><span>Location is shared only when the finder taps “Share my location”.</span></li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-marigold" aria-hidden /><span>Long random links, rate limits and spam traps keep pranks out.</span></li>
            <li className="flex gap-3"><Printer className="mt-0.5 shrink-0 text-marigold" aria-hidden /><span>Sticker got photographed? Regenerate the QR and the old one stops working.</span></li>
          </ul>
        </section>

        <footer className="mt-12 flex flex-col items-center justify-between gap-3 text-sm text-muted sm:flex-row">
          <Logo />
          <span>Made for students, starting at VNR VJIET. <Link to="/f" className="font-semibold text-pine underline-offset-4 hover:underline">Have a backup code?</Link></span>
        </footer>
      </div>
    </div>
  )
}
