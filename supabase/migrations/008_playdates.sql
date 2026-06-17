-- Phase: Playdate Scheduling
-- playdate_spots: seeded reference data for pet-friendly venues
-- playdate_proposals: scheduling proposals between matched pets (one active per match)
-- Relies on is_in_match() and owns_pet() helpers defined in 001_init.sql

CREATE TABLE IF NOT EXISTS playdate_spots (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('park','cafe','beach','resort','other')),
  province    text        NOT NULL,
  district    text,
  address     text,
  description text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playdate_proposals (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          uuid        NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  proposer_pet_id   uuid        NOT NULL REFERENCES pets(id)     ON DELETE CASCADE,
  proposed_at       timestamptz NOT NULL,
  spot_id           uuid        REFERENCES playdate_spots(id),
  custom_location   text,        -- filled when user types their own venue
  note              text,
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_match_id ON playdate_proposals(match_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status   ON playdate_proposals(status);

-- RLS ─────────────────────────────────────────────────────────────────────────

ALTER TABLE playdate_spots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE playdate_proposals ENABLE ROW LEVEL SECURITY;

-- Spots are public read-only reference data
CREATE POLICY "spots_read" ON playdate_spots
  FOR SELECT USING (true);

-- Proposals: only the two match participants can see/create/update
CREATE POLICY "proposals_read" ON playdate_proposals
  FOR SELECT USING (is_in_match(match_id));

CREATE POLICY "proposals_insert" ON playdate_proposals
  FOR INSERT WITH CHECK (
    is_in_match(match_id) AND owns_pet(proposer_pet_id)
  );

-- Both sides can update (accept / decline / cancel)
CREATE POLICY "proposals_update" ON playdate_proposals
  FOR UPDATE USING (is_in_match(match_id));
