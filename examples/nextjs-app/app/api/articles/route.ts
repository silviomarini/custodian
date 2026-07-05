import { createArticlesRouteHandlers } from '@silviomarini/blog-engine'
import { db, getAuthContext } from '../../../lib/blog-api'

// GET: public list of published articles. POST: admin-only create — this is
// the endpoint BlogEditFormClient posts new articles to.
export const { GET, POST } = createArticlesRouteHandlers({ db, getAuthContext })
