import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { NODE_COLORS, STATUS_STYLES } from '@/ast/layout';
import type { FlowNodeData } from '@/ast/layout';

function ASTFlowNode({ data, selected }: NodeProps<FlowNodeData>) {
  const colors = NODE_COLORS[data.nodeType] ?? {
    bg: 'bg-gray-500/15',
    border: 'border-gray-500/50',
    text: 'text-gray-600 dark:text-gray-400',
  };
  const statusStyle = STATUS_STYLES[data.status ?? 'unchanged'] ?? '';

  return (
    <div
      className={`rounded-lg border-2 ${colors.border} ${colors.bg} ${statusStyle} px-3 py-2 min-w-[160px] transition-all duration-300 ${
        selected ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-500/20' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 dark:!bg-slate-500 !w-2 !h-2 !border-0" />

      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>
          {data.nodeType.replace('Declaration', '').replace('Statement', '')}
        </span>
        {data.status && data.status !== 'unchanged' && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              data.status === 'added'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : data.status === 'removed'
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}
          >
            {data.status}
          </span>
        )}
      </div>

      <div className="mt-1 text-sm font-mono font-semibold text-gray-800 dark:text-slate-100">
        {data.label}
      </div>

      {data.props && Object.keys(data.props).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {Object.entries(data.props).map(([key, val]) => (
            <span
              key={key}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200/60 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300"
            >
              {key}={val}
            </span>
          ))}
        </div>
      )}

      {data.sourceRange && (
        <div className="mt-1 text-[10px] text-gray-400 dark:text-slate-500 font-mono">
          [{data.sourceRange[0]}, {data.sourceRange[1]}]
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 dark:!bg-slate-500 !w-2 !h-2 !border-0" />
    </div>
  );
}

export default memo(ASTFlowNode);
