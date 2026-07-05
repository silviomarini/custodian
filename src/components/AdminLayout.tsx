'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { CustodianConfig, CustodianModuleSummary } from '../types'

export interface AdminLayoutProps {
  modules: CustodianModuleSummary[]
  config: CustodianConfig
  children: ReactNode
}

/** Side nav listing every registered module, plus a content area for the active one. */
export function AdminLayout({ modules, config, children }: AdminLayoutProps) {
  const pathname = usePathname()
  const basePath = config.basePath ?? '/admin'

  return (
    <div className="custodian-shell">
      <nav className="custodian-nav">
        <div className="custodian-brand">{config.branding?.title ?? 'Admin'}</div>
        <ul>
          {modules.map((mod) => {
            const href = `${basePath}/${mod.route}`
            const active = pathname?.startsWith(href)
            return (
              <li key={mod.id}>
                <a href={href} aria-current={active ? 'page' : undefined}>
                  {mod.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
      <main className="custodian-content">{children}</main>
    </div>
  )
}
