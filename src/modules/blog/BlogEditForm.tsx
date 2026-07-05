import { getArticleById } from '@silviomarini/blog-engine'
import type { BlogCategory } from '@silviomarini/blog-engine'
import type { CustodianEditModuleProps } from '../../types'
import type { BlogDb } from './types'
import { BlogEditFormClient } from './BlogEditFormClient'

interface BlogEditFormProps extends CustodianEditModuleProps {
  getDb: () => BlogDb | Promise<BlogDb>
  categories: BlogCategory[]
  defaultLang: 'it' | 'en'
  route: string
  apiBasePath: string
}

/**
 * Server Component: loads the existing article (if any) for pre-fill, then
 * hands off to a client form. The actual write goes through a REST call to
 * apiBasePath, not a Server Action — see BlogEditFormClient for why.
 */
export async function BlogEditForm({
  config,
  itemId,
  getDb,
  categories,
  defaultLang,
  route,
  apiBasePath,
}: BlogEditFormProps) {
  const db = await getDb()
  const existing = itemId ? await getArticleById(db, itemId) : null
  const basePath = config.basePath ?? '/admin'

  return (
    <BlogEditFormClient
      itemId={itemId}
      existing={existing}
      categories={categories}
      defaultLang={defaultLang}
      listUrl={`${basePath}/${route}`}
      apiBasePath={apiBasePath}
    />
  )
}
