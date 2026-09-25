import eslint from '@eslint/js';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/storybook-static/**',
      '**/.storybook-cache/**',
      '**/build/**',
    ],
  },
  eslint.configs.recommended,
];