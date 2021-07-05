import eslint from '@rollup/plugin-eslint';
import { terser } from 'rollup-plugin-terser';
import gzipPlugin from 'rollup-plugin-gzip';

export default [
  {
    input: 'src/index.mjs',
    plugins: [
      eslint(),
      terser(),
      gzipPlugin()
    ],
    output: {
      format: 'umd',
      name: 'Tarhon',
      file: 'build/tarhon.js'
    }
  },
  {
    input: 'src/index.mjs',
    plugins: [
      eslint(),
      terser(),
      gzipPlugin()
    ],
    output: {
      format: 'esm',
      file: 'build/tarhon.mjs'
    }
  }
];
