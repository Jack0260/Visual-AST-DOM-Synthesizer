import { ChevronRight, FileCode2, Tag, Box, MousePointerClick, PenLine, Eraser, Type, GitBranch, TextCursorInput } from 'lucide-react';
import type { PatchScenario } from '@/ast/types';

interface SidebarProps {
  scenarios: PatchScenario[];
  onApplyPatch: (scenario: PatchScenario) => void;
  disabled: boolean;
  activeScenarioId: string | null;
}

const iconMap: Record<string, typeof FileCode2> = {
  FileCode2,
  Tag,
  Box,
  MousePointerClick,
  PenLine,
  Eraser,
  Type,
  GitBranch,
  TextCursorInput,
};

export default function PatchScenarioList({ scenarios, onApplyPatch, disabled, activeScenarioId }: SidebarProps) {
  return (
    <div className="space-y-1.5">
      {scenarios.map((scenario) => {
        const Icon = iconMap[scenario.icon] ?? FileCode2;
        const isActive = activeScenarioId === scenario.id;
        return (
          <button
            key={scenario.id}
            onClick={() => onApplyPatch(scenario)}
            disabled={disabled}
            className={`w-full group flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
              isActive
                ? 'border-blue-400/60 bg-blue-500/10'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-slate-200'}`}>
                {scenario.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">
                {scenario.description}
              </div>
            </div>
            <ChevronRight className="flex-shrink-0 mt-1 h-4 w-4 text-gray-300 dark:text-slate-600 group-hover:text-gray-500 dark:group-hover:text-slate-400 transition-colors" />
          </button>
        );
      })}
    </div>
  );
}
