import { BlogListPage } from './BlogListPage'
import { BlogEditForm } from './BlogEditForm'
import type { CustodianModule, CustodianModuleProps, CustodianEditModuleProps } from '../../types'
import type { BlogModuleOptions } from './types'

export type { BlogModuleOptions, BlogDb } from './types'

/**
 * Blog module — the only place in this package that depends on
 * @silviomarini/blog-engine. Custodian's core never imports this file.
 */
export function createBlogModule(options: BlogModuleOptions): CustodianModule {
  const {
    getDb,
    categories,
    defaultLang = 'it',
    apiBasePath = '/api/articles',
    id = 'blog',
    label = 'Blog',
    route = 'blog',
  } = options

  function ListComponent(props: CustodianModuleProps) {
    return <BlogListPage {...props} getDb={getDb} categories={categories} defaultLang={defaultLang} route={route} />
  }

  function EditComponent(props: CustodianEditModuleProps) {
    return (
      <BlogEditForm
        {...props}
        getDb={getDb}
        categories={categories}
        defaultLang={defaultLang}
        route={route}
        apiBasePath={apiBasePath}
      />
    )
  }

  return {
    id,
    label,
    route,
    listComponent: ListComponent,
    editComponent: EditComponent,
  }
}
