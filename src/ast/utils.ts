import type { ASTNode } from './types';

let counter = 0;
export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function cloneNode(node: ASTNode): ASTNode {
  return {
    ...node,
    id: genId(node.type),
    props: node.props ? { ...node.props } : undefined,
    value: node.value,
    children: node.children.map(cloneNode),
  };
}

export function cloneAST(ast: ASTNode): ASTNode {
  return cloneNode(ast);
}

export function countNodes(node: ASTNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

export function findNodeById(node: ASTNode, id: string): ASTNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}
