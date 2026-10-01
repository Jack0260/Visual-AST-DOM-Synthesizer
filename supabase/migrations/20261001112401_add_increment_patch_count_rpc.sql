/*
# Add increment_patch_count RPC

## Overview
Creates a SECURITY DEFINER function to atomically increment the total_patches
counter on a vads_sessions row. This avoids race conditions from read-then-write.

## New Functions
- `increment_patch_count(session_id uuid)` — atomically increments total_patches
  by 1 and updates the updated_at timestamp. Returns the new count.

## Security
- SECURITY DEFINER so it can update the row regardless of RLS context.
- Callable by anon and authenticated roles (single-tenant app, no sign-in).
*/

CREATE OR REPLACE FUNCTION increment_patch_count(session_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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
