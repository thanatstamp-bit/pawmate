CREATE TABLE vet_bookings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vet_id     text NOT NULL,
  slot_time  timestamptz NOT NULL,
  topic      text NOT NULL,
  status     text NOT NULL DEFAULT 'upcoming'
               CHECK (status IN ('upcoming', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vet_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vet_bookings_select" ON vet_bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "vet_bookings_insert" ON vet_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "vet_bookings_update" ON vet_bookings
  FOR UPDATE USING (user_id = auth.uid());
