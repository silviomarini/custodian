'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import type { CustodianConfig, CustodianModuleSummary } from '../types'

export interface AdminLayoutProps {
  modules: CustodianModuleSummary[]
  config: CustodianConfig
  /** GET here for live-saved branding settings. Default: '/api/settings'. Ignored when resolvedAccentColor is provided. */
  settingsApiBasePath?: string
  /**
   * Server-resolved accent color, passed by a consumer's async layout.tsx
   * that already called getSettings(db) itself. When present, this is used
   * directly and the client-side settings fetch below never runs — no flash
   * of the fallback color on first paint.
   */
  resolvedAccentColor?: string
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
 *
 * Accent color precedence: resolvedAccentColor (server-resolved by the
 * consumer's layout.tsx) > a value fetched client-side from
 * settingsApiBasePath (only when resolvedAccentColor wasn't provided) >
 * config.branding.accentColor. The static config value is only ever a
 * fallback for first-time setup, before anything's been saved.
 */
export function AdminLayout({
  modules,
  config,
  settingsApiBasePath = '/api/settings',
  resolvedAccentColor,
  children,
}: AdminLayoutProps) {
  const pathname = usePathname()
  const basePath = config.basePath ?? '/admin'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [savedAccentColor, setSavedAccentColor] = useState<string | null>(null)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    setCollapsed(localStorage.getItem(NAV_COLLAPSED_KEY) === 'true')
  }, [])

  useEffect(() => {
    // Already resolved server-side — skip the fetch entirely, no flash.
    if (resolvedAccentColor) return

    let cancelled = false

    fetch(settingsApiBasePath)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: { accent_color?: string } } | null) => {
        if (!cancelled && json?.data?.accent_color) setSavedAccentColor(json.data.accent_color)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [settingsApiBasePath, resolvedAccentColor])

  const accentColor = resolvedAccentColor ?? savedAccentColor ?? config.branding?.accentColor
  const shellStyle = accentColor ? ({ '--custodian-accent': accentColor } as CSSProperties) : undefined

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
    <div className="custodian-shell" style={shellStyle}>
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

          <li className="custodian-nav-item">
            <a
              href={`${basePath}/settings`}
              title="Impostazioni"
              aria-current={pathname === `${basePath}/settings` ? 'page' : undefined}
            >
              <span className="custodian-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </span>
              <span className="custodian-nav-label">Impostazioni</span>
            </a>
          </li>
        </ul>

        <ThemeToggle />
      </nav>

      {mobileNavOpen && <div className="custodian-nav-backdrop" onClick={() => setMobileNavOpen(false)} />}

      <main className="custodian-content">{children}</main>
    </div>
  )
}
