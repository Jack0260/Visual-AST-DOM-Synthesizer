import type { ASTNode } from './types';

export function createInitialAST(): ASTNode {
  return {
    id: 'root_1',
    type: 'FunctionDeclaration',
    label: 'App()',
    sourceRange: [0, 250],
    children: [
      {
        id: 'import_1',
        type: 'Import',
        label: 'import React',
        sourceRange: [0, 40],
        children: [],
      },
      {
        id: 'return_1',
        type: 'ReturnStatement',
        label: 'return',
        sourceRange: [60, 240],
        children: [
          {
            id: 'jsx_div_1',
            type: 'JSXElement',
            label: '<div>',
            sourceRange: [70, 230],
            props: { className: 'container' },
            children: [
              {
                id: 'jsx_h1_1',
                type: 'JSXElement',
                label: '<h1>',
                sourceRange: [80, 110],
                props: { style: 'bold' },
                children: [
                  {
                    id: 'literal_title_1',
                    type: 'Literal',
                    label: '"Hello World"',
                    sourceRange: [85, 105],
                    value: 'Hello World',
                    children: [],
                  },
                ],
              },
              {
                id: 'jsx_p_1',
                type: 'JSXElement',
                label: '<p>',
                sourceRange: [120, 160],
                children: [
                  {
                    id: 'literal_desc_1',
                    type: 'Literal',
                    label: '"Welcome to the app"',
                    sourceRange: [125, 155],
                    value: 'Welcome to the app',
                    children: [],
                  },
                ],
              },
              {
                id: 'jsx_btn_1',
                type: 'JSXElement',
                label: '<button>',
                sourceRange: [170, 220],
                props: { type: 'submit' },
                children: [
                  {
                    id: 'literal_click_1',
                    type: 'Literal',
                    label: '"Click me"',
                    sourceRange: [180, 200],
                    value: 'Click me',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
