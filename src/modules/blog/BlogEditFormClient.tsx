'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Article, BlogCategory, CreateArticleBody } from '@silviomarini/blog-engine'

export interface BlogEditFormClientProps {
  itemId?: string
  existing: Article | null
  categories: BlogCategory[]
  defaultLang: 'it' | 'en'
  /** Where to navigate back to after a successful save. */
  listUrl: string
  apiBasePath: string
}

type Status = { type: 'idle' | 'saving' | 'success' | 'error'; message?: string }

/** Success is shown briefly before navigating away, so it's actually visible. */
const SUCCESS_REDIRECT_DELAY_MS = 600

/**
 * Create/edit form. Submits via fetch() to the consumer's own REST endpoint
 * (mounted with blog-engine's createArticlesRouteHandlers /
 * createArticleByIdRouteHandlers) rather than a Server Action — a Server
 * Action shipped from this package would be compiled here, but Next.js binds
 * action ids to the consuming app's own build, so it can't be invoked from
 * there ("$$RSC_SERVER_ACTION_0 is not defined" at runtime).
 */
export function BlogEditFormClient({
  itemId,
  existing,
  categories,
  defaultLang,
  listUrl,
  apiBasePath,
}: BlogEditFormClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [titleError, setTitleError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const title = String(formData.get('title') ?? '').trim()

    if (!title) {
      setTitleError('Il titolo è obbligatorio.')
      return
    }
    setTitleError(null)
    setStatus({ type: 'saving' })

    const body: CreateArticleBody = {
      title,
      category: String(formData.get('category') ?? '') || undefined,
      lang: formData.get('lang') === 'en' ? 'en' : 'it',
      excerpt: String(formData.get('excerpt') ?? ''),
      content: String(formData.get('content') ?? ''),
      published: formData.get('published') === 'on',
    }

    const url = itemId ? `${apiBasePath}/${itemId}` : apiBasePath
    const method = itemId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}) as { error?: string })
      setStatus({ type: 'error', message: json.error ?? `Salvataggio fallito (${res.status})` })
      return
    }

    setStatus({ type: 'success', message: 'Salvato con successo.' })
    setTimeout(() => {
      router.push(listUrl)
      router.refresh()
    }, SUCCESS_REDIRECT_DELAY_MS)
  }

  return (
    <form onSubmit={handleSubmit} className="custodian-blog-form" noValidate>
      <h1>{itemId ? 'Modifica articolo' : 'Nuovo articolo'}</h1>

      <label className={titleError ? 'custodian-field-error' : undefined}>
        Titolo
        <input name="title" defaultValue={existing?.title} aria-invalid={titleError ? true : undefined} />
        {titleError && (
          <span className="custodian-field-error-message">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {titleError}
          </span>
        )}
      </label>

      <div className="custodian-blog-form-row">
        <label>
          Categoria
          <select name="category" defaultValue={existing?.category ?? ''}>
            <option value="">—</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category[defaultLang] ?? category.slug}
              </option>
            ))}
          </select>
        </label>

        <label>
          Lingua
          <select name="lang" defaultValue={existing?.lang ?? defaultLang}>
            <option value="it">it</option>
            <option value="en">en</option>
          </select>
        </label>
      </div>

      <label>
        Estratto
        <textarea name="excerpt" defaultValue={existing?.excerpt ?? ''} />
      </label>

      <label>
        Contenuto
        <textarea name="content" defaultValue={existing?.content ?? ''} rows={16} />
      </label>

      <label>
        <input type="checkbox" name="published" defaultChecked={existing?.published ?? false} />
        Pubblicato
      </label>

      {status.type === 'error' && (
        <p role="alert" className="custodian-banner custodian-banner--danger">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{status.message}</span>
        </p>
      )}

      {status.type === 'saving' && (
        <p role="status" className="custodian-banner custodian-banner--info">
          <svg aria-hidden="true" className="custodian-spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-9-9" />
          </svg>
          <span>Salvataggio in corso…</span>
        </p>
      )}

      {status.type === 'success' && (
        <p role="status" className="custodian-banner custodian-banner--success">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>{status.message}</span>
        </p>
      )}

      <button type="submit" disabled={status.type === 'saving' || status.type === 'success'}>
        {status.type === 'saving' ? 'Salvataggio…' : 'Salva'}
      </button>
    </form>
  )
}
