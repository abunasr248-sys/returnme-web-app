import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, LogOut, MessageCircle, Smartphone, Users } from 'lucide-react'
import * as api from '../../lib/api'
import { Button, ComingSoon, ErrorNote, Field, inputCls, toast } from '../../components/ui'
import { errorMessage } from '../../lib/format'
import { useSession } from '../../lib/session'

export default function Settings() {
  const { user, refreshUser } = useSession()
  const nav = useNavigate()
  const [name, setName] = useState(user?.display_name ?? '')
  const [notify, setNotify] = useState(user?.notify_email ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (user) { setName(user.display_name); setNotify(user.notify_email) } }, [user])

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.updateProfile({ display_name: name })
      await refreshUser()
      toast('Settings saved')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function toggleNotify() {
    const next = !notify
    setNotify(next)
    try {
      await api.updateProfile({ notify_email: next })
      await refreshUser()
      toast(next ? 'We’ll email you when an item is scanned' : 'Email alerts off')
    } catch (err) {
      setNotify(!next)
      setError(errorMessage(err))
    }
  }

  const first = name.trim().split(/\s+/)[0] || '…'

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold text-pine">Settings</h1>
      <p className="mt-1 text-sm text-muted">{user?.email}</p>

      <form onSubmit={save} className="mt-6 space-y-4 rounded-[1.75rem] border border-line bg-card p-5">
        <Field label="Display name" hint={`Finders see only your first name: “This belongs to ${first}”.`}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputCls} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" loading={saving} disabled={name.trim() === user?.display_name}>Save name</Button>
      </form>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-[1.75rem] border border-line bg-card p-5">
        <div>
          <p className="font-semibold">Email me when an item is scanned</p>
          <p className="text-sm text-muted">Alerts always show in the app too.</p>
        </div>
        <button
          role="switch"
          aria-checked={notify}
          onClick={toggleNotify}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${notify ? 'bg-pine' : 'bg-line'}`}
          aria-label="Email me when an item is scanned"
        >
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${notify ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <h2 className="mt-8 font-display text-xl font-bold text-pine">On the way</h2>
      <div className="mt-3 space-y-2.5">
        <ComingSoon icon={Smartphone} title="Push notifications" text="Get a buzz on your phone the moment someone scans your tag." />
        <ComingSoon icon={MessageCircle} title="Anonymous chat with finders" text="Talk to the finder without sharing numbers on either side." />
        <ComingSoon icon={Users} title="Shared items" text="One tag for a hostel room’s keys, alerts for everyone in the room." />
        <ComingSoon icon={Building2} title="Lost-and-found desk mode" text="For campus security to log and return handed-in items." />
      </div>

      <Button
        variant="secondary"
        className="mt-8 w-full !text-alarm"
        onClick={async () => { await api.logOut(); nav('/', { replace: true }); refreshUser() }}
      >
        <LogOut size={18} aria-hidden /> Log out
      </Button>
    </div>
  )
}
