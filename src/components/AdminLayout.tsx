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

const NAV_COLLAPSED_KEY = 'custodian-nav-collapsed'

function initials(label: string): string {
  return label.slice(0, 2).toUpperCase()
}

/**
 * Side nav: a hardcoded "Dashboard" entry (pointing at basePath itself,
 * never a consumer-registered CustodianModule) followed by every registered
 * module.
 *
 * Mobile (<768px): unchanged — off-canvas drawer opened by the hamburger
 * button, fully expanded (labels + children always visible, no accordion —
 * there's no room to hide anything).
 *
 * Desktop (>=768px): two states, toggled by the hamburger button inside the
 * sidebar and persisted to localStorage (NAV_COLLAPSED_KEY), same pattern as
 * theme persistence:
 *   - Expanded (default): icon + full label. A module with children is a
 *     collapsible section — closed (only its own title shown) unless the
 *     current pathname is inside that section, in which case it auto-opens
 *     to reveal its children indented below. No manual per-section toggle.
 *   - Collapsed: icons only, no labels, no children (nothing to expand into —
 *     the old hover flyout is gone; expand the sidebar first to reach them).
 */
export function AdminLayout({ modules, config, children }: AdminLayoutProps) {
  const pathname = usePathname()
  const basePath = config.basePath ?? '/admin'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    setCollapsed(localStorage.getItem(NAV_COLLAPSED_KEY) === 'true')
  }, [])

  function toggleCollapsed() {
    setCollapsed((wasCollapsed) => {
      const next = !wasCollapsed
      localStorage.setItem(NAV_COLLAPSED_KEY, String(next))
      return next
    })
  }

  const dashboardActive = pathname === basePath
  const navClassName = [
    'custodian-nav',
    mobileNavOpen && 'custodian-nav--open',
    collapsed && 'custodian-nav--collapsed',
  ]
    .filter(Boolean)
    .join(' ')

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

      <nav className={navClassName}>
        <div className="custodian-nav-header">
          <div className="custodian-brand" title={config.branding?.title ?? 'Admin'}>
            {config.branding?.title ?? 'Admin'}
          </div>
          <button
            type="button"
            className="custodian-nav-collapse-toggle"
            aria-label={collapsed ? 'Espandi navigazione' : 'Comprimi navigazione'}
            aria-pressed={collapsed}
            onClick={toggleCollapsed}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>

        <ul className="custodian-nav-list">
          <li className="custodian-nav-item">
            <a href={basePath} title="Dashboard" aria-current={dashboardActive ? 'page' : undefined}>
              <span className="custodian-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l9-8 9 8" />
                  <path d="M5 10v10h14V10" />
                </svg>
              </span>
              <span className="custodian-nav-label">Dashboard</span>
            </a>
          </li>

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
              <li key={mod.id} className={`custodian-nav-group${active ? ' custodian-nav-group--open' : ''}`}>
                <a href={href} title={mod.label} aria-current={active ? 'page' : undefined}>
                  <span className="custodian-nav-icon" aria-hidden="true">
                    {initials(mod.label)}
                  </span>
                  <span className="custodian-nav-label">{mod.label}</span>
                </a>
                <ul className="custodian-nav-children">
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
