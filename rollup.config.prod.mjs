import eslint from "@rollup/plugin-eslint";
import { terser } from "rollup-plugin-terser";
import gzipPlugin from "rollup-plugin-gzip"

export default {
	input: "src/index.mjs",
	plugins: [
		eslint(),
		terser(),
		gzipPlugin()
	],
	output: {
		dir: "dist",
		format: "esm",
		entryFileNames: '[name].mjs',
		chunkFileNames: '[name]-[hash].mjs'
	}
};
