export type CustodianThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'custodian-theme'
const THEME_ATTR = 'data-custodian-theme'

function resolveTheme(preference: CustodianThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(preference: CustodianThemePreference): void {
  document.documentElement.setAttribute(THEME_ATTR, resolveTheme(preference))
}

/**
 * Reads the saved preference (default: 'system') and applies it to <html>.
 * Client-only — call from a 'use client' component's effect, not during SSR.
 * For the very first paint, prefer injecting THEME_INIT_SCRIPT instead, so
 * the theme is set before hydration and there's no flash of the wrong theme.
 */
export function initTheme(): void {
  const stored = (localStorage.getItem(STORAGE_KEY) as CustodianThemePreference | null) ?? 'system'
  applyTheme(stored)
}

/** Flips between light/dark, persists the choice, and re-applies it. */
export function toggleTheme(): void {
  const current = document.documentElement.getAttribute(THEME_ATTR) === 'dark' ? 'dark' : 'light'
  const next: CustodianThemePreference = current === 'dark' ? 'light' : 'dark'
  localStorage.setItem(STORAGE_KEY, next)
  applyTheme(next)
}

/**
 * Inline script source for the consumer's <head>, before hydration, so
 * data-custodian-theme is set on first paint and there's no flash of the
 * wrong theme. Usage in app/layout.tsx:
 *   <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}')||'system';var d=s==='dark'||(s==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('${THEME_ATTR}',d?'dark':'light');}catch(e){}})();`
