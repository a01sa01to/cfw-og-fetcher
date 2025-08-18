import myConfig from '@a01sa01to/eslint-config'

export default [
  ...myConfig.default,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  { ignores: ['.yarn/*', '.pnp*', '**/dist/*', 'worker-configuration.d.ts'] },
]
