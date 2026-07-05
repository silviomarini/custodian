import type { ComponentType } from 'react'

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
 * A registrable admin panel module. Custodian's core only ever sees this
 * shape — it has no knowledge of what a module actually manages.
 */
export interface CustodianModule {
  id: string
  label: string
  route: string
  listComponent: ComponentType<CustodianModuleProps>
  editComponent?: ComponentType<CustodianEditModuleProps>
}
