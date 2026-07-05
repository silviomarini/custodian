import type { CustodianConfig, CustodianModule } from './types'

export interface CustodianApp {
  modules: CustodianModule[]
  config: CustodianConfig
  getModule: (id: string) => CustodianModule | undefined
  getModuleByRoute: (route: string) => CustodianModule | undefined
}

/** Register modules against a config. Throws early on duplicate module ids. */
export function createCustodianApp(modules: CustodianModule[], config: CustodianConfig): CustodianApp {
  const seen = new Set<string>()
  for (const mod of modules) {
    if (seen.has(mod.id)) throw new Error(`Duplicate Custodian module id: ${mod.id}`)
    seen.add(mod.id)
  }

  return {
    modules,
    config,
    getModule: (id) => modules.find((mod) => mod.id === id),
    getModuleByRoute: (route) => modules.find((mod) => mod.route === route),
  }
}
