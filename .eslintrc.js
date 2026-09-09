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

    // Aturan airbnb di bawah ini dibuat untuk React + propTypes, bukan TypeScript.
    // Di repo ini TypeScript sudah menjamin hal yang sama, jadi mereka hanya
    // menghasilkan ratusan error gaya tanpa menangkap bug.
    'react/function-component-definition': 'off', // arrow FC dan function declaration sama-sama dipakai
    'react/require-default-props': 'off', // prop opsional TS diberi default lewat destructuring
    'react/no-unused-prop-types': 'off', // tidak bisa melacak prop dari type alias generik
    // `search`/`filter` pada <Table> adalah render prop — dipanggil sebagai fungsi,
    // bukan dirender sebagai JSX, sehingga tidak ada remount.
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    // Versi dasar menandai `(a = {}, b?: T)` padahal parameter opsional TS sah di posisi akhir.
    'default-param-last': 'off',
    '@typescript-eslint/default-param-last': 'error',
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
