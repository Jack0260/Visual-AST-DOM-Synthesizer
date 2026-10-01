export type ASTNodeType =
  | 'FunctionDeclaration'
  | 'VariableDeclaration'
  | 'JSXElement'
  | 'JSXAttribute'
  | 'ReturnStatement'
  | 'Expression'
  | 'Literal'
  | 'Fragment'
  | 'Import'
  | 'Export'
  | 'ArrowFunction'
  | 'Conditional';

export interface ASTNode {
  id: string;
  type: ASTNodeType;
  label: string;
  sourceRange: [number, number];
  children: ASTNode[];
  props?: Record<string, string>;
  value?: string;
}

export type NodeStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffEntry {
  nodeId: string;
  nodeType: ASTNodeType;
  label: string;
  status: NodeStatus;
  detail: string;
}

export type DiffMap = Record<string, NodeStatus>;

export interface PatchScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  apply: (ast: ASTNode) => ASTNode;
}

export interface PatchHistoryEntry {
  id: string;
  scenarioId: string;
  scenarioName: string;
  timestamp: number;
  latencyMs: number;
  changesCount: number;
  diffSummary: DiffEntry[];
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface PatchResult {
  newAst: ASTNode;
  diff: DiffEntry[];
  diffMap: DiffMap;
  latencyMs: number;
}
