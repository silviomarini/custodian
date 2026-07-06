'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import type { CustodianConfig, CustodianModuleSummary } from '../types'

export interface AdminLayoutProps {
  modules: CustodianModuleSummary[]
  config: CustodianConfig
  children: ReactNode
}

function initials(label: string): string {
  return label.slice(0, 2).toUpperCase()
}

/**
 * Side nav listing every registered module, plus a content area for the
 * active one.
 *
 * Desktop (>=768px): collapsed to an icon-only rail. A module with children
 * opens a flyout on hover/focus listing them; a module without children
 * navigates directly.
 * Mobile (<768px): nav is an off-canvas drawer opened by a hamburger button,
 * fully expanded (no flyout — there's no room to hide anything).
 *
 * Today only one child exists anywhere (blog's "articoli"), and real
 * per-child routing isn't wired up yet (see CustodianApp.getChildByRoute) —
 * so a child link points at its parent module's own route, which already
 * renders that exact content. This still exercises the full nav markup/CSS
 * for when a module grows a second, genuinely distinct child.
 */
export function AdminLayout({ modules, config, children }: AdminLayoutProps) {
  const pathname = usePathname()
  const basePath = config.basePath ?? '/admin'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  return (
    <div className="custodian-shell">
      <button
        type="button"
        className="custodian-nav-toggle"
        aria-label={mobileNavOpen ? 'Chiudi navigazione' : 'Apri navigazione'}
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen((open) => !open)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {mobileNavOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
        </svg>
      </button>

      <nav className={`custodian-nav${mobileNavOpen ? ' custodian-nav--open' : ''}`}>
        <div className="custodian-brand" title={config.branding?.title ?? 'Admin'}>
          {config.branding?.title ?? 'Admin'}
        </div>

        <ul className="custodian-nav-list">
          {modules.map((mod) => {
            const href = `${basePath}/${mod.route}`
            const active = pathname?.startsWith(href)

            if (!mod.children?.length) {
              return (
                <li key={mod.id} className="custodian-nav-item">
                  <a href={href} title={mod.label} aria-current={active ? 'page' : undefined}>
                    <span className="custodian-nav-icon" aria-hidden="true">
                      {initials(mod.label)}
                    </span>
                    <span className="custodian-nav-label">{mod.label}</span>
                  </a>
                </li>
              )
            }

            return (
              <li key={mod.id} className="custodian-nav-group">
                <a href={href} title={mod.label} aria-current={active ? 'page' : undefined}>
                  <span className="custodian-nav-icon" aria-hidden="true">
                    {initials(mod.label)}
                  </span>
                  <span className="custodian-nav-label">{mod.label}</span>
                </a>
                <ul className="custodian-nav-flyout">
                  {mod.children.map((child) => (
                    <li key={child.id}>
                      <a href={href} aria-current={active ? 'page' : undefined}>
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>

        <ThemeToggle />
      </nav>

      {mobileNavOpen && <div className="custodian-nav-backdrop" onClick={() => setMobileNavOpen(false)} />}

      <main className="custodian-content">{children}</main>
    </div>
  )
}
