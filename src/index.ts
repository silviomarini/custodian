// Core shell only: auth, layout, module registration. Never import a module's
// content package here — modules live under their own subpath (e.g. './blog').

export type {
  CustodianConfig,
  CustodianBranding,
  CustodianModule,
  CustodianModuleSummary,
  CustodianModuleProps,
  CustodianEditModuleProps,
} from './types'

export type { CustodianApp } from './create-app'
export { createCustodianApp } from './create-app'

export type { CustodianSettings } from './settings'
export { getSettings, updateSettings } from './settings'

export { checkAdminAccess } from './auth/gate'

export type { LoginPageProps } from './components/LoginPage'
export { LoginPage } from './components/LoginPage'

export type { AdminLayoutProps } from './components/AdminLayout'
export { AdminLayout } from './components/AdminLayout'

export { DashboardPage } from './components/DashboardPage'

export type { SettingsPageProps } from './components/SettingsPage'
export { SettingsPage } from './components/SettingsPage'

export type { ThemeToggleProps } from './components/ThemeToggle'
export { ThemeToggle } from './components/ThemeToggle'

export type { CustodianThemePreference } from './theme'
export { initTheme, toggleTheme, THEME_INIT_SCRIPT } from './theme'

export type {
  CreateAdminLayoutOptions,
  SettingsRouteHandlerConfig,
  LogoUploadRouteHandlerConfig,
} from './adapters/nextjs'
export {
  createCustodianMiddleware,
  createLoginPage,
  createHomePage,
  createAdminLayoutComponent,
  createModulePage,
  createModuleEditPage,
  createSettingsPage,
  createSettingsRouteHandlers,
  createLogoUploadRouteHandler,
} from './adapters/nextjs'
