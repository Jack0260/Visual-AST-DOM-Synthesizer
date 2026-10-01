/*
# Switch increment_patch_count to SECURITY INVOKER

## Overview
The `increment_patch_count` function was SECURITY DEFINER, which triggers
security advisor warnings because it's callable by the anon role. Since
the anon role already has UPDATE privileges on `vads_sessions` through
RLS policies (single-tenant app, intentionally public), we can safely
switch to SECURITY INVOKER without losing functionality.

## Changes
- `increment_patch_count` changed from SECURITY DEFINER to SECURITY INVOKER.
- search_path kept as public.
*/

CREATE OR REPLACE FUNCTION increment_patch_count(session_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE vads_sessions
  SET total_patches = total_patches + 1,
      updated_at = now()
  WHERE id = session_id
  RETURNING total_patches INTO new_count;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_patch_count(uuid) TO anon, authenticated;
