import eslint from "@rollup/plugin-eslint";

export default {
	input: "src/index.mjs",
	experimentalCacheExpiry: 5,
	plugins: [
		eslint()
	],
	watch: {
		clearScreen: true,
		exclude: "node_modules/**"
	},
	output: {
		dir: "dist",
		format: "esm",
		entryFileNames: '[name].mjs',
		chunkFileNames: '[name]-[hash].mjs'
	}
};
