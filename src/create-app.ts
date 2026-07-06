import type { CustodianConfig, CustodianModule, CustodianNavChild } from './types'

export interface CustodianChildMatch {
  module: CustodianModule
  child: CustodianNavChild
}

export interface CustodianApp {
  modules: CustodianModule[]
  config: CustodianConfig
  getModule: (id: string) => CustodianModule | undefined
  /** Exact top-level route match only (e.g. "blog") — unchanged by two-level nav. */
  getModuleByRoute: (route: string) => CustodianModule | undefined
  /**
   * Resolves a composite "parent/child" route (e.g. "blog/articoli") to its
   * module and child. A separate helper rather than overloading
   * getModuleByRoute — that keeps every existing call site (and its return
   * type) untouched, since only future two-level routing needs this.
   */
  getChildByRoute: (route: string) => CustodianChildMatch | undefined
}

/** Register modules against a config. Throws early on duplicate module ids. */
export function createCustodianApp(modules: CustodianModule[], config: CustodianConfig): CustodianApp {
  const seen = new Set<string>()
  for (const mod of modules) {
    if (seen.has(mod.id)) throw new Error(`Duplicate Custodian module id: ${mod.id}`)
    seen.add(mod.id)
  }

  function getModuleByRoute(route: string): CustodianModule | undefined {
    return modules.find((mod) => mod.route === route)
  }

  function getChildByRoute(route: string): CustodianChildMatch | undefined {
    const [parentRoute, childRoute] = route.split('/')
    if (!parentRoute || !childRoute) return undefined

    const mod = getModuleByRoute(parentRoute)
    const child = mod?.children?.find((c) => c.route === childRoute)
    return mod && child ? { module: mod, child } : undefined
  }

  return {
    modules,
    config,
    getModule: (id) => modules.find((mod) => mod.id === id),
    getModuleByRoute,
    getChildByRoute,
  }
}
