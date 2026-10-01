import { Plus, Minus, Pencil, Equal } from 'lucide-react';
import type { DiffEntry } from '@/ast/types';

interface DiffVisualizerProps {
  diffEntries: DiffEntry[];
}

const statusConfig = {
  added: {
    icon: Plus,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    label: 'Added',
  },
  removed: {
    icon: Minus,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    label: 'Removed',
  },
  modified: {
    icon: Pencil,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    label: 'Modified',
  },
  unchanged: {
    icon: Equal,
    color: 'text-gray-400 dark:text-slate-500',
    bg: 'bg-slate-500/5 border-slate-500/20',
    label: 'Unchanged',
  },
};

export default function DiffVisualizer({ diffEntries }: DiffVisualizerProps) {
  const relevantEntries = diffEntries.filter((e) => e.status !== 'unchanged');

  if (relevantEntries.length === 0) {
    return (
      <div className="text-center py-6 px-4">
        <Equal className="h-6 w-6 mx-auto text-gray-300 dark:text-slate-600 mb-2" />
        <p className="text-xs text-gray-400 dark:text-slate-500">
          AST is in sync. Apply a patch to see the diff.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-full overflow-y-auto pr-1">
      {relevantEntries.map((entry, i) => {
        const config = statusConfig[entry.status];
        const Icon = config.icon;
        return (
          <div
            key={`${entry.nodeId}-${i}`}
            className={`flex items-start gap-2.5 rounded-lg border ${config.bg} px-3 py-2 transition-all`}
            style={{
              animation: `slideIn 0.3s ease-out ${i * 0.04}s both`,
            }}
          >
            <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-semibold ${config.color}`}>
                {config.label}
              </div>
              <div className="text-xs font-mono text-gray-600 dark:text-slate-300 mt-0.5 break-all">
                {entry.detail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
