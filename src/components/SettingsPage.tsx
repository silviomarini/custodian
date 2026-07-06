'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, DragEvent } from 'react'
import type { CustodianConfig } from '../types'

export interface SettingsPageProps {
  config: CustodianConfig
  /** REST endpoint for GET/PATCH branding settings. Default: '/api/settings'. */
  apiBasePath?: string
  /** REST endpoint the logo upload POSTs to. Default: '/api/settings/logo'. */
  logoApiBasePath?: string
}

interface SettingsResponse {
  accent_color: string
  logo_url: string | null
}

type Status = { type: 'idle' | 'saving' | 'success' | 'error'; message?: string }

const PRESET_COLORS = [
  { label: 'Grafite', hex: '#3D4759' },
  { label: 'Verde', hex: '#3B6D11' },
  { label: 'Terracotta', hex: '#993C1D' },
  { label: 'Blu', hex: '#185FA5' },
]

const ALLOWED_LOGO_TYPES = ['image/png', 'image/svg+xml']
const SUCCESS_RESET_DELAY_MS = 3000

/**
 * Branding settings page: logo upload, accent color, live preview, explicit
 * save. Everything here is local React state until "Salva impostazioni" is
 * clicked — the live preview never touches the saved row.
 */
export function SettingsPage({ config, apiBasePath = '/api/settings', logoApiBasePath = '/api/settings/logo' }: SettingsPageProps) {
  const [accentColor, setAccentColor] = useState(config.branding?.accentColor ?? PRESET_COLORS[0].hex)
  const [logoUrl, setLogoUrl] = useState<string | null>(config.branding?.logoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-populate from whatever's already saved, if anything — falls back to
  // the static config values above until this resolves.
  useEffect(() => {
    let cancelled = false

    fetch(apiBasePath)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: SettingsResponse } | null) => {
        if (cancelled || !json?.data) return
        setAccentColor(json.data.accent_color)
        setLogoUrl(json.data.logo_url)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [apiBasePath])

  async function uploadLogo(file: File) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setStatus({ type: 'error', message: 'Formato non supportato: usa PNG o SVG.' })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(logoApiBasePath, { method: 'POST', body: formData })
      const json = await res.json().catch(() => ({}) as { error?: string; data?: { logo_url: string } })

      if (!res.ok) {
        setStatus({ type: 'error', message: json.error ?? 'Caricamento logo fallito.' })
        return
      }

      setLogoUrl(json.data!.logo_url)
    } catch {
      setStatus({ type: 'error', message: 'Caricamento logo fallito.' })
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadLogo(file)
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadLogo(file)
  }

  async function handleSave() {
    setStatus({ type: 'saving' })

    try {
      const res = await fetch(apiBasePath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accent_color: accentColor, logo_url: logoUrl }),
      })
      const json = await res.json().catch(() => ({}) as { error?: string })

      if (!res.ok) {
        setStatus({ type: 'error', message: json.error ?? 'Salvataggio fallito.' })
        return
      }

      setStatus({ type: 'success', message: 'Impostazioni salvate.' })
      setTimeout(() => setStatus({ type: 'idle' }), SUCCESS_RESET_DELAY_MS)
    } catch {
      setStatus({ type: 'error', message: 'Salvataggio fallito.' })
    }
  }

  const isPresetColor = PRESET_COLORS.some((preset) => preset.hex.toLowerCase() === accentColor.toLowerCase())
  const brandTitle = config.branding?.title ?? 'Admin'

  return (
    <div className="custodian-settings-page">
      <h1>Impostazioni</h1>

      <section className="custodian-settings-section">
        <h2>Logo</h2>
        <div
          className={`custodian-dropzone${isDragging ? ' custodian-dropzone--active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml" onChange={handleFileInputChange} />
          <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
          <p>Trascina un&apos;immagine o scegli un file</p>
          <p className="custodian-dropzone-hint">
            {uploading ? 'Caricamento in corso…' : 'PNG o SVG, sfondo trasparente consigliato'}
          </p>
        </div>
      </section>

      <section className="custodian-settings-section">
        <h2>Colore del brand</h2>
        <div className="custodian-color-swatches">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              className={`custodian-swatch${accentColor.toLowerCase() === preset.hex.toLowerCase() ? ' custodian-swatch--selected' : ''}`}
              style={{ '--swatch-color': preset.hex } as CSSProperties}
              aria-label={preset.label}
              aria-pressed={accentColor.toLowerCase() === preset.hex.toLowerCase()}
              onClick={() => setAccentColor(preset.hex)}
            />
          ))}

          <label
            className={`custodian-swatch custodian-swatch--custom${!isPresetColor ? ' custodian-swatch--selected' : ''}`}
            aria-label="Colore personalizzato"
          >
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
            <span aria-hidden="true">+</span>
          </label>
        </div>
      </section>

      <section className="custodian-settings-section">
        <h2>Anteprima</h2>
        <div className="custodian-tile custodian-settings-preview" style={{ '--custodian-accent': accentColor } as CSSProperties}>
          <div className="custodian-settings-preview-brand">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="custodian-settings-preview-logo" />
            ) : (
              <span className="custodian-nav-icon" aria-hidden="true">
                {brandTitle.slice(0, 2).toUpperCase()}
              </span>
            )}
            <strong>{brandTitle}</strong>
          </div>
          <span className="custodian-tag custodian-settings-preview-tag">Esempio</span>
        </div>
      </section>

      {status.type === 'saving' && (
        <p role="status" className="custodian-banner custodian-banner--info">
          <svg aria-hidden="true" className="custodian-spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-9-9" />
          </svg>
          <span>Salvataggio in corso…</span>
        </p>
      )}

      {status.type === 'success' && (
        <p role="status" className="custodian-banner custodian-banner--success">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>{status.message}</span>
        </p>
      )}

      {status.type === 'error' && (
        <p role="alert" className="custodian-banner custodian-banner--danger">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{status.message}</span>
        </p>
      )}

      <button type="button" className="custodian-settings-save" onClick={handleSave} disabled={status.type === 'saving'}>
        Salva impostazioni
      </button>
    </div>
  )
}
