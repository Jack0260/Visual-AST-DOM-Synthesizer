import { Code2, Hash, Braces, MapPin } from 'lucide-react';
import type { ASTNode } from '@/ast/types';
import { findNodeById, countNodes } from '@/ast/utils';

interface InspectorProps {
  ast: ASTNode;
  selectedNodeId: string | null;
}

export default function NodeInspector({ ast, selectedNodeId }: InspectorProps) {
  const selectedNode = selectedNodeId ? findNodeById(ast, selectedNodeId) : null;
  const totalNodes = countNodes(ast);

  if (!selectedNode) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">AST Overview</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500">Total Nodes</div>
              <div className="text-lg font-bold text-gray-800 dark:text-slate-100">{totalNodes}</div>
            </div>
            <div className="rounded-md bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500">Root Type</div>
              <div className="text-lg font-bold text-gray-800 dark:text-slate-100 truncate">{ast.type.replace('Declaration', '')}</div>
            </div>
          </div>
        </div>
        <div className="text-center py-6 px-4">
          <Code2 className="h-6 w-6 mx-auto text-gray-300 dark:text-slate-600 mb-2" />
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Click a node in the canvas to inspect its details.
          </p>
        </div>
      </div>
    );
  }

  const childCount = selectedNode.children.length;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-blue-300/40 dark:border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Selected Node</span>
        </div>
        <div className="text-base font-mono font-bold text-gray-800 dark:text-slate-100">
          {selectedNode.label}
        </div>
        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {selectedNode.type}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2">
          <Braces className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <span className="text-xs text-gray-500 dark:text-slate-400 flex-shrink-0">Type</span>
          <span className="text-xs font-mono font-medium text-gray-800 dark:text-slate-200 ml-auto">
            {selectedNode.type}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2">
          <Hash className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <span className="text-xs text-gray-500 dark:text-slate-400 flex-shrink-0">Children</span>
          <span className="text-xs font-mono font-medium text-gray-800 dark:text-slate-200 ml-auto">
            {childCount}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2">
          <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <span className="text-xs text-gray-500 dark:text-slate-400 flex-shrink-0">Range</span>
          <span className="text-xs font-mono font-medium text-gray-800 dark:text-slate-200 ml-auto">
            [{selectedNode.sourceRange[0]}, {selectedNode.sourceRange[1]}]
          </span>
        </div>
      </div>

      {selectedNode.props && Object.keys(selectedNode.props).length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Props</div>
          <div className="space-y-1">
            {Object.entries(selectedNode.props).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-blue-600 dark:text-blue-400">{key}</span>
                <span className="text-gray-400 dark:text-slate-500">=</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">"{val}"</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedNode.value !== undefined && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Value</div>
          <div className="text-xs font-mono text-rose-600 dark:text-rose-400">
            "{selectedNode.value}"
          </div>
        </div>
      )}

      {childCount > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Children</div>
          <div className="space-y-1">
            {selectedNode.children.map((child) => (
              <div key={child.id} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="font-mono text-gray-700 dark:text-slate-300">{child.label}</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-auto">{child.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
