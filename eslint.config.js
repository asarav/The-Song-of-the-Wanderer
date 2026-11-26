import js from '@eslint/js'
import tseslint from 'typescript-eslint'

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
      },
    },
  },
)
