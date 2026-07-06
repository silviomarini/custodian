/**
 * Built-in home page for the panel root (basePath itself, e.g. "/custodian").
 * Not a module — always present regardless of what's registered, and
 * imports nothing module-specific. The route rendering it (createHomePage)
 * assumes it's already reached past the auth gate: no auth check here.
 */
export function DashboardPage() {
  return (
    <div className="custodian-dashboard">
      <h1>Benvenuto su Custodian</h1>
      <p>Da qui puoi raggiungere ogni sezione del pannello usando la navigazione a sinistra.</p>
    </div>
  )
}
