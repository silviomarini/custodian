import { createArticleByIdRouteHandlers } from '@silviomarini/blog-engine'
import { db, getAuthContext } from '../../../../lib/blog-api'

// All admin-only. PATCH is what BlogEditFormClient calls to update an existing article.
export const { GET, PATCH, DELETE } = createArticleByIdRouteHandlers({ db, getAuthContext })
