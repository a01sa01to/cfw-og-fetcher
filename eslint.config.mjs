import myConfig from '@a01sa01to/eslint-config'

export default [
  ...myConfig.default,
  { ignores: ['.yarn/*', '.pnp*', '**/dist/*', 'worker-configuration.d.ts'] },
]
