import { History, RotateCcw, Clock } from 'lucide-react';
import type { PatchHistoryEntry } from '@/ast/types';

interface PatchHistoryProps {
  history: PatchHistoryEntry[];
  onRevert: (index: number) => void;
}

export default function PatchHistory({ history, onRevert }: PatchHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <History className="h-8 w-8 mx-auto text-gray-300 dark:text-slate-600 mb-2" />
        <p className="text-xs text-gray-400 dark:text-slate-500">
          No patches applied yet. Click a scenario to see the history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {history.map((entry, index) => (
        <div
          key={entry.id}
          className="group flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2 transition-all hover:border-slate-300 dark:hover:border-slate-600"
        >
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {index + 1}
            </div>
            {index < history.length - 1 && (
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">
              {entry.scenarioName}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {entry.latencyMs.toFixed(2)}ms
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                {entry.changesCount} change{entry.changesCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <button
            onClick={() => onRevert(index)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-500/10"
            title="Revert to this point"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
