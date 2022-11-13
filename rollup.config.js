import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

export default [
  {
    input: 'src/browser.tsx',
    plugins: [typescript(), terser()],
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'useRequest',
      exports: 'default',
      sourcemap: true,
      interop: false,
      globals: {
        react: 'React',
      },
    },
  },
  {
    input: 'src/index.tsx',
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
