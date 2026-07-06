import type { ComponentType, ReactNode } from 'react'

/** Static branding for the admin shell — everything optional, no defaults baked into content. */
export interface CustodianBranding {
  title?: string
  logoUrl?: string
}

/**
 * Core configuration for the admin shell. Deliberately module-agnostic —
 * anything specific to a single module (e.g. blog categories) belongs in
 * that module's own options, not here.
 */
export interface CustodianConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  /** Emails allowed into the panel, checked case-insensitively via verifyAdmin. */
  adminEmails: string[]
  branding?: CustodianBranding
  /** Mount path of the panel in the consumer app. Default: '/admin'. */
  basePath?: string
  /** emailRedirectTo passed to the magic-link sign-in call. */
  loginRedirectTo?: string
}

export interface CustodianModuleProps {
  config: CustodianConfig
}

export interface CustodianEditModuleProps extends CustodianModuleProps {
  /** Item id from the route; undefined when creating a new item. */
  itemId?: string
}

/**
 * A single entry in a module's two-level nav (e.g. blog's "articoli",
 * later "categorie"). Same list/edit component shape a top-level module
 * without children would use.
 */
export interface CustodianNavChild {
  id: string
  label: string
  route: string
  listComponent: ComponentType<CustodianModuleProps>
  editComponent?: ComponentType<CustodianEditModuleProps>
}

/**
 * A registrable admin panel module. Custodian's core only ever sees this
 * shape — it has no knowledge of what a module actually manages.
 *
 * listComponent/editComponent are optional so a module can register purely
 * via `children` (two-level nav). A module without children behaves exactly
 * as before, rendering its own listComponent/editComponent directly. When
 * `children` is present, navigation/routing must resolve through them
 * instead of the module's own listComponent/editComponent.
 */
export interface CustodianModule {
  id: string
  label: string
  route: string
  listComponent?: ComponentType<CustodianModuleProps>
  editComponent?: ComponentType<CustodianEditModuleProps>
  children?: CustodianNavChild[]
  /**
   * Reserved for a future real icon in the nav rail. Not read anywhere yet —
   * AdminLayout falls back to the module's initials until this is wired up.
   */
  icon?: ReactNode
}

/** Data-only subset of CustodianNavChild — see CustodianModuleSummary. */
export interface CustodianNavChildSummary {
  id: string
  label: string
  route: string
}

/**
 * Data-only subset of CustodianModule — safe to pass across the Server/Client
 * boundary into 'use client' components (e.g. AdminLayout's nav), since
 * listComponent/editComponent are functions and React cannot serialize those
 * as props on a Client Component.
 */
export interface CustodianModuleSummary {
  id: string
  label: string
  route: string
  children?: CustodianNavChildSummary[]
}
