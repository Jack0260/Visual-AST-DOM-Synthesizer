import { Zap, Activity, Layers, GitBranch } from 'lucide-react';

interface StatusBarProps {
  totalPatches: number;
  nodeCount: number;
  lastLatency: number | null;
  changesCount: number;
  isDark: boolean;
  themeMode: string;
}

export default function StatusBar({
  totalPatches,
  nodeCount,
  lastLatency,
  changesCount,
  isDark,
  themeMode,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-medium">Patches:</span>
          <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{totalPatches}</span>
        </span>

        <span className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
          <Layers className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-medium">Nodes:</span>
          <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{nodeCount}</span>
        </span>

        {changesCount > 0 && (
          <span className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
            <GitBranch className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-medium">Changes:</span>
            <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{changesCount}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {lastLatency !== null && (
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-gray-500 dark:text-slate-400">Last patch:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {lastLatency.toFixed(3)}ms
            </span>
          </span>
        )}

        <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
          <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-500' : 'bg-amber-400'}`} />
          <span className="capitalize">{themeMode}</span>
        </span>
      </div>
    </div>
  );
}
