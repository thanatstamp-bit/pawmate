CREATE TABLE IF NOT EXISTS public.health_records (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        uuid        NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  type          text        NOT NULL CHECK (type IN ('vaccine','deworm','checkup','other')),
  title         text        NOT NULL,
  record_date   date        NOT NULL,
  next_due_date date,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_records_pet_id ON public.health_records(pet_id);

ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_select" ON public.health_records
  FOR SELECT TO authenticated
  USING (owns_pet(pet_id));

CREATE POLICY "health_insert" ON public.health_records
  FOR INSERT TO authenticated
  WITH CHECK (owns_pet(pet_id));

CREATE POLICY "health_update" ON public.health_records
  FOR UPDATE TO authenticated
  USING (owns_pet(pet_id));

CREATE POLICY "health_delete" ON public.health_records
  FOR DELETE TO authenticated
  USING (owns_pet(pet_id));
