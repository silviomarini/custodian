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

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' })
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

      <div className="custodian-blog-list-table-wrap">
        <div className="custodian-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Titolo</th>
                <th scope="col">Categoria</th>
                <th scope="col">Lingua</th>
                <th scope="col">Pubblicato il</th>
                <th scope="col">Views</th>
                <th scope="col">Stato</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>{article.title}</td>
                  <td>{categoryLabel(categories, article.category, defaultLang)}</td>
                  <td>{article.lang}</td>
                  <td className="custodian-mono">{formatDate(article.published_at)}</td>
                  <td className="custodian-mono">{article.views}</td>
                  <td>
                    <span
                      className={`custodian-tag ${
                        article.published ? 'custodian-tag--published' : 'custodian-tag--draft'
                      }`}
                    >
                      {article.published ? 'Pubblicato' : 'Bozza'}
                    </span>
                  </td>
                  <td>
                    <a href={`${basePath}/${route}/${article.id}`}>Modifica</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
