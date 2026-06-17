-- Phase 7: Care Hub — Vet Hospital Finder
-- hospitals: read-only reference data, seeded via scripts/seed-hospitals.ts

CREATE TABLE IF NOT EXISTS hospitals (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  province   text        NOT NULL,
  district   text,
  address    text,
  phone      text,
  lat        float8      NOT NULL,
  lng        float8      NOT NULL,
  open_24h   boolean     NOT NULL DEFAULT false,
  services   text[]      NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_province ON hospitals(province);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Public reference data — readable by anyone, no user writes.
CREATE POLICY "hospitals_read" ON hospitals
  FOR SELECT USING (true);
