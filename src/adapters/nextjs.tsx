import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { notFound } from 'next/navigation'
import { createSupabaseMiddlewareClient } from '@silviomarini/auth'
import type { AdminSession } from '@silviomarini/auth'
import { checkAdminAccess } from '../auth/gate'
import { LoginPage } from '../components/LoginPage'
import { AdminLayout } from '../components/AdminLayout'
import type { CustodianConfig, CustodianModuleSummary } from '../types'
import type { CustodianApp } from '../create-app'

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

/** Layout component for app/admin/layout.tsx — persists the nav across module navigation. */
export function createAdminLayoutComponent(app: CustodianApp) {
  // AdminLayout is a Client Component: only pass the serializable subset of
  // each module (and its children) across the boundary, never
  // listComponent/editComponent (functions).
  const moduleSummaries: CustodianModuleSummary[] = app.modules.map(({ id, label, route, children }) => ({
    id,
    label,
    route,
    children: children?.map(({ id: childId, label: childLabel, route: childRoute }) => ({
      id: childId,
      label: childLabel,
      route: childRoute,
    })),
  }))

  return function CustodianAdminLayout({ children }: { children: React.ReactNode }) {
    return (
      <AdminLayout modules={moduleSummaries} config={app.config}>
        {children}
      </AdminLayout>
    )
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
