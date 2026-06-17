-- Phase 6: Trust Layer
-- reviews: post-meetup ratings between matched pets (one per match per reviewer)
-- reports: user reports against a pet (reporter sees only their own)
-- blocks:  one pet blocks another; hides both from each other's feed/matches
-- Relies on owns_pet() and is_in_match() helpers defined in 001_init.sql

CREATE TABLE IF NOT EXISTS reviews (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         uuid        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_pet_id  uuid        NOT NULL REFERENCES pets(id)    ON DELETE CASCADE,
  reviewed_pet_id  uuid        NOT NULL REFERENCES pets(id)    ON DELETE CASCADE,
  rating           int         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags             text[]      NOT NULL DEFAULT '{}',
  comment          text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_unique UNIQUE (match_id, reviewer_pet_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_pet_id);

CREATE TABLE IF NOT EXISTS reports (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_pet_id  uuid        NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  reported_pet_id  uuid        NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  reason           text        NOT NULL,
  details          text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_pet_id   uuid        NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  blocked_pet_id   uuid        NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocks_unique UNIQUE (blocker_pet_id, blocked_pet_id),
  CONSTRAINT blocks_no_self CHECK (blocker_pet_id <> blocked_pet_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_pet_id);

-- RLS ─────────────────────────────────────────────────────────────────────────

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks  ENABLE ROW LEVEL SECURITY;

-- Reviews are readable by any signed-in user (ratings show on swipe cards).
CREATE POLICY "reviews_read" ON reviews
  FOR SELECT TO authenticated USING (true);

-- Only a match participant may review, and only on behalf of their own pet.
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (
    owns_pet(reviewer_pet_id) AND is_in_match(match_id)
  );

-- A reviewer can edit their own review.
CREATE POLICY "reviews_update" ON reviews
  FOR UPDATE USING (owns_pet(reviewer_pet_id));

-- Reports: a user creates and sees only reports filed by their own pet.
CREATE POLICY "reports_insert" ON reports
  FOR INSERT WITH CHECK (owns_pet(reporter_pet_id));

CREATE POLICY "reports_read" ON reports
  FOR SELECT USING (owns_pet(reporter_pet_id));

-- Blocks: visible to whoever owns either side, so the filter helper can read
-- blocks in both directions. Only the blocker can create or remove a block.
CREATE POLICY "blocks_read" ON blocks
  FOR SELECT USING (owns_pet(blocker_pet_id) OR owns_pet(blocked_pet_id));

CREATE POLICY "blocks_insert" ON blocks
  FOR INSERT WITH CHECK (owns_pet(blocker_pet_id));

CREATE POLICY "blocks_delete" ON blocks
  FOR DELETE USING (owns_pet(blocker_pet_id));
