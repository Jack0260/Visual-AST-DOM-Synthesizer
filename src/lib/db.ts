import { supabase } from '@/lib/supabase';
import type { ASTNode, DiffEntry, ThemeMode, PatchHistoryEntry } from '@/ast/types';
import { countNodes } from '@/ast/utils';

export interface SessionRecord {
  id: string;
  name: string | null;
  theme_mode: string;
  total_patches: number;
  created_at: string;
  updated_at: string;
}

export interface PatchHistoryRecord {
  id: string;
  session_id: string;
  scenario_id: string;
  scenario_name: string;
  latency_ms: number;
  changes_count: number;
  diff_summary: DiffEntry[];
  ast_snapshot: ASTNode;
  created_at: string;
}

export interface SnapshotRecord {
  id: string;
  session_id: string;
  name: string;
  description: string | null;
  ast_data: ASTNode;
  node_count: number;
  created_at: string;
}

export async function createSession(themeMode: ThemeMode): Promise<SessionRecord | null> {
  const { data, error } = await supabase
    .from('vads_sessions')
    .insert({ theme_mode: themeMode })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Failed to create session:', error.message);
    return null;
  }
  return data as SessionRecord;
}

export async function loadLatestSession(): Promise<SessionRecord | null> {
  const { data, error } = await supabase
    .from('vads_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to load session:', error.message);
    return null;
  }
  return data as SessionRecord;
}

export async function updateSessionTheme(sessionId: string, themeMode: ThemeMode): Promise<void> {
  const { error } = await supabase
    .from('vads_sessions')
    .update({ theme_mode: themeMode, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update session theme:', error.message);
  }
}

export async function incrementSessionPatches(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_patch_count', { session_id: sessionId });
  if (error) {
    // Fallback: read and update manually
    const { data } = await supabase
      .from('vads_sessions')
      .select('total_patches')
      .eq('id', sessionId)
      .maybeSingle();
    if (data) {
      await supabase
        .from('vads_sessions')
        .update({
          total_patches: (data.total_patches as number) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }
  }
}

export async function savePatchToHistory(
  sessionId: string,
  entry: PatchHistoryEntry,
  astSnapshot: ASTNode,
): Promise<PatchHistoryRecord | null> {
  const { data, error } = await supabase
    .from('vads_patch_history')
    .insert({
      session_id: sessionId,
      scenario_id: entry.scenarioId,
      scenario_name: entry.scenarioName,
      latency_ms: entry.latencyMs,
      changes_count: entry.changesCount,
      diff_summary: entry.diffSummary,
      ast_snapshot: astSnapshot,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Failed to save patch history:', error.message);
    return null;
  }

  await incrementSessionPatches(sessionId);
  return data as PatchHistoryRecord;
}

export async function loadPatchHistory(sessionId: string): Promise<PatchHistoryRecord[]> {
  const { data, error } = await supabase
    .from('vads_patch_history')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load patch history:', error.message);
    return [];
  }
  return (data as PatchHistoryRecord[]) ?? [];
}

export async function deletePatchHistory(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('vads_patch_history')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    console.error('Failed to delete patch history:', error.message);
  }

  await supabase
    .from('vads_sessions')
    .update({ total_patches: 0, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

export async function revertToPatchIndex(
  sessionId: string,
  index: number,
): Promise<{ ast: ASTNode | null; remaining: PatchHistoryRecord[] }> {
  const allHistory = await loadPatchHistory(sessionId);
  if (index < 0 || index >= allHistory.length) {
    return { ast: null, remaining: [] };
  }

  const targetPatch = allHistory[index];

  const patchesToDelete = allHistory.slice(index + 1);
  if (patchesToDelete.length > 0) {
    await supabase
      .from('vads_patch_history')
      .delete()
      .in(
        'id',
        patchesToDelete.map((p) => p.id),
      );
  }

  await supabase
    .from('vads_sessions')
    .update({
      total_patches: index + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  return {
    ast: targetPatch.ast_snapshot,
    remaining: allHistory.slice(0, index + 1),
  };
}

export async function saveSnapshot(
  sessionId: string,
  name: string,
  description: string,
  ast: ASTNode,
): Promise<SnapshotRecord | null> {
  const { data, error } = await supabase
    .from('vads_snapshots')
    .insert({
      session_id: sessionId,
      name,
      description,
      ast_data: ast,
      node_count: countNodes(ast),
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Failed to save snapshot:', error.message);
    return null;
  }
  return data as SnapshotRecord;
}

export async function loadSnapshots(sessionId: string): Promise<SnapshotRecord[]> {
  const { data, error } = await supabase
    .from('vads_snapshots')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load snapshots:', error.message);
    return [];
  }
  return (data as SnapshotRecord[]) ?? [];
}

export async function deleteSnapshot(snapshotId: string): Promise<void> {
  const { error } = await supabase.from('vads_snapshots').delete().eq('id', snapshotId);
  if (error) {
    console.error('Failed to delete snapshot:', error.message);
  }
}
