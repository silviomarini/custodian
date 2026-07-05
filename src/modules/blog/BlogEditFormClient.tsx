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

type Status = { type: 'idle' | 'saving' | 'error'; message?: string }

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus({ type: 'saving' })

    const formData = new FormData(e.currentTarget)
    const body: CreateArticleBody = {
      title: String(formData.get('title') ?? ''),
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

    router.push(listUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="custodian-blog-form">
      <h1>{itemId ? 'Modifica articolo' : 'Nuovo articolo'}</h1>

      <label>
        Titolo
        <input name="title" defaultValue={existing?.title} required />
      </label>

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

      {status.type === 'error' && <p role="alert">{status.message}</p>}

      <button type="submit" disabled={status.type === 'saving'}>
        Salva
      </button>
    </form>
  )
}
