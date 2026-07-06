// Structural match of the Supabase client's query surface — same
// dependency-injection pattern used everywhere in this package (e.g.
// modules/blog's BlogDb): the caller passes their own client, this file
// never creates one itself.
type Db = { from: (table: string) => any } // eslint-disable-line @typescript-eslint/no-explicit-any

/** Branding settings — a single row per project (id is always 1). */
export interface CustodianSettings {
  id: number
  accent_color: string
  logo_url: string | null
  updated_at: string
}

/** Reads the single settings row. Returns null if it doesn't exist yet (first-time setup). */
export async function getSettings(db: Db): Promise<CustodianSettings | null> {
  const { data } = await db.from('custodian_settings').select('*').eq('id', 1).single()
  return (data as CustodianSettings) ?? null
}

/** Upserts onto the fixed row (id 1) — creates it on first call, updates it after. */
export async function updateSettings(db: Db, patch: Partial<CustodianSettings>): Promise<CustodianSettings> {
  const update: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() }

  if (patch.accent_color) update.accent_color = patch.accent_color
  if ('logo_url' in patch) update.logo_url = patch.logo_url ?? null

  const { data, error } = await db.from('custodian_settings').upsert(update).select('*').single()
  if (error) throw new Error(error.message)
  return data as CustodianSettings
}
