import type { BlogCategory } from '@silviomarini/blog-engine'

// Structural match of blog-engine's internal `Db` param — not exported by that
// package, so we declare our own compatible shape instead of `any`.
export type BlogDb = { from: (table: string) => any } // eslint-disable-line @typescript-eslint/no-explicit-any

export interface BlogModuleOptions {
  /** Called per-render to get a request-scoped Supabase client (RLS-aware, cookie-bound). */
  getDb: () => BlogDb | Promise<BlogDb>
  /** Consumer-defined category list — blog-engine and custodian never hardcode these. */
  categories: BlogCategory[]
  /** Lang used to resolve a category's display label. Default: 'it'. */
  defaultLang?: 'it' | 'en'
  /**
   * REST endpoint the edit form POSTs/PATCHes to, mounted by the consumer via
   * blog-engine's createArticlesRouteHandlers / createArticleByIdRouteHandlers.
   * Required because the write itself can't run as a Server Action shipped
   * from this package — Next.js binds Server Action ids to the consuming
   * app's own build, not the package's. Default: '/api/articles'.
   */
  apiBasePath?: string
  /** Default: 'blog'. */
  id?: string
  /** Default: 'Blog'. */
  label?: string
  /** Default: 'blog'. */
  route?: string
}
