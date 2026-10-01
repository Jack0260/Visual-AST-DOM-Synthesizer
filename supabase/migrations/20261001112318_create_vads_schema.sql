/*
# Visual AST DOM Synthesizer — Core Schema

## Overview
Creates the database tables for the Visual AST DOM Synthesizer developer tool.
This is a single-tenant app with no sign-in screen, so all tables are
publicly accessible to the anon and authenticated roles.

## New Tables

### 1. `vads_sessions`
Stores a workspace session — the top-level container for a debugging/patching session.
- `id` (uuid, PK) — unique session identifier
- `name` (text) — optional human-readable session name
- `theme_mode` (text) — persisted theme preference ('dark', 'light', 'system')
- `total_patches` (int) — running count of patches applied in this session
- `created_at` (timestamptz) — when the session was created
- `updated_at` (timestamptz) — last activity timestamp

### 2. `vads_patch_history`
Stores individual patch entries within a session. Each row is one applied patch.
- `id` (uuid, PK) — unique patch entry ID
- `session_id` (uuid, FK → vads_sessions) — which session this patch belongs to
- `scenario_id` (text) — the scenario that was applied (e.g. 'add_onclick')
- `scenario_name` (text) — human-readable scenario name
- `latency_ms` (numeric) — measured patch latency in milliseconds
- `changes_count` (int) — number of AST changes produced
- `diff_summary` (jsonb) — array of diff entries (added/removed/modified/unchanged)
- `ast_snapshot` (jsonb) — full AST tree state after this patch was applied
- `created_at` (timestamptz) — when the patch was applied

### 3. `vads_snapshots`
Stores named AST snapshots that a user can save and revisit.
- `id` (uuid, PK) — unique snapshot ID
- `session_id` (uuid, FK → vads_sessions) — which session this snapshot belongs to
- `name` (text) — user-given name for the snapshot
- `description` (text) — optional description
- `ast_data` (jsonb) — full AST tree at the saved point
- `node_count` (int) — total node count at snapshot time
- `created_at` (timestamptz) — when the snapshot was saved

## Security
- RLS enabled on all three tables.
- All tables use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant app with no sign-in — the data is intentionally
  shared and the anon-key client must be able to read and write.

## Important Notes
1. Foreign keys cascade on delete: removing a session removes its patches and snapshots.
2. `vads_patch_history.ast_snapshot` stores the complete AST as JSONB so any past
   state can be fully restored without recomputing patches.
3. Indexes added on `session_id` for efficient joins on child tables.
*/

-- 1. Sessions table
CREATE TABLE IF NOT EXISTS vads_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  theme_mode text NOT NULL DEFAULT 'dark',
  total_patches int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vads_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON vads_sessions;
CREATE POLICY "anon_select_sessions" ON vads_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON vads_sessions;
CREATE POLICY "anon_insert_sessions" ON vads_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON vads_sessions;
CREATE POLICY "anon_update_sessions" ON vads_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON vads_sessions;
CREATE POLICY "anon_delete_sessions" ON vads_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- 2. Patch history table
CREATE TABLE IF NOT EXISTS vads_patch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES vads_sessions(id) ON DELETE CASCADE,
  scenario_id text NOT NULL,
  scenario_name text NOT NULL,
  latency_ms numeric NOT NULL DEFAULT 0,
  changes_count int NOT NULL DEFAULT 0,
  diff_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  ast_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vads_patch_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_patches" ON vads_patch_history;
CREATE POLICY "anon_select_patches" ON vads_patch_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_patches" ON vads_patch_history;
CREATE POLICY "anon_insert_patches" ON vads_patch_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_patches" ON vads_patch_history;
CREATE POLICY "anon_update_patches" ON vads_patch_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_patches" ON vads_patch_history;
CREATE POLICY "anon_delete_patches" ON vads_patch_history FOR DELETE
  TO anon, authenticated USING (true);

-- 3. Snapshots table
CREATE TABLE IF NOT EXISTS vads_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES vads_sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  ast_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  node_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vads_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_snapshots" ON vads_snapshots;
CREATE POLICY "anon_select_snapshots" ON vads_snapshots FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_snapshots" ON vads_snapshots;
CREATE POLICY "anon_insert_snapshots" ON vads_snapshots FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_snapshots" ON vads_snapshots;
CREATE POLICY "anon_update_snapshots" ON vads_snapshots FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_snapshots" ON vads_snapshots;
CREATE POLICY "anon_delete_snapshots" ON vads_snapshots FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_patch_history_session_id ON vads_patch_history(session_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_session_id ON vads_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_patch_history_created_at ON vads_patch_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON vads_snapshots(created_at DESC);
