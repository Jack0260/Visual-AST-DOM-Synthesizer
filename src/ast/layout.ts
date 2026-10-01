import type { ASTNode, DiffMap, NodeStatus } from './types';

export interface FlowNodeData {
  label: string;
  nodeType: string;
  status?: NodeStatus;
  isSelected?: boolean;
  props?: Record<string, string>;
  value?: string;
  sourceRange?: [number, number];
}

export interface LayoutedFlowNode {
  id: string;
  type: 'astNode';
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface LayoutedFlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
  className?: string;
}

const NODE_WIDTH = 200;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 70;

function layoutSubtree(
  node: ASTNode,
  depth: number,
  diffMap: DiffMap | null,
  result: { nodes: LayoutedFlowNode[]; edges: LayoutedFlowEdge[] },
): { width: number; centerX: number } {
  const status = diffMap?.[node.id] ?? 'unchanged';

  if (node.children.length === 0) {
    const myNode: LayoutedFlowNode = {
      id: node.id,
      type: 'astNode',
      position: { x: 0, y: depth * VERTICAL_GAP },
      data: {
        label: node.label,
        nodeType: node.type,
        status,
        props: node.props,
        value: node.value,
        sourceRange: node.sourceRange,
      },
    };
    result.nodes.push(myNode);
    return { width: NODE_WIDTH, centerX: NODE_WIDTH / 2 };
  }

  const childLayouts: { width: number; centerX: number }[] = [];
  let totalWidth = 0;

  for (const child of node.children) {
    const childLayout = layoutSubtree(child, depth + 1, diffMap, result);
    childLayouts.push(childLayout);
    totalWidth += childLayout.width;
  }
  totalWidth += HORIZONTAL_GAP * (node.children.length - 1);

  let cursorX = 0;
  for (let i = 0; i < node.children.length; i++) {
    const childLayout = childLayouts[i];
    const childId = node.children[i].id;
    const childNode = result.nodes.find((n) => n.id === childId);
    if (childNode) {
      childNode.position.x = cursorX + (childLayout.width - NODE_WIDTH) / 2;
    }
    result.edges.push({
      id: `e-${node.id}-${childId}`,
      source: node.id,
      target: childId,
      type: 'smoothstep',
      animated: diffMap?.[childId] === 'added',
      className: diffMap
        ? `ast-edge ast-edge-${diffMap[childId] ?? 'unchanged'}`
        : 'ast-edge',
    });
    cursorX += childLayout.width + HORIZONTAL_GAP;
  }

  const myNode: LayoutedFlowNode = {
    id: node.id,
    type: 'astNode',
    position: { x: totalWidth / 2 - NODE_WIDTH / 2, y: depth * VERTICAL_GAP },
    data: {
      label: node.label,
      nodeType: node.type,
      status,
      props: node.props,
      value: node.value,
      sourceRange: node.sourceRange,
    },
  };
  result.nodes.push(myNode);

  return { width: Math.max(totalWidth, NODE_WIDTH), centerX: totalWidth / 2 };
}

export function layoutAST(
  root: ASTNode,
  diffMap: DiffMap | null,
): { nodes: LayoutedFlowNode[]; edges: LayoutedFlowEdge[] } {
  const result: { nodes: LayoutedFlowNode[]; edges: LayoutedFlowEdge[] } = {
    nodes: [],
    edges: [],
  };
  layoutSubtree(root, 0, diffMap, result);
  return result;
}

export const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  FunctionDeclaration: { bg: 'bg-blue-500/15', border: 'border-blue-500/50', text: 'text-blue-600 dark:text-blue-400' },
  VariableDeclaration: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/50', text: 'text-cyan-600 dark:text-cyan-400' },
  JSXElement: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/50', text: 'text-emerald-600 dark:text-emerald-400' },
  JSXAttribute: { bg: 'bg-teal-500/15', border: 'border-teal-500/50', text: 'text-teal-600 dark:text-teal-400' },
  ReturnStatement: { bg: 'bg-amber-500/15', border: 'border-amber-500/50', text: 'text-amber-600 dark:text-amber-400' },
  Expression: { bg: 'bg-orange-500/15', border: 'border-orange-500/50', text: 'text-orange-600 dark:text-orange-400' },
  Literal: { bg: 'bg-rose-500/15', border: 'border-rose-500/50', text: 'text-rose-600 dark:text-rose-400' },
  Fragment: { bg: 'bg-violet-500/15', border: 'border-violet-500/50', text: 'text-violet-600 dark:text-violet-400' },
  Import: { bg: 'bg-sky-500/15', border: 'border-sky-500/50', text: 'text-sky-600 dark:text-sky-400' },
  Export: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/50', text: 'text-indigo-600 dark:text-indigo-400' },
  ArrowFunction: { bg: 'bg-blue-500/15', border: 'border-blue-500/50', text: 'text-blue-600 dark:text-blue-400' },
  Conditional: { bg: 'bg-fuchsia-500/15', border: 'border-fuchsia-500/50', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
};

export const STATUS_STYLES: Record<string, string> = {
  added: 'ring-2 ring-emerald-400/80 shadow-emerald-500/20 shadow-lg',
  removed: 'ring-2 ring-red-400/80 opacity-50',
  modified: 'ring-2 ring-amber-400/80 shadow-amber-500/20 shadow-lg',
  unchanged: '',
};
