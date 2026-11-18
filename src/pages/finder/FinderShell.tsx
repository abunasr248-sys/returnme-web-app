import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '../../components/ui'

export default function FinderShell({ children }: { children: ReactNode }) {
  return (
    <div className="grain relative min-h-dvh bg-paper">
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between">
          <Link to="/" aria-label="ReturnMe home"><Logo /></Link>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
            <ShieldCheck size={14} aria-hidden /> No account needed
          </span>
        </header>
        <main className="mt-6 flex flex-1 flex-col">{children}</main>
        <footer className="mt-10 text-center text-xs text-muted">
          ReturnMe never shows the owner’s email or phone number.
          <br />Your details are shared only if you choose to add them.
        </footer>
      </div>
    </div>
  )
}
