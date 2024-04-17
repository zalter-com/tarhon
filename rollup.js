const path = require("path");
const rollup = require("rollup");
const loadConfigFile = require("rollup/dist/loadConfigFile");
const del = require("del");

const configFile = path.resolve(__dirname, "rollup.config.dev.mjs");
const commandOptions = {};

loadConfigFile(configFile, commandOptions)
	.then(async ({ options, warnings }) => {
		console.info(`We currently have ${warnings.count} warnings`);

		warnings.flush();

		// Cleanup previous built files
		// Maybe get from options.output.dir
		del(["dist"]);

		for (const optionsObj of options) {
			const bundle = await rollup.rollup(optionsObj);
			await Promise.all(optionsObj.output.map(bundle.write));
		}

		const watcher = rollup.watch(options);

		watcher.on("event", ({ code, result }) => {
			if (code === "BUNDLE_END") {
				result.close();
			}
		});
	});
