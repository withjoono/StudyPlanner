module.exports = {
  // TypeScript/JavaScript 파일: ESLint + Prettier
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],

  // JavaScript 파일
  '*.{js,jsx}': ['eslint --fix', 'prettier --write'],

  // JSON 파일: Prettier만
  '*.json': ['prettier --write'],

  // Markdown 파일: Prettier만
  '*.md': ['prettier --write'],

  // CSS 파일: Prettier만
  '*.css': ['prettier --write'],
};


