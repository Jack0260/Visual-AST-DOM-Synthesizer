import type { ASTNode, DiffEntry, DiffMap, NodeStatus } from './types';

function collectNodes(node: ASTNode, map: Record<string, { node: ASTNode; path: string }>): void {
  const pathSignature = `${node.type}:${node.label}:${node.sourceRange[0]}`;
  map[node.id] = { node, path: pathSignature };
  for (const child of node.children) {
    collectNodes(child, map);
  }
}

function collectBySignature(
  node: ASTNode,
  parentSignature: string,
  map: Map<string, ASTNode[]>,
): void {
  const sig = `${parentSignature}/${node.type}:${node.label}`;
  if (!map.has(sig)) map.set(sig, []);
  map.get(sig)!.push(node);
  for (const child of node.children) {
    collectBySignature(child, sig, map);
  }
}

export function computeDiff(
  oldAst: ASTNode,
  newAst: ASTNode,
): { entries: DiffEntry[]; diffMap: DiffMap } {
  const oldNodes: Record<string, { node: ASTNode; path: string }> = {};
  const newNodes: Record<string, { node: ASTNode; path: string }> = {};

  collectNodes(oldAst, oldNodes);
  collectNodes(newAst, newNodes);

  const oldBySig = new Map<string, ASTNode[]>();
  const newBySig = new Map<string, ASTNode[]>();
  collectBySignature(oldAst, '', oldBySig);
  collectBySignature(newAst, '', newBySig);

  const entries: DiffEntry[] = [];
  const diffMap: DiffMap = {};

  const oldIds = new Set(Object.keys(oldNodes));
  const newIds = new Set(Object.keys(newNodes));

  for (const id of newIds) {
    if (!oldIds.has(id)) {
      const n = newNodes[id].node;
      entries.push({
        nodeId: id,
        nodeType: n.type,
        label: n.label,
        status: 'added',
        detail: `Added: ${n.type} ${n.label}`,
      });
      diffMap[id] = 'added';
      continue;
    }

    const oldN = oldNodes[id].node;
    const newN = newNodes[id].node;
    const propsChanged =
      JSON.stringify(oldN.props ?? {}) !== JSON.stringify(newN.props ?? {});
    const valueChanged = oldN.value !== newN.value;
    const labelChanged = oldN.label !== newN.label;

    if (propsChanged || valueChanged || labelChanged) {
      const changes: string[] = [];
      if (labelChanged) changes.push(`label: "${oldN.label}" → "${newN.label}"`);
      if (valueChanged) changes.push(`value: "${oldN.value}" → "${newN.value}"`);
      if (propsChanged) changes.push('props changed');

      entries.push({
        nodeId: id,
        nodeType: newN.type,
        label: newN.label,
        status: 'modified',
        detail: `Modified: ${newN.label} (${changes.join(', ')})`,
      });
      diffMap[id] = 'modified';
    } else {
      diffMap[id] = 'unchanged';
    }
  }

  for (const id of oldIds) {
    if (!newIds.has(id)) {
      const n = oldNodes[id].node;
      entries.push({
        nodeId: id,
        nodeType: n.type,
        label: n.label,
        status: 'removed',
        detail: `Removed: ${n.type} ${n.label}`,
      });
      diffMap[id] = 'removed';
    }
  }

  return { entries, diffMap };
}
