-- Phase 6 follow-up: allow a reviewer to delete their own review.
-- Mirrors blocks_delete's ownership-based DELETE policy from 010_trust.sql.

CREATE POLICY "reviews_delete" ON reviews
  FOR DELETE USING (owns_pet(reviewer_pet_id));
