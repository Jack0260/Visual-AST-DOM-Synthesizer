import type { PatchScenario, ASTNode } from './types';
import { cloneAST, genId } from './utils';

export const patchScenarios: PatchScenario[] = [
  {
    id: 'add_onclick',
    name: 'Add onClick Handler',
    description: 'Attaches an onClick event handler to the <button> element',
    icon: 'MousePointerClick',
    apply: (ast: ASTNode): ASTNode => {
      const cloned = cloneAST(ast);
      function findButton(node: ASTNode): ASTNode | null {
        if (node.type === 'JSXElement' && node.label === '<button>') return node;
        for (const child of node.children) {
          const found = findButton(child);
          if (found) return found;
        }
        return null;
      }
      const btn = findButton(cloned);
      if (btn) {
        btn.props = { ...btn.props, onClick: 'handleClick' };
      }
      return cloned;
    },
  },
  {
    id: 'rename_component',
    name: 'Rename Component',
    description: 'Renames the root function from App() to Dashboard()',
    icon: 'PenLine',
    apply: (ast: ASTNode): ASTNode => {
      const cloned = cloneAST(ast);
      cloned.label = 'Dashboard()';
      return cloned;
    },
  },
  {
    id: 'wrap_fragment',
    name: 'Wrap in Fragment',
    description: 'Wraps the return statement\'s children in a React Fragment',
    icon: 'Box',
    apply: (ast: ASTNode): ASTNode => {
      const cloned = cloneAST(ast);
      function findReturn(node: ASTNode): ASTNode | null {
        if (node.type === 'ReturnStatement') return node;
        for (const child of node.children) {
          const found = findReturn(child);
          if (found) return found;
        }
        return null;
      }
      const ret = findReturn(cloned);
      if (ret && ret.children.length > 0) {
        const oldChildren = ret.children;
        const fragment: ASTNode = {
          id: genId('Fragment'),
          type: 'Fragment',
          label: '<Fragment>',
          sourceRange: [ret.sourceRange[0], ret.sourceRange[1]],
          children: oldChildren,
        };
        ret.children = [fragment];
      }
      return cloned;
    },
  },
  {
    id: 'add_input',
    name: 'Add Input Field',
    description: 'Inserts a new <input> element after the <p> tag',
    icon: 'TextCursorInput',
    apply: (ast: ASTNode): ASTNode => {
      const cloned = cloneAST(ast);
      function findDiv(node: ASTNode): ASTNode | null {
        if (node.type === 'JSXElement' && node.label === '<div>') return node;
        for (const child of node.children) {
          const found = findDiv(child);
          if (found) return found;
        }
        return null;
      }
      const div = findDiv(cloned);
      if (div) {
        const inputNode: ASTNode = {
          id: genId('JSXElement'),
          type: 'JSXElement',
          label: '<input>',
          sourceRange: [165, 195],
          props: { type: 'text', placeholder: 'Enter name...' },
          children: [],
        };
        const pIndex = div.children.findIndex((c) => c.label === '<p>');
        if (pIndex >= 0) {
          div.children.splice(pIndex + 1, 0, inputNode);
        } else {
          div.children.push(inputNode);
        }
      }
      return cloned;
    },
  },
  {
    id: 'remove_prop',
    name: 'Remove className Prop',
    description: 'Removes the className prop from the <div> element',
    icon: 'Eraser',
    apply: (ast: ASTNode): ASTNode => {
      const cloned = cloneAST(ast);
      function findDiv(node: ASTNode): ASTNode | null {
        if (node.type === 'JSXElement' && node.label === '<div>') return node;
        for (const child of node.children) {
          const found = findDiv(child);
          if (found) return found;
        }
        return null;
      }
      const div = findDiv(cloned);
      if (div && div.props) {
        const { className: _removed, ...rest } = div.props;
        div.props = rest;
      }
      return cloned;
    },
  },
  {
    id: 'change_text',
    name: 'Update Heading Text',
    description: 'Changes the heading literal from "Hello World" to "AST Patch Demo"',
    icon: 'Type',
    apply: (ast: ASTNode): ASTNode => {
      const cloned = cloneAST(ast);
      function findLiteral(node: ASTNode): ASTNode | null {
        if (node.type === 'Literal' && node.value === 'Hello World') return node;
        for (const child of node.children) {
          const found = findLiteral(child);
          if (found) return found;
        }
        return null;
      }
      const lit = findLiteral(cloned);
      if (lit) {
        lit.value = 'AST Patch Demo';
        lit.label = '"AST Patch Demo"';
      }
      return cloned;
    },
  },
  {
    id: 'add_conditional',
    name: 'Add Conditional Render',
    description: 'Replaces the <p> element with a conditional expression wrapping it',
    icon: 'GitBranch',
    apply: (ast: ASTNode): ASTNode => {
      const cloned = cloneAST(ast);
      function findDiv(node: ASTNode): ASTNode | null {
        if (node.type === 'JSXElement' && node.label === '<div>') return node;
        for (const child of node.children) {
          const found = findDiv(child);
          if (found) return found;
        }
        return null;
      }
      const div = findDiv(cloned);
      if (div) {
        const pIndex = div.children.findIndex((c) => c.label === '<p>');
        if (pIndex >= 0) {
          const pElement = div.children[pIndex];
          const conditional: ASTNode = {
            id: genId('Conditional'),
            type: 'Conditional',
            label: 'isLoading ? ... : ...',
            sourceRange: [120, 160],
            children: [
              {
                id: genId('Literal'),
                type: 'Literal',
                label: '"Loading..."',
                sourceRange: [125, 140],
                value: 'Loading...',
                children: [],
              },
              pElement,
            ],
          };
          div.children[pIndex] = conditional;
        }
      }
      return cloned;
    },
  },
];
