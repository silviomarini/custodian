import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { notFound } from 'next/navigation'
import { createSupabaseMiddlewareClient } from '@silviomarini/auth'
import type { AdminSession } from '@silviomarini/auth'
import { checkAdminAccess } from '../auth/gate'
import { LoginPage } from '../components/LoginPage'
import { AdminLayout } from '../components/AdminLayout'
import { DashboardPage } from '../components/DashboardPage'
import { SettingsPage } from '../components/SettingsPage'
import { getSettings, updateSettings } from '../settings'
import type { CustodianConfig, CustodianModule, CustodianModuleSummary } from '../types'
import type { CustodianApp } from '../create-app'

// Structural match of the Supabase client's query surface — same
// dependency-injection pattern as everywhere else in this package (BlogDb,
// settings.ts's own Db). Redeclared locally rather than shared, matching
// blog-engine's adapters/nextjs.ts convention of its own local Db type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = { from: (table: string) => any }

interface StorageFileApi {
  upload: (
    path: string,
    body: Blob,
    options?: { contentType?: string; upsert?: boolean }
  ) => Promise<{ data: { path: string } | null; error: { message: string } | null }>
  getPublicUrl: (path: string) => { data: { publicUrl: string } }
}

/** Structural match of Supabase's storage client (e.g. pass `supabase.storage`). */
interface SupabaseStorageClient {
  from: (bucket: string) => StorageFileApi
}

function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

