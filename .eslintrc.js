/* eslint-disable prettier/prettier */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb',
    'plugin:prettier/recommended',
    'airbnb/hooks',
  ],
  settings: {
    react: {
      version: 'detect', // Automatically detect the react version
    },
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.js', '.css', '.json', '.tsx', '.ts'],
      },
      typescript: {},
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020, // Use the latest ecmascript standard
    sourceType: 'module', // Allows using import/export statements
    ecmaFeatures: {
      jsx: true, // Enable JSX since we"re using React
    },
  },
  plugins: ['@typescript-eslint', 'prettier', 'simple-import-sort'],
  ignorePatterns: ['*.d.ts'],
  rules: {
    camelcase: 'off',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'simple-import-sort/sort': 'off',
    '@typescript-eslint/indent': [0],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/camelcase': 'off',
    'react/jsx-filename-extension': [0],
    'react/jsx-props-no-spreading': [0],
    'react/prop-types': [0],
    'react/jsx-key': 'error',
    'no-use-before-define': 'off',
    'import/extensions': 'off',
    'import/newline-after-import': 'off',
    'import/prefer-default-export': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/anchor-is-valid': [
      'off',
      {
        components: ['Link'],
        specialLink: ['hrefLeft', 'hrefRight'],
        aspects: ['noHref', 'invalidHref', 'preferButton'],
      },
    ],
    'no-shadow': 'off',
    'prettier/prettier': [
      'error',
      {
        usePrettierrc: true,
      },
    ],
  },
  globals: {
    React: true,
    google: true,
    mount: true,
    mountWithRouter: true,
    shallow: true,
    shallowWithRouter: true,
    context: true,
    expect: true,
    jsdom: true,
    JSX: 'readonly',
  },
};
