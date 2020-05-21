// See https://github.com/lydell/eslint-plugin-simple-import-sort#custom-grouping
const ImportSortGroups = [
  // Side effect imports.
  // eslint-disable-next-line no-useless-escape
  [`^\u0000`],
  // Glimmer & Ember Dependencies
  [`^(@ember/|@glimmer|ember$)`],
  // Packages.
  // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
  // But not our packages or packages starting with ember-
  // eslint-disable-next-line no-useless-escape
  [`^(?!@ember\-data)(?!ember-)(@?\\w)`],
  // Packages starting with ember-
  // eslint-disable-next-line no-useless-escape
  [`^ember\-`],
  // Our Packages.
  // Things that start with @ember-data
  // eslint-disable-next-line no-useless-escape
  [`^@skyrocketjs`],
  // Absolute imports and other imports such as Vue-style `@/foo`.
  // Anything that does not start with a dot.
  ['^[^.]'],
  // Relative imports.
  // Anything that starts with a dot.
  // eslint-disable-next-line no-useless-escape
  [`^\.`],
];

module.exports = {
  parser: 'babel-eslint',
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier', 'qunit', 'simple-import-sort', 'import'],
  extends: ['eslint:recommended', 'prettier', 'plugin:qunit/recommended'],
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': ['error', { args: 'none' }],
    'no-cond-assign': ['error', 'except-parens'],
    eqeqeq: 'error',
    'no-eval': 'error',
    'new-cap': ['error', { capIsNew: false }],
    'no-caller': 'error',
    'no-eq-null': 'error',
    'no-console': 'error', // no longer recommended in eslint v6, this restores it
    'simple-import-sort/sort': ['error', { groups: ImportSortGroups }],
    'sort-imports': 'off',
    'import/order': 'off',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    // this rule doesn't work properly with --fix
    // https://github.com/benmosher/eslint-plugin-import/issues/1504
    'import/no-duplicates': 'warn',

    // Too many false positives
    // See https://github.com/eslint/eslint/issues/11899 and similar
    'require-atomic-updates': 'off',

    // eslint-plugin-qunit
    'qunit/assert-args': 'off',
    'qunit/literal-compare-order': 'off',
    'qunit/no-identical-names': 'off',
    'qunit/no-ok-equality': 'off',
    'qunit/require-expect': 'off',
    'qunit/resolve-async': 'off',
  },
  globals: {
    Map: true,
    WeakMap: true,
    Set: true,
    Promise: true,
  },
  env: {
    browser: false,
    node: true,
  },
  overrides: [
    // TypeScript Node files
    {
      files: ['packages/schema/src/**/*.ts', 'packages/compiler/src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint', 'simple-import-sort', 'import'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
        'no-unused-vars': 'off',
        'require-atomic-updates': 'off',
        'simple-import-sort/sort': ['error', { groups: ImportSortGroups }],
        'sort-imports': 'off',
        'import/order': 'off',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        // this rule doesn't work properly with --fix
        // https://github.com/benmosher/eslint-plugin-import/issues/1504
        'import/no-duplicates': 'warn',
      },
      env: {
        browser: false,
        node: true,
        es6: true,
      },
    },

    // JavaScript Node files
    {
      files: [
        '.eslintrc.js',
        '.prettierrc.js',
        'bin/**',
        'packages/ember/.ember-cli.js',
        'packages/*/.eslintrc.js',
        'packages/*/.template-lintrc.js',
        'packages/ember/ember-cli-build.js',
        'packages/*/Brocfile.js',
        'packages/*/index.js',
        'packages/*/testem.js',
        'packages/*/blueprints/*/index.js',
        'packages/ember/config/**/*.js',
        'packages/ember/tests/dummy/config/**/*.js',
        'packages/unpublished_*/ember-cli-build.js',
        'packages/unpublished_*/.ember-cli.js',
        'packages/unpublished_*/config/**/*.js',
        'packages/unpublished_*/tests/dummy/config/**/*.js',
        'packages/*/tests/**/*.js',
      ],
      excludedFiles: [
        'packages/ember/addon/**',
        'packages/ember/app/**',
        'packages/ember/tests/**',
        'packages/ember/tests/dummy/app/**',
        'packages/unpublished_*/addon/**',
        'packages/unpublished_*/app/**',
        'packages/unpublished_*/tests/**',
        'packages/unpublished_*/tests/dummy/app/**',
        'packages/compiler/tests/fixtures/**',
        'packages/schema/tests/fixtures/**',
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2018,
      },
      env: {
        browser: false,
        node: true,
        es6: true,
      },
      plugins: ['node', 'import'],
      extends: 'plugin:node/recommended',
      rules: {
        'simple-import-sort/sort': 'off',
        'no-restricted-globals': 'off',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        'import/order': ['error', { 'newlines-between': 'always' }],
      },
    },

    // Node tests
    {
      files: ['packages/*/tests/**/*-test.js'],
      excludedFiles: ['packages/ember/tests/**'],
      env: {
        qunit: true,
      },
      rules: {
        'no-restricted-globals': 'off',
      },
    },

    // bin files
    {
      files: ['bin/**'],
      // eslint-disable-next-line node/no-unpublished-require
      rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
        'no-console': 'off',
        'no-process-exit': 'off',
        'node/no-unpublished-require': 'off',
        'node/no-unsupported-features/node-builtins': 'off',
      }),
    },

    // Browser Typescript Files
    {
      files: ['packages/worker/src/**/*.ts', 'packages/service/src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint', 'simple-import-sort', 'import'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
        'no-unused-vars': 'off',
        'require-atomic-updates': 'off',
        'simple-import-sort/sort': ['error', { groups: ImportSortGroups }],
        'sort-imports': 'off',
        'import/order': 'off',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        // this rule doesn't work properly with --fix
        // https://github.com/benmosher/eslint-plugin-import/issues/1504
        'import/no-duplicates': 'warn',
      },
      env: {
        browser: true,
        node: false,
        es6: true,
      },
    },

    // Browser Javascript Files
    {
      extends: ['eslint:recommended', 'plugin:ember/recommended'],
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      env: {
        browser: true,
        node: false,
      },
      files: [
        'packages/ember/addon/**',
        'packages/ember/app/**',
        'packages/ember/tests/**',
        'packages/ember/tests/dummy/app/**',
        'packages/unpublished_*/addon/**',
        'packages/unpublished_*/app/**',
        'packages/unpublished_*/tests/**',
        'packages/unpublished_*/tests/dummy/app/**',
        'packages/compiler/tests/fixtures/**/*.js',
        'packages/schema/tests/fixtures/**/*.js',
      ],
      excludedFiles: ['packages/ember/tests/dummy/config/**', 'packages/unpublished_*/tests/dummy/config/**'],
      globals: {
        Promise: false,
      },
      rules: {
        'ember/no-jquery': 'error',
        'no-restricted-globals': ['error', { name: 'Promise', message: 'Global Promise does not work in IE11' }],
      },
    },
  ],
};
