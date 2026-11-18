import { Backpack, IdCard, KeyRound, Laptop, LoaderCircle, Milk, Package, Smartphone, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Category, ItemStatus } from '../lib/types'

export const CATEGORIES: { value: Category; label: string; icon: LucideIcon }[] = [
  { value: 'bag', label: 'Bag', icon: Backpack },
  { value: 'laptop', label: 'Laptop', icon: Laptop },
  { value: 'keys', label: 'Keys', icon: KeyRound },
  { value: 'bottle', label: 'Bottle', icon: Milk },
  { value: 'idcard', label: 'ID card', icon: IdCard },
  { value: 'phone', label: 'Phone', icon: Smartphone },
  { value: 'other', label: 'Other', icon: Package },
]

export function CategoryIcon({ category, size = 'md' }: { category: Category; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const Icon = CATEGORIES.find((c) => c.value === category)?.icon ?? Package
  const box = { sm: 'h-9 w-9 rounded-xl', md: 'h-12 w-12 rounded-2xl', lg: 'h-16 w-16 rounded-2xl', xl: 'h-24 w-24 rounded-[1.75rem]' }[size]
  const ic = { sm: 18, md: 22, lg: 30, xl: 46 }[size]
  return (
    <span className={`${box} inline-flex shrink-0 items-center justify-center bg-pine-soft text-pine`}>
      <Icon size={ic} strokeWidth={1.9} aria-hidden />
    </span>
  )
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  return status === 'lost' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-alarm-soft px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-alarm">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-alarm" /> Lost
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-leaf">
      <span className="h-1.5 w-1.5 rounded-full bg-leaf" /> Safe
    </span>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
const variants: Record<Variant, string> = {
  primary: 'bg-pine text-paper shadow-[0_2px_0_#0a2321] hover:bg-[#1a4b47] active:translate-y-px active:shadow-none',
  accent: 'bg-marigold text-ink shadow-[0_2px_0_#b97d14] hover:bg-[#f5b544] active:translate-y-px active:shadow-none',
  secondary: 'bg-card text-ink border border-line hover:border-pine/40 active:bg-paper',
  ghost: 'text-pine hover:bg-pine-soft',
  danger: 'bg-alarm text-white shadow-[0_2px_0_#8f2a1c] hover:bg-[#b53a28] active:translate-y-px active:shadow-none',
}

export function Button({
  variant = 'primary',
  loading,
  className = '',
  children,
  size = 'md',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; size?: 'md' | 'lg' | 'sm' }) {
  const sz = { sm: 'h-10 px-3.5 text-sm rounded-xl', md: 'h-12 px-5 text-[15px] rounded-2xl', lg: 'h-16 px-6 text-lg rounded-2xl' }[size]
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex select-none items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marigold/50 ${sz} ${variants[variant]} ${className}`}
    >
      {loading && <LoaderCircle size={18} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-base text-ink placeholder:text-muted/70 outline-none transition focus:border-pine focus:ring-4 focus:ring-pine/10'

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-2xl border border-alarm/25 bg-alarm-soft px-4 py-3 text-sm font-medium text-alarm">
      {children}
    </p>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

export function ComingSoon({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-line bg-card/60 p-4 opacity-80">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper text-muted">
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
          {title}
          <span className="rounded-full bg-marigold-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8a5a08]">Coming soon</span>
        </p>
        <p className="mt-0.5 text-sm text-muted">{text}</p>
      </div>
    </div>
  )
}

/** Bottom sheet used for confirmations and small forms. */
export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="sheet-in relative w-full max-w-md rounded-t-[2rem] bg-paper p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}

let pushToast: ((msg: string) => void) | null = null
export const toast = (msg: string) => pushToast?.(msg)

export function Toaster() {
  const [msgs, setMsgs] = useState<{ id: number; msg: string }[]>([])
  useEffect(() => {
    pushToast = (msg) => {
      const id = Date.now() + Math.random()
      setMsgs((m) => [...m, { id, msg }])
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 2800)
    }
    return () => { pushToast = null }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      {msgs.map((m) => (
        <div key={m.id} className="rise rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-paper shadow-lg">{m.msg}</div>
      ))}
    </div>
  )
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${light ? 'text-paper' : 'text-pine'}`}>
      <svg viewBox="0 0 512 512" className="h-8 w-8" aria-hidden>
        <rect width="512" height="512" rx="112" fill={light ? '#fbf7ef' : '#143d3a'} />
        <path d="M150 140h150l70 70v162a24 24 0 0 1-24 24H150a24 24 0 0 1-24-24V164a24 24 0 0 1 24-24z" fill={light ? '#143d3a' : '#fbf7ef'} />
        <circle cx="196" cy="196" r="22" fill={light ? '#fbf7ef' : '#143d3a'} />
        <path d="M196 300l44 44 92-100" stroke="#f0a92b" strokeWidth="34" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      ReturnMe
    </span>
  )
}
