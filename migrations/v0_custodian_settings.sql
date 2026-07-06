-- v0: Custodian branding settings — a single row per project.
-- Run manually in your Supabase SQL Editor.

CREATE TABLE custodian_settings (
  id           INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces a single row
  accent_color TEXT NOT NULL DEFAULT '#3D4759',
  logo_url     TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
