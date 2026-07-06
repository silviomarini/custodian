'use client'

import { toggleTheme } from '../theme'

export interface ThemeToggleProps {
  className?: string
}

/**
 * Sun/moon icon button that flips the theme via toggleTheme(). Meant to sit
 * at the bottom of the sidebar nav (see .custodian-theme-toggle in
 * styles.css). Icon visibility is driven purely by CSS off the
 * data-custodian-theme attribute, so no local state/re-render is needed here.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambia tema"
      className={['custodian-theme-toggle', className].filter(Boolean).join(' ')}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="custodian-theme-toggle-sun"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="custodian-theme-toggle-moon"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}
