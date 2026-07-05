// Core shell only: auth, layout, module registration. Never import a module's
// content package here — modules live under their own subpath (e.g. './blog').

export type {
  CustodianConfig,
  CustodianBranding,
  CustodianModule,
  CustodianModuleProps,
  CustodianEditModuleProps,
} from './types'

export type { CustodianApp } from './create-app'
export { createCustodianApp } from './create-app'

export { checkAdminAccess } from './auth/gate'

export type { LoginPageProps } from './components/LoginPage'
export { LoginPage } from './components/LoginPage'

export type { AdminLayoutProps } from './components/AdminLayout'
export { AdminLayout } from './components/AdminLayout'

export {
  createCustodianMiddleware,
  createLoginPage,
  createAdminLayoutComponent,
  createModulePage,
  createModuleEditPage,
} from './adapters/nextjs'
