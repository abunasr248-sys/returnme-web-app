import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../lib/api'
import { Button, ErrorNote, Field, inputCls, Logo } from '../components/ui'
import { errorMessage } from '../lib/format'
import { useSession } from '../lib/session'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { refreshUser } = useSession()
  const nav = useNavigate()
  const signup = mode === 'signup'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (signup) await api.signUp(email, password, name)
      else await api.logIn(email, password)
      await refreshUser()
      nav('/app/items', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="grain relative min-h-dvh bg-paper">
      <div className="relative z-10 mx-auto max-w-md px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Link to="/"><Logo /></Link>
        <h1 className="rise mt-10 font-display text-4xl font-extrabold text-pine">{signup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-muted">{signup ? 'Tag your things in under a minute.' : 'Log in to see your items and alerts.'}</p>

        <form onSubmit={submit} className="rise mt-8 space-y-4" style={{ animationDelay: '.05s' }}>
          {signup && (
            <Field label="Your name" hint="Finders only ever see your first name.">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Rahul Varma" autoComplete="name" required />
            </Field>
          )}
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@vnrvjiet.in" autoComplete="email" required />
          </Field>
          <Field label="Password" hint={signup ? 'At least 8 characters.' : undefined}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete={signup ? 'new-password' : 'current-password'} required />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" size="lg" className="w-full" loading={busy}>{signup ? 'Create account' : 'Log in'}</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {signup ? 'Already have an account?' : 'New to ReturnMe?'}{' '}
          <Link to={signup ? '/login' : '/signup'} className="font-semibold text-pine underline-offset-4 hover:underline">
            {signup ? 'Log in' : 'Create an account'}
          </Link>
        </p>
        <p className="mt-8 rounded-2xl border border-dashed border-line p-4 text-center text-xs text-muted">
          Preview mode: accounts are kept in this browser only. Secure sign-in with Netlify Identity arrives in the next milestone.
        </p>
      </div>
    </div>
  )
}
