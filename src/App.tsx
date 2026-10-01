import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GitBranch, RotateCcw, Zap, TreePine, PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen, Camera, Trash2, Database, Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { createInitialAST } from '@/ast/sampleData';
import { countNodes } from '@/ast/utils';
import { computeDiff } from '@/ast/diffEngine';
import { patchScenarios } from '@/ast/patchScenarios';
import type { ASTNode, PatchScenario, PatchHistoryEntry, DiffEntry, DiffMap, ThemeMode } from '@/ast/types';

import ThemeSwitcher from '@/components/ThemeSwitcher';
import ASTCanvas from '@/components/ASTCanvas';
import PatchScenarioList from '@/components/PatchScenarioList';
import PatchHistory from '@/components/PatchHistory';
import DiffVisualizer from '@/components/DiffVisualizer';
import NodeInspector from '@/components/NodeInspector';
import StatusBar from '@/components/StatusBar';

import {
  createSession,
  loadLatestSession,
  updateSessionTheme,
  savePatchToHistory,
  loadPatchHistory,
  deletePatchHistory,
  revertToPatchIndex,
  saveSnapshot,
  loadSnapshots,
  deleteSnapshot,
  type SnapshotRecord,
} from '@/lib/db';

let patchCounter = 0;

export default function App() {
  const { themeMode, setMode, setModeWithoutPersist, isDark } = useTheme();
  const [ast, setAst] = useState<ASTNode>(() => createInitialAST());
  const [history, setHistory] = useState<PatchHistoryEntry[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [diffEntries, setDiffEntries] = useState<DiffEntry[]>([]);
  const [diffMap, setDiffMap] = useState<DiffMap | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  const sessionInitialized = useRef(false);

  // Initialize or restore session on mount
  useEffect(() => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    (async () => {
      try {
        const existing = await loadLatestSession();
        if (existing) {
          setSessionId(existing.id);
          setModeWithoutPersist(existing.theme_mode as ThemeMode);

          const patches = await loadPatchHistory(existing.id);
          if (patches.length > 0) {
            const lastPatch = patches[patches.length - 1];
            const restoredAst = lastPatch.ast_snapshot;
            const restoredHistory: PatchHistoryEntry[] = patches.map((p) => ({
              id: p.id,
              scenarioId: p.scenario_id,
              scenarioName: p.scenario_name,
              timestamp: new Date(p.created_at).getTime(),
              latencyMs: p.latency_ms,
              changesCount: p.changes_count,
              diffSummary: p.diff_summary,
            }));

            setAst(restoredAst);
            setHistory(restoredHistory);
            setLastLatency(restoredHistory[restoredHistory.length - 1].latencyMs);
            setActiveScenarioId(restoredHistory[restoredHistory.length - 1].scenarioId);

            const { diffMap: dMap } = computeDiff(createInitialAST(), restoredAst);
            setDiffMap(dMap);
          }

          const snaps = await loadSnapshots(existing.id);
          setSnapshots(snaps);
        } else {
          const newSession = await createSession(themeMode);
          if (newSession) {
            setSessionId(newSession.id);
          }
        }
        setDbStatus('connected');
      } catch {
        setDbStatus('offline');
      }
      setIsLoadingSession(false);
    })();
  }, []);

  // Persist theme changes to database
  const handleThemeChange = useCallback(
    (mode: ThemeMode) => {
      setMode(mode);
      if (sessionId) {
        updateSessionTheme(sessionId, mode);
      }
    },
    [setMode, sessionId],
  );

  const handleApplyPatch = useCallback(
    async (scenario: PatchScenario) => {
      setIsPatching(true);
      setActiveScenarioId(scenario.id);

      const t0 = performance.now();
      const newAst = scenario.apply(ast);
      const { entries, diffMap: dMap } = computeDiff(ast, newAst);
      const t1 = performance.now();
      const latency = t1 - t0;

      const historyEntry: PatchHistoryEntry = {
        id: `patch_${++patchCounter}`,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        timestamp: Date.now(),
        latencyMs: latency,
        changesCount: entries.filter((e) => e.status !== 'unchanged').length,
        diffSummary: entries,
      };

      setAst(newAst);
      setDiffEntries(entries);
      setDiffMap(dMap);
      setLastLatency(latency);
      setHistory((prev) => [...prev, historyEntry]);
      setSelectedNodeId(null);

      if (sessionId) {
        await savePatchToHistory(sessionId, historyEntry, newAst);
      }

      setTimeout(() => setIsPatching(false), 400);
    },
    [ast, sessionId],
  );

  const handleRevert = useCallback(
    async (index: number) => {
      if (index < 0 || index >= history.length) return;

      const targetEntry = history[index];

      if (sessionId) {
        const result = await revertToPatchIndex(sessionId, index);
        if (result.ast) {
          const { diffMap: dMap } = computeDiff(ast, result.ast);
          setAst(result.ast);
          setHistory(history.slice(0, index + 1));
          setDiffMap(dMap);
          setLastLatency(targetEntry.latencyMs);
          setSelectedNodeId(null);
          setActiveScenarioId(targetEntry.scenarioId);
          return;
        }
      }

      let rebuiltAst = createInitialAST();
      const relevantScenarios = history.slice(0, index + 1);
      const allDiffs: DiffEntry[] = [];

      for (const entry of relevantScenarios) {
        const scenario = patchScenarios.find((s) => s.id === entry.scenarioId);
        if (!scenario) continue;
        const newAst = scenario.apply(rebuiltAst);
        const { entries } = computeDiff(rebuiltAst, newAst);
        rebuiltAst = newAst;
        allDiffs.length = 0;
        allDiffs.push(...entries);
      }

      const { diffMap: dMap } = computeDiff(ast, rebuiltAst);

      setAst(rebuiltAst);
      setHistory(history.slice(0, index + 1));
      setDiffEntries(allDiffs);
      setDiffMap(dMap);
      setLastLatency(targetEntry.latencyMs);
      setSelectedNodeId(null);
      setActiveScenarioId(targetEntry.scenarioId);
    },
    [history, ast, sessionId],
  );

  const handleReset = useCallback(async () => {
    const fresh = createInitialAST();
    const { entries, diffMap: dMap } = computeDiff(ast, fresh);
    setAst(fresh);
    setHistory([]);
    setDiffEntries(entries);
    setDiffMap(dMap);
    setLastLatency(null);
    setSelectedNodeId(null);
    setActiveScenarioId(null);

    if (sessionId) {
      await deletePatchHistory(sessionId);
    }
  }, [ast, sessionId]);

  const handleSaveSnapshot = useCallback(async () => {
    if (!sessionId || !snapshotName.trim()) return;
    const snap = await saveSnapshot(sessionId, snapshotName.trim(), '', ast);
    if (snap) {
      setSnapshots((prev) => [snap, ...prev]);
      setSnapshotName('');
    }
  }, [sessionId, snapshotName, ast]);

  const handleLoadSnapshot = useCallback((snap: SnapshotRecord) => {
    const { diffMap: dMap } = computeDiff(ast, snap.ast_data);
    setAst(snap.ast_data);
    setDiffMap(dMap);
    setSelectedNodeId(null);
  }, [ast]);

  const handleDeleteSnapshot = useCallback(async (snapId: string) => {
    await deleteSnapshot(snapId);
    setSnapshots((prev) => prev.filter((s) => s.id !== snapId));
  }, []);

  const nodeCount = useMemo(() => countNodes(ast), [ast]);
  const changesCount = useMemo(
    () => diffEntries.filter((e) => e.status !== 'unchanged').length,
    [diffEntries],
  );

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-slate-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500">
            <TreePine className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              Visual AST DOM Synthesizer
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
              Live runtime AST patching with zero-latency diff visualization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* DB Status indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium">
            {dbStatus === 'connected' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Database className="h-3 w-3" />
                <span className="hidden lg:inline">DB Connected</span>
              </span>
            )}
            {dbStatus === 'connecting' && (
              <span className="flex items-center gap-1 text-amber-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden lg:inline">Connecting...</span>
              </span>
            )}
            {dbStatus === 'offline' && (
              <span className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
                <Database className="h-3 w-3" />
                <span className="hidden lg:inline">Offline</span>
              </span>
            )}
          </div>

          {isPatching && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Zap className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Patching...</span>
            </div>
          )}

          <button
            onClick={() => setShowSnapshots((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              showSnapshots
                ? 'border-blue-400/60 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Snapshots</span>
            {snapshots.length > 0 && (
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-blue-500/10">{snapshots.length}</span>
            )}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Session</span>
          </button>

          <ThemeSwitcher mode={themeMode} onChange={handleThemeChange} />
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {leftPanelOpen && (
          <aside className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  Patch Scenarios
                </h2>
              </div>
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-3 py-3" style={{ maxHeight: '45%' }}>
              <PatchScenarioList
                scenarios={patchScenarios}
                onApplyPatch={handleApplyPatch}
                disabled={isPatching}
                activeScenarioId={activeScenarioId}
              />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <GitBranch className="h-4 w-4 text-blue-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  Patch History
                </h2>
                {history.length > 0 && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {history.length}
                  </span>
                )}
              </div>
              <div className="overflow-y-auto px-3 py-3 flex-1">
                <PatchHistory history={history} onRevert={handleRevert} />
              </div>
            </div>
          </aside>
        )}

        {/* Center Canvas */}
        <main className="flex-1 relative overflow-hidden">
          {!leftPanelOpen && (
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="absolute top-3 left-3 z-10 p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 shadow-sm transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          {!rightPanelOpen && (
            <button
              onClick={() => setRightPanelOpen(true)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 shadow-sm transition-colors"
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
          )}

          {lastLatency !== null && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" style={{ animation: 'pulseGlow 2s infinite' }} />
              <span className="text-xs text-gray-500 dark:text-slate-400">Patch latency:</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {lastLatency.toFixed(3)}ms
              </span>
            </div>
          )}

          {/* Snapshots panel */}
          {showSnapshots && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 w-96 max-w-[90%] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-fadeIn">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">AST Snapshots</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={snapshotName}
                    onChange={(e) => setSnapshotName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSnapshot()}
                    placeholder="Snapshot name..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={handleSaveSnapshot}
                    disabled={!snapshotName.trim()}
                    className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto px-2 py-2">
                {snapshots.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 dark:text-slate-500 py-6">
                    No snapshots yet. Save the current AST state to revisit it later.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {snapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="group flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">
                            {snap.name}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-slate-500">
                            {snap.node_count} nodes · {new Date(snap.created_at).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleLoadSnapshot(snap)}
                          className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <ASTCanvas
            ast={ast}
            diffMap={diffMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </main>

        {/* Right Inspector Panel */}
        {rightPanelOpen && (
          <aside className="w-80 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-400">
                Inspector
              </h2>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-3 flex-shrink-0">
              <div className="mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
                  Node Details
                </h3>
                <NodeInspector ast={ast} selectedNodeId={selectedNodeId} />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Live Diff
                </h3>
              </div>
              <div className="overflow-y-auto px-4 py-3 flex-1">
                <DiffVisualizer diffEntries={diffEntries} />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        totalPatches={history.length}
        nodeCount={nodeCount}
        lastLatency={lastLatency}
        changesCount={changesCount}
        isDark={isDark}
        themeMode={themeMode}
      />
    </div>
  );
}
