-- Demo match helper — lets the frontend force a mutual match for demo purposes.
-- Uses SECURITY DEFINER so it can insert a reverse like on behalf of the other pet,
-- bypassing RLS. The safety check (owns_pet) ensures only the owner of p_from_pet
-- can call this.
--
-- Returns: the match UUID (existing or newly created)

CREATE OR REPLACE FUNCTION create_demo_match(
  p_from_pet uuid,
  p_to_pet   uuid,
  p_mode     text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id uuid;
  v_pet_a    uuid;
  v_pet_b    uuid;
BEGIN
  -- Safety: caller must own p_from_pet
  IF NOT owns_pet(p_from_pet) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Ensure forward like exists
  INSERT INTO likes (from_pet_id, to_pet_id, mode)
  VALUES (p_from_pet, p_to_pet, p_mode)
  ON CONFLICT (from_pet_id, to_pet_id, mode) DO NOTHING;

  -- Insert reverse like as the other pet (SECURITY DEFINER bypasses RLS)
  INSERT INTO likes (from_pet_id, to_pet_id, mode)
  VALUES (p_to_pet, p_from_pet, p_mode)
  ON CONFLICT (from_pet_id, to_pet_id, mode) DO NOTHING;

  -- Sort IDs so pet_a_id < pet_b_id (consistency rule from 001_init.sql)
  v_pet_a := LEAST(p_from_pet, p_to_pet);
  v_pet_b := GREATEST(p_from_pet, p_to_pet);

  -- Return existing match if already created, otherwise insert
  SELECT id INTO v_match_id
  FROM matches
  WHERE pet_a_id = v_pet_a AND pet_b_id = v_pet_b AND mode = p_mode;

  IF NOT FOUND THEN
    INSERT INTO matches (pet_a_id, pet_b_id, mode)
    VALUES (v_pet_a, v_pet_b, p_mode)
    RETURNING id INTO v_match_id;
  END IF;

  RETURN v_match_id;
END;
$$;
