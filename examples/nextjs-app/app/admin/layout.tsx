import { getSettings, createAdminLayoutComponent } from '@silviomarini/custodian'
import { custodianApp, getDb } from '../../lib/custodian'

// Server Component (async): resolves the accent color once per request —
// settings row if one's been saved, otherwise the static branding fallback —
// and hands it to AdminLayout so it never has to fetch client-side (no
// flash of the fallback color on first paint).
export default async function CustodianAdminLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb()
  const settings = await getSettings(db)
  const resolvedAccentColor = settings?.accent_color ?? custodianApp.config.branding?.accentColor

  const Layout = createAdminLayoutComponent(custodianApp, { resolvedAccentColor })
  return <Layout>{children}</Layout>
}
