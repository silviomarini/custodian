import { redirect } from 'next/navigation'
import { getArticleById, createArticle, updateArticle } from '@silviomarini/blog-engine'
import type { BlogCategory, CreateArticleBody } from '@silviomarini/blog-engine'
import type { CustodianEditModuleProps } from '../../types'
import type { BlogDb } from './types'

interface BlogEditFormProps extends CustodianEditModuleProps {
  getDb: () => BlogDb | Promise<BlogDb>
  categories: BlogCategory[]
  defaultLang: 'it' | 'en'
  route: string
}

/**
 * Server Component + Server Action: create/edit form for a single article.
 * The submit action runs on the server and calls blog-engine's
 * createArticle/updateArticle directly — this page is already gated by
 * Custodian's middleware, so the action inherits that protection.
 */
export async function BlogEditForm({ config, itemId, getDb, categories, defaultLang, route }: BlogEditFormProps) {
  const db = await getDb()
  const existing = itemId ? await getArticleById(db, itemId) : null
  const basePath = config.basePath ?? '/admin'

  async function save(formData: FormData) {
    'use server'

    const body: CreateArticleBody = {
      title: String(formData.get('title') ?? ''),
      category: String(formData.get('category') ?? '') || undefined,
      lang: formData.get('lang') === 'en' ? 'en' : 'it',
      excerpt: String(formData.get('excerpt') ?? ''),
      content: String(formData.get('content') ?? ''),
      published: formData.get('published') === 'on',
    }

    const writeDb = await getDb()
    if (itemId) {
      await updateArticle(writeDb, itemId, body)
    } else {
      await createArticle(writeDb, body)
    }

    redirect(`${basePath}/${route}`)
  }

  return (
    <form action={save} className="custodian-blog-form">
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

      <button type="submit">Salva</button>
    </form>
  )
}
