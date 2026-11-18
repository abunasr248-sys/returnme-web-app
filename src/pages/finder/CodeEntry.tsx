import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import * as api from '../../lib/api'
import { Button, ErrorNote } from '../../components/ui'
import { errorMessage } from '../../lib/format'
import FinderShell from './FinderShell'

export default function CodeEntry() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  async function go(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return setError('The backup code has 6 letters and numbers, printed under the QR.')
    setBusy(true)
    setError(null)
    try {
      nav(`/f/${await api.lookupCode(code)}`)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <FinderShell>
      <div className="rise">
        <h1 className="font-display text-[2.4rem] font-extrabold leading-[1.05] text-pine">QR won’t scan?</h1>
        <p className="mt-3 text-lg text-ink">Type the 6-character code printed under the QR sticker.</p>
        <form onSubmit={go} className="mt-8 space-y-4">
          <label className="sr-only" htmlFor="code">Backup code</label>
          <input
            id="code"
            autoFocus
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="K7MPQ4"
            className="w-full rounded-[1.5rem] border-2 border-line bg-card px-4 py-5 text-center font-mono text-4xl font-bold tracking-[0.35em] text-pine outline-none placeholder:text-line focus:border-pine"
          />
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Find the owner {!busy && <ArrowRight size={20} aria-hidden />}
          </Button>
        </form>
      </div>
    </FinderShell>
  )
}
