import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="-ml-2 inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-pine hover:bg-pine-soft">
      <ChevronLeft size={18} aria-hidden /> {label}
    </Link>
  )
}
