module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', '*.gen.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    // React 규칙
    'react-refresh/only-export-components': 'off',

    // 명명 규칙 (Naming Conventions)
    '@typescript-eslint/naming-convention': [
      'warn',
      // 변수: camelCase (상수는 UPPER_CASE 허용)
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
      // 함수: camelCase (React 컴포넌트는 PascalCase)
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      // 클래스: PascalCase
      {
        selector: 'class',
        format: ['PascalCase'],
      },
      // 인터페이스: PascalCase (I 접두사 없음)
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      // 타입: PascalCase
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      // Enum: PascalCase
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      // Enum 멤버: UPPER_CASE 또는 PascalCase
      {
        selector: 'enumMember',
        format: ['UPPER_CASE', 'PascalCase'],
      },
      // 메서드: camelCase
      {
        selector: 'method',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      // 프로퍼티: camelCase (API 응답 매핑용 snake_case 예외 허용)
      {
        selector: 'property',
        format: ['camelCase', 'snake_case', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
      // 파라미터: camelCase
      {
        selector: 'parameter',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
    ],

    // 코드 품질 규칙
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    eqeqeq: ['warn', 'always', { null: 'ignore' }],

    // TypeScript 규칙
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
};


