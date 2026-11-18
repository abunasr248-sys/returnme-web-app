import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api'
import type { Category } from '../../lib/types'
import { Button, CATEGORIES, ErrorNote, Field, inputCls, Skeleton, toast } from '../../components/ui'
import { errorMessage } from '../../lib/format'
import BackLink from './BackLink'

export default function ItemForm() {
  const { id } = useParams()
  const editing = !!id
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('bag')
  const [note, setNote] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.getItem(id).then(
      (it) => { setName(it.name); setCategory(it.category); setNote(it.finder_note); setDropoff(it.dropoff_instructions); setLoading(false) },
      (e) => { setError(errorMessage(e)); setLoading(false) },
    )
  }, [id])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const input = { name, category, finder_note: note, dropoff_instructions: dropoff }
    try {
      if (id) {
        await api.updateItem(id, input)
        toast('Changes saved')
        nav(`/app/items/${id}`, { replace: true })
      } else {
        const item = await api.createItem(input)
        toast('Item saved. Here’s your QR code!')
        nav(`/app/items/${item.id}?new=1`, { replace: true })
      }
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div>
      <BackLink to={id ? `/app/items/${id}` : '/app/items'} label={id ? 'Item' : 'My items'} />
      <h1 className="mt-2 font-display text-4xl font-extrabold text-pine">{editing ? 'Edit item' : 'Add an item'}</h1>

      {loading ? (
        <div className="mt-6 space-y-4"><Skeleton className="h-14" /><Skeleton className="h-28" /><Skeleton className="h-24" /></div>
      ) : (
        <form onSubmit={submit} className="rise mt-6 space-y-6">
          <Field label="Item name">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputCls} placeholder="Blue Backpack" autoFocus={!editing} required />
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Category</legend>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => {
                const on = c.value === category
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    aria-pressed={on}
                    className={`flex h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition ${on ? 'border-pine bg-pine text-paper' : 'border-line bg-card text-ink hover:border-pine/40'}`}
                  >
                    <c.icon size={22} aria-hidden /> {c.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Field label="Note for the finder" hint="Shown on the finder page. Don’t include your phone number.">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={280} className={inputCls} placeholder="Please hand it to the security desk" />
          </Field>

          <Field label="Drop-off instruction (optional)" hint="Where should they leave it?">
            <input value={dropoff} onChange={(e) => setDropoff(e.target.value)} maxLength={160} className={inputCls} placeholder="Library front desk, Block C" />
          </Field>

          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" size="lg" className="w-full" loading={saving}>{editing ? 'Save changes' : 'Save and get QR code'}</Button>
        </form>
      )}
    </div>
  )
}
