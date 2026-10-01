import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type Edge,
  type Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ASTFlowNode from './ASTFlowNode';
import { layoutAST } from '@/ast/layout';
import type { ASTNode, DiffMap } from '@/ast/types';

interface ASTCanvasProps {
  ast: ASTNode;
  diffMap: DiffMap | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

const nodeTypes: NodeTypes = { astNode: ASTFlowNode };

export default function ASTCanvas({ ast, diffMap, selectedNodeId, onSelectNode }: ASTCanvasProps) {
  const { nodes, edges } = useMemo(() => layoutAST(ast, diffMap), [ast, diffMap]);

  const flowNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: { ...n.data, isSelected: n.id === selectedNodeId },
        selected: n.id === selectedNodeId,
      })),
    [nodes, selectedNodeId],
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={flowNodes}
        edges={edges as Edge[]}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="!bg-transparent" />
        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 [&_button]:!bg-white dark:[&_button]:!bg-slate-800 [&_button]:!border-slate-200 dark:[&_button]:!border-slate-700 [&_button]:!text-gray-600 dark:[&_button]:!text-slate-300" />
        <MiniMap
          className="!bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700"
          nodeColor={(node) => {
            const status = (node.data as { status?: string }).status;
            if (status === 'added') return '#10b981';
            if (status === 'removed') return '#ef4444';
            if (status === 'modified') return '#f59e0b';
            return '#94a3b8';
          }}
        />
      </ReactFlow>
    </div>
  );
}