function err(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/** Strips listComponent/editComponent (functions) so this can cross into a Client Component. */
function toModuleSummaries(modules: CustodianModule[]): CustodianModuleSummary[] {
  return modules.map(({ id, label, route, children }) => ({
    id,
    label,
    route,
    children: children?.map(({ id: childId, label: childLabel, route: childRoute }) => ({
      id: childId,
      label: childLabel,
      route: childRoute,
    })),
  }))
}

/**
 * Builds the middleware that gates every /admin/* route behind verifyAdmin.
 * Register it in the consumer's middleware.ts with a matcher covering basePath.
 */
export function createCustodianMiddleware(config: CustodianConfig) {
  const basePath = config.basePath ?? '/admin'
  const loginPath = `${basePath}/login`

  return async function custodianMiddleware(request: NextRequest): Promise<NextResponse> {
    if (request.nextUrl.pathname === loginPath) {
      return NextResponse.next()
    }

    const response = NextResponse.next()
    const supabase = createSupabaseMiddlewareClient(request, response, {
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey,
    })

    const { data } = await supabase.auth.getUser()
    const session: AdminSession | null = data.user ? { user: { email: data.user.email } } : null

    if (!checkAdminAccess(session, config)) {
      return NextResponse.redirect(new URL(loginPath, request.url))
    }

    return response
  }
}

/** Page component for app/admin/login/page.tsx. */
export function createLoginPage(config: CustodianConfig) {
  return function CustodianLoginPage() {
    return <LoginPage config={config} />
  }
}

/**
 * Page component for app/admin/page.tsx — the panel's home/dashboard at the
 * root of basePath. No auth check here: the middleware already gates every
 * /admin/* route (except /admin/login), so this page assumes it was reached
 * authenticated.
 */
export function createHomePage(app: CustodianApp) {
  const moduleSummaries = toModuleSummaries(app.modules)

  return function CustodianHomePage() {
    return <DashboardPage config={app.config} modules={moduleSummaries} />
  }
}

export interface CreateAdminLayoutOptions {
  /**
   * Server-resolved accent color (typically `settings.accent_color ??
   * config.branding?.accentColor`, computed by an async layout.tsx that
   * calls getSettings(db) itself). When present, AdminLayout uses it
   * directly and skips its client-side settings fetch entirely — no flash
   * of the fallback color on first paint.
   *
   * Optional and backward-compatible: omit it (or don't pass a second
   * argument at all) to keep the previous client-side-fetch behavior.
   */
  resolvedAccentColor?: string
}

/** Layout component for app/admin/layout.tsx — persists the nav across module navigation. */
export function createAdminLayoutComponent(app: CustodianApp, options?: CreateAdminLayoutOptions) {
  // AdminLayout is a Client Component: only pass the serializable subset of
  // each module (and its children) across the boundary, never
  // listComponent/editComponent (functions).
  const moduleSummaries = toModuleSummaries(app.modules)
  const settingsApiBasePath = app.config.settingsApiBasePath ?? '/api/settings'
  const resolvedAccentColor = options?.resolvedAccentColor

  return function CustodianAdminLayout({ children }: { children: React.ReactNode }) {
    return (
      <AdminLayout
        modules={moduleSummaries}
        config={app.config}
        settingsApiBasePath={settingsApiBasePath}
        resolvedAccentColor={resolvedAccentColor}
      >
        {children}
      </AdminLayout>
    )
  }
}

/** Page component for app/admin/settings/page.tsx — the branding settings page. */
export function createSettingsPage(app: CustodianApp) {
  const apiBasePath = app.config.settingsApiBasePath ?? '/api/settings'
  const logoApiBasePath = `${apiBasePath}/logo`

  return function CustodianSettingsPage() {
    return <SettingsPage config={app.config} apiBasePath={apiBasePath} logoApiBasePath={logoApiBasePath} />
  }
}

/** Page component for app/admin/[module]/page.tsx — renders the module's list view. */
export function createModulePage(app: CustodianApp) {
  return async function CustodianModulePage({
    params,
  }: {
    params: Promise<{ module: string }>
  }) {
    const { module: routeSegment } = await params
    const mod = app.getModuleByRoute(routeSegment)
    if (!mod?.listComponent) notFound()

    const List = mod.listComponent
    return <List config={app.config} />
  }
}

/** Page component for app/admin/[module]/[itemId]/page.tsx — renders the module's edit view. */
export function createModuleEditPage(app: CustodianApp) {
  return async function CustodianModuleEditPage({
    params,
  }: {
    params: Promise<{ module: string; itemId: string }>
  }) {
    const { module: routeSegment, itemId } = await params
    const mod = app.getModuleByRoute(routeSegment)
    if (!mod?.editComponent) notFound()

    const Edit = mod.editComponent
    return <Edit config={app.config} itemId={itemId === 'new' ? undefined : itemId} />
  }
}

export interface SettingsRouteHandlerConfig {
  /** Supabase client, already instantiated by the consumer. */
  db: Db
  /** Called by the PATCH handler — no write proceeds unless isAdmin is true. */
  getAuthContext: (req: NextRequest) => Promise<{ isAdmin: boolean }>
}

/**
 * Generates { GET, PATCH } handlers for the branding settings endpoint.
 *
 * GET   — public: branding (e.g. the logo) is needed on unauthenticated pages
 *         too, like the login screen itself. 404 if no settings row exists
 *         yet (first-time setup).
 * PATCH — admin only (403 if isAdmin is false, checked before touching the
 *         database). Body: { accent_color?, logo_url? }.
 *
 * Usage in app/api/custodian/settings/route.ts:
 *   export const { GET, PATCH } = createSettingsRouteHandlers({ db, getAuthContext })
 */
export function createSettingsRouteHandlers(config: SettingsRouteHandlerConfig) {
  const { db, getAuthContext } = config

  async function GET(): Promise<NextResponse> {
    try {
      const settings = await getSettings(db)
      if (!settings) return err('Not found', 404)
      return ok(settings)
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Internal error', 500)
    }
  }

  async function PATCH(req: NextRequest): Promise<NextResponse> {
    try {
      const { isAdmin } = await getAuthContext(req)
      if (!isAdmin) return err('Forbidden', 403)

      const body = (await req.json()) as { accent_color?: string; logo_url?: string | null }
      const settings = await updateSettings(db, body)
      return ok(settings)
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Internal error', 500)
    }
  }

  return { GET, PATCH }
}

const ALLOWED_LOGO_TYPES = ['image/png', 'image/svg+xml']

export interface LogoUploadRouteHandlerConfig {
  /**
   * Supabase Storage client, already instantiated by the consumer
   * (pass `supabase.storage`) — this package never creates one itself.
   */
  storage: SupabaseStorageClient
  getAuthContext: (req: NextRequest) => Promise<{ isAdmin: boolean }>
  /**
   * Storage bucket to upload into. Default: 'custodian-branding'.
   * The consumer must create this bucket in the Supabase dashboard first
   * (public, or with a public SELECT policy) — this package never creates it.
   */
  bucket?: string
}

/**
 * Generates a { POST } handler that uploads a PNG/SVG logo to Supabase
 * Storage and returns its public URL. Admin only (403 if isAdmin is false,
 * checked before any upload). Expects multipart/form-data with a "file" field
 * — the simplest fit for a modern Next.js route handler (Web-standard
 * Request.formData(), no extra multipart parser dependency).
 *
 * Usage in app/api/custodian/logo/route.ts:
 *   export const { POST } = createLogoUploadRouteHandler({ storage: supabase.storage, getAuthContext })
 */
export function createLogoUploadRouteHandler(config: LogoUploadRouteHandlerConfig) {
  const { storage, getAuthContext, bucket = 'custodian-branding' } = config

  async function POST(req: NextRequest): Promise<NextResponse> {
    try {
      const { isAdmin } = await getAuthContext(req)
      if (!isAdmin) return err('Forbidden', 403)

      const formData = await req.formData()
      const file = formData.get('file')

      if (!(file instanceof Blob)) return err('Missing file', 400)
      if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
        return err(`Invalid file type. Allowed: ${ALLOWED_LOGO_TYPES.join(', ')}`, 400)
      }

      const extension = file.type === 'image/svg+xml' ? 'svg' : 'png'
      const path = `logo-${Date.now()}.${extension}`

      const { error: uploadError } = await storage.from(bucket).upload(path, file, {
        contentType: file.type,
        upsert: true,
      })
      if (uploadError) return err(uploadError.message, 500)

      const { data } = storage.from(bucket).getPublicUrl(path)
      return ok({ logo_url: data.publicUrl })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Internal error', 500)
    }
  }

  return { POST }
}
