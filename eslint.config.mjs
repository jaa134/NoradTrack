import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPrettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import vuePlugin from 'eslint-plugin-vue';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['node_modules', 'dist']),

  eslint.configs.recommended,

  {
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side-effect imports.
            ['^\\u0000'],

            // Packages.
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            ['^@?\\w'],

            // Internal modules.
            ['^@/types(/|\\.|$)'],
            ['^@/utilities(/|\\.|$)'],
            ['^@/router(/|\\.|$)'],
            ['^@/stores(/|\\.|$)'],
            ['^@/composables(/|\\.|$)'],
            ['^@/components(/|\\.|$)'],

            // Absolute imports and other imports such as `@/foo`.
            // Anything not matched in another group.
            ['^'],

            // Relative (parent) imports.
            ['^\\.\\.'],

            // Relative (sibling) imports.
            ['^\\.'],
          ],
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    extends: [
      eslint.configs.recommended,
      ...typescriptEslint.configs.recommended,
      ...vuePlugin.configs['flat/recommended-error'],
    ],
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  eslintPrettierConfig,
]);
