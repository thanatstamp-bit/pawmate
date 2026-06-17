-- Phase 9: Blood Donation Center
-- Tables: blood_donors, blood_requests, blood_responses
-- Run AFTER 013_lost_pets.sql

CREATE TABLE IF NOT EXISTS public.blood_donors (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id               uuid        NOT NULL UNIQUE REFERENCES public.pets(id) ON DELETE CASCADE,
  blood_type           text        NOT NULL,
  weight_kg            numeric     NOT NULL,
  eligible             bool        NOT NULL DEFAULT false,
  available            bool        NOT NULL DEFAULT true,
  last_donation_date   date,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blood_requests (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  species              text        NOT NULL CHECK (species IN ('dog', 'cat')),
  blood_type_needed    text        NOT NULL,
  urgency              text        NOT NULL DEFAULT 'normal' CHECK (urgency IN ('urgent', 'normal')),
  hospital_name        text        NOT NULL,
  province             text        NOT NULL,
  details              text        NOT NULL DEFAULT '',
  contact              text        NOT NULL,
  status               text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fulfilled')),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blood_responses (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id           uuid        NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_pet_id         uuid        NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  message              text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, donor_pet_id)
);

CREATE INDEX IF NOT EXISTS idx_blood_donors_pet_id        ON public.blood_donors(pet_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status      ON public.blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created_at  ON public.blood_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_responses_request_id ON public.blood_responses(request_id);

ALTER TABLE public.blood_donors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_responses ENABLE ROW LEVEL SECURITY;

-- blood_donors: authenticated users can read all; only pet owner can write
CREATE POLICY "blood_donors_select" ON public.blood_donors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "blood_donors_insert" ON public.blood_donors
  FOR INSERT TO authenticated WITH CHECK (owns_pet(pet_id));
CREATE POLICY "blood_donors_update" ON public.blood_donors
  FOR UPDATE TO authenticated USING (owns_pet(pet_id));
CREATE POLICY "blood_donors_delete" ON public.blood_donors
  FOR DELETE TO authenticated USING (owns_pet(pet_id));

-- blood_requests: authenticated users can read all; only requester can write/update
CREATE POLICY "blood_requests_select" ON public.blood_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "blood_requests_insert" ON public.blood_requests
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "blood_requests_update" ON public.blood_requests
  FOR UPDATE TO authenticated USING (requester_id = auth.uid());

-- blood_responses: only the donor owner OR the request owner can read
-- (contact info is sensitive — hide from random users)
CREATE POLICY "blood_responses_select" ON public.blood_responses
  FOR SELECT TO authenticated USING (
    owns_pet(donor_pet_id)
    OR EXISTS (
      SELECT 1 FROM public.blood_requests r
      WHERE r.id = request_id AND r.requester_id = auth.uid()
    )
  );
CREATE POLICY "blood_responses_insert" ON public.blood_responses
  FOR INSERT TO authenticated WITH CHECK (owns_pet(donor_pet_id));
