import type { CustodianConfig, CustodianModuleSummary } from '../types'

export interface DashboardPageProps {
  config: CustodianConfig
  modules: CustodianModuleSummary[]
}

/**
 * Built-in home page for the panel root (basePath itself, e.g. "/custodian").
 * Not a module — always present regardless of what's registered, and
 * imports nothing module-specific. The route rendering it (createHomePage)
 * assumes it's already reached past the auth gate: no auth check here.
 */
export function DashboardPage({ config, modules }: DashboardPageProps) {
  const basePath = config.basePath ?? '/admin'

  return (
    <div className="custodian-dashboard">
      <h1>Benvenuto su Custodian</h1>
      <p>Da qui puoi raggiungere ogni sezione del pannello usando la navigazione a sinistra.</p>

      {modules.length > 0 && (
        <div className="custodian-dashboard-grid">
          {modules.map((mod) => (
            <a key={mod.id} href={`${basePath}/${mod.route}`} className="custodian-tile">
              {mod.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
