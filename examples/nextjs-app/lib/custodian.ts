import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@silviomarini/auth'
import { createCustodianApp } from '@silviomarini/custodian'
import type { CustodianConfig } from '@silviomarini/custodian'
import { createBlogModule } from '@silviomarini/custodian/blog'

// Consumer-owned category list — never hardcoded inside blog-engine or custodian.
const BLOG_CATEGORIES = [
  { slug: 'news', it: 'Notizie', en: 'News' },
  { slug: 'guides', it: 'Guide', en: 'Guides' },
]

export const custodianConfig: CustodianConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  adminEmails: (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()),
  branding: { title: 'Il Mio Pannello' },
  basePath: '/admin',
}

export async function getDb() {
  const cookieStore = await cookies()
  return createSupabaseServerClient(cookieStore, {
    supabaseUrl: custodianConfig.supabaseUrl,
    supabaseAnonKey: custodianConfig.supabaseAnonKey,
  })
}

const blogModule = createBlogModule({
  getDb,
  categories: BLOG_CATEGORIES,
  defaultLang: 'it',
  // Mounted below via blog-engine's route handler adapter (see lib/blog-api.ts
  // and app/api/articles/**). The edit form fetch()es this, it can't use a
  // Server Action shipped from @silviomarini/custodian.
  apiBasePath: '/api/articles',
})

export const custodianApp = createCustodianApp([blogModule], custodianConfig)
