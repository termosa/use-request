import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

export default [
  {
    input: 'src/browser.tsx',
    external: ['react'],
    plugins: [typescript(), terser()],
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'useRequest',
      exports: 'default',
      sourcemap: true,
      globals: {
        react: 'React',
      },
    },
  },
  {
    input: 'src/index.tsx',
    external: ['react'],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: 'es',
        exports: 'named',
        sourcemap: true,
      },
    ],
    plugins: [typescript()],
  },
]
