import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * Engine modules. Each one exposes only its `index.ts`; every other file is private.
 * A module may import its own files (`./schema`), and must reach every other module
 * through that module's public surface (`../state`, `@engine/state`).
 */
const ENGINE_MODULES = [
  'content',
  'culture',
  'dsl',
  'economy',
  'journal',
  'kernel',
  'narrative',
  'rng',
  'save',
  'state',
  'testing',
  'time',
  'views',
  'world',
]

/** One pair of forbidden forms per module: relative and alias. */
const boundaryPatterns = ENGINE_MODULES.flatMap((module) => [
  {
    group: [`../${module}/*`],
    message: `\`${module}\` is a sealed module: import from "../${module}" (its index.ts), not from a file inside it.`,
  },
  {
    group: [`@engine/${module}/*`],
    message: `\`${module}\` is a sealed module: import from "@engine/${module}" (its index.ts), not from a file inside it.`,
  },
  {
    group: [`**/src/engine/${module}/*`],
    message: `\`${module}\` is a sealed module: import through its index.ts.`,
  },
])

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'pnpm-lock.yaml'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*', 'zustand', 'zustand/*'],
              message: 'src/engine must stay pure: no React or Zustand imports.',
            },
            {
              group: ['@ui/*', '@store/*', '../ui/*', '../../ui/*', '../store/*', '../../store/*'],
              message: 'src/engine must not depend on UI or the app store.',
            },
            {
              group: ['**/internal/*', '**/internal/**', '@engine/*/internal/*'],
              message:
                'A module exposes index.ts. Put shared types in kernel/ and keep internals private.',
            },
            ...boundaryPatterns,
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'src/engine must not touch the DOM.' },
        { name: 'document', message: 'src/engine must not touch the DOM.' },
        { name: 'localStorage', message: 'src/engine must not touch storage; saves are passed in.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded engine RNG.' },
        { object: 'Date', property: 'now', message: 'Use the engine calendar, never the wall clock.' },
      ],
    },
  },
  {
    // The interface and the store may only see each engine module's public surface.
    files: ['src/store/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: boundaryPatterns,
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  {
    files: ['tools/**/*.ts', 'tools/**/*.mjs', '*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
      },
    },
  },
)
