-- Phase 8: Lost Pet Board
-- Public SELECT (anon role) is intentional — the /lost/[id] share page must
-- work without a session (no auth required) for LINE/Facebook link previews.

CREATE TABLE IF NOT EXISTS public.lost_pets (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_name             text        NOT NULL,
  species              text        NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  breed                text        NOT NULL DEFAULT '',
  photos               text[]      NOT NULL DEFAULT '{}',
  last_seen_province   text        NOT NULL,
  last_seen_district   text        NOT NULL,
  last_seen_detail     text,
  lost_date            date        NOT NULL,
  distinguishing_marks text,
  contact              text        NOT NULL,
  reward               text,
  status               text        NOT NULL DEFAULT 'lost' CHECK (status IN ('lost', 'found')),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lost_pets_reporter   ON public.lost_pets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_lost_pets_status     ON public.lost_pets(status);
CREATE INDEX IF NOT EXISTS idx_lost_pets_province   ON public.lost_pets(last_seen_province);
CREATE INDEX IF NOT EXISTS idx_lost_pets_created_at ON public.lost_pets(created_at DESC);

CREATE TABLE IF NOT EXISTS public.lost_pet_sightings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_pet_id      uuid        NOT NULL REFERENCES public.lost_pets(id) ON DELETE CASCADE,
  reporter_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  detail           text        NOT NULL,
  seen_at_location text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sightings_lost_pet_id ON public.lost_pet_sightings(lost_pet_id);

ALTER TABLE public.lost_pets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_pet_sightings ENABLE ROW LEVEL SECURITY;

-- Omit TO authenticated — anon role must be able to SELECT for the public share page
CREATE POLICY "lost_pets_select_public"
  ON public.lost_pets FOR SELECT USING (true);
CREATE POLICY "lost_pets_insert"
  ON public.lost_pets FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "lost_pets_update"
  ON public.lost_pets FOR UPDATE TO authenticated
  USING (reporter_id = auth.uid());
CREATE POLICY "lost_pets_delete"
  ON public.lost_pets FOR DELETE TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "sightings_select_public"
  ON public.lost_pet_sightings FOR SELECT USING (true);
CREATE POLICY "sightings_insert"
  ON public.lost_pet_sightings FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
-- No UPDATE/DELETE on sightings (immutable community tips)
