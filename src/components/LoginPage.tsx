'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { signInWithMagicLink, signInWithPassword } from '@silviomarini/auth'
import type { CustodianConfig } from '../types'

export interface LoginPageProps {
  config: CustodianConfig
}

type Mode = 'password' | 'magic-link'
type Status = { type: 'idle' | 'loading' | 'error' | 'sent'; message?: string }

/**
 * Login screen offering both magic link and password sign-in, backed by
 * @silviomarini/auth. Uses the SSR-aware browser client so the session
 * cookie is readable by the server-side gate (middleware / getServerSession).
 */
export function LoginPage({ config }: LoginPageProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  const supabase = createBrowserClient(config.supabaseUrl, config.supabaseAnonKey)
  // @silviomarini/auth duck-types the Supabase client with a slightly stricter
  // (email: string | null) shape than @supabase/supabase-js actually returns
  // (email: string | undefined) — harmless at runtime, bridge the type gap here.
  const authClient = supabase as unknown as Parameters<typeof signInWithPassword>[0]

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus({ type: 'loading' })
    const { error } = await signInWithPassword(authClient, email, password)
    if (error) {
      setStatus({ type: 'error', message: error })
      return
    }
    router.push(config.basePath ?? '/admin')
    router.refresh()
  }

  async function handleMagicLinkSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus({ type: 'loading' })
    const { error } = await signInWithMagicLink(authClient, email, {
      emailRedirectTo: config.loginRedirectTo,
    })
    if (error) {
      setStatus({ type: 'error', message: error })
      return
    }
    setStatus({ type: 'sent', message: 'Controlla la tua email per il link di accesso.' })
  }

  return (
    <div className="custodian-login">
      <h1>{config.branding?.title ?? 'Admin'}</h1>

      <div role="tablist" className="custodian-login-tabs">
        <button type="button" aria-pressed={mode === 'password'} onClick={() => setMode('password')}>
          Password
        </button>
        <button type="button" aria-pressed={mode === 'magic-link'} onClick={() => setMode('magic-link')}>
          Magic link
        </button>
      </div>

      {mode === 'password' ? (
        <form onSubmit={handlePasswordSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit" disabled={status.type === 'loading'}>
            Accedi
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLinkSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button type="submit" disabled={status.type === 'loading'}>
            Invia link di accesso
          </button>
        </form>
      )}

      {status.type === 'error' && <p role="alert">{status.message}</p>}
      {status.type === 'sent' && <p role="status">{status.message}</p>}
    </div>
  )
}
