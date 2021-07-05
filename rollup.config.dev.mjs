import eslint from '@rollup/plugin-eslint';

export default {
  input: 'src/index.mjs',
  experimentalCacheExpiry: 5,
  plugins: [
    eslint()
  ],
  watch: {
    clearScreen: true,
    exclude: 'node_modules/**'
  },
  output: {
    format: 'esm',
    file: 'build/tarhon.module.js'
  }
};
