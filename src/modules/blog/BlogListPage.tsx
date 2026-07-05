import { getAdminArticles } from '@silviomarini/blog-engine'
import type { AdminArticleListItem, BlogCategory } from '@silviomarini/blog-engine'
import type { CustodianModuleProps } from '../../types'
import type { BlogDb } from './types'

interface BlogListPageProps extends CustodianModuleProps {
  getDb: () => BlogDb | Promise<BlogDb>
  categories: BlogCategory[]
  defaultLang: 'it' | 'en'
  route: string
}

function categoryLabel(categories: BlogCategory[], slug: string | null, lang: string): string {
  if (!slug) return '—'
  const category = categories.find((c) => c.slug === slug)
  return category?.[lang] ?? category?.slug ?? slug
}

/** Server Component: admin article list, including drafts. */
export async function BlogListPage({ config, getDb, categories, defaultLang, route }: BlogListPageProps) {
  const db = await getDb()
  const articles: AdminArticleListItem[] = await getAdminArticles(db)
  const basePath = config.basePath ?? '/admin'

  return (
    <div className="custodian-blog-list">
      <header>
        <h1>Articoli</h1>
        <a href={`${basePath}/${route}/new`}>+ Nuovo articolo</a>
      </header>

      <table>
        <thead>
          <tr>
            <th>Titolo</th>
            <th>Categoria</th>
            <th>Lingua</th>
            <th>Stato</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td>{article.title}</td>
              <td>{categoryLabel(categories, article.category, defaultLang)}</td>
              <td>{article.lang}</td>
              <td>{article.published ? 'Pubblicato' : 'Bozza'}</td>
              <td>
                <a href={`${basePath}/${route}/${article.id}`}>Modifica</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
