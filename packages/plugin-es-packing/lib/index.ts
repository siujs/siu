import chalk from "chalk";
import fs from "fs-extra";
import glob from "glob";
import path from "path";
import ms from "pretty-ms";

import { HookHandlerApi, plugin } from "@siujs/core";
import { asRollupPlugin, Config, SiuRollupBuilder, stopService, TOutputFormatKey } from "@siujs/rollup";

const plug = plugin({
	build: {
		targetDir: "lib"
	}
});

plug.build.start(async ({ ctx, opts, next }: HookHandlerApi) => {
	const targetDir = opts<string>("targetDir");

	if (!targetDir) {
		await next(new Error(`ERROR: 'targetDir' options can't be emtpy!`));
		return;
	}

	ctx.keys("startTime", Date.now());

	await fs.remove(path.resolve(ctx.currentPkg().pkgData().path, "./dist/es"));

	await next();
});

plug.build.proc(async ({ ctx, opts, next }: HookHandlerApi) => {
	const pkgData = ctx.currentPkg().pkgData();

	const destESDir = path.resolve(pkgData.path, opts<string>("targetDir"));

	const bablePluginImportBuilder = new SiuRollupBuilder(pkgData, {
		onEachBuildStart(config: Config) {
			const outputs = config.toOutput();

			const input = destESDir + "/**/*.ts";

			console.log(
				chalk.cyan(
					`bundles ${chalk.bold(input)} → ${outputs
						.map(output => chalk.bold(output.file || path.resolve(output.dir, <string>output.entryFileNames)))
						.join(",")}`
				)
			);
		},
		onConfigTransform(config: Config, format: TOutputFormatKey) {
			if (format !== "es") return;

			const destESFiles = glob.sync("**/*.ts", { cwd: destESDir }).reduce((prev, cur) => {
				prev[cur.replace(".ts", "")] = path.resolve(destESDir, cur);
				return prev;
			}, {} as Record<string, string>);

			config
				.input(destESFiles)
				.output(format)
				.format("es")
				.dir(path.resolve(pkgData.path, "./dist/es"))
				.entryFileNames("[name].js")
				.set("file", void 0)
				.end()
				.plugin("esbuild")
				.use(asRollupPlugin(), [{ sourcemap: true, loaders: { ".ts": "ts" } }]);
		}
	});

	await bablePluginImportBuilder.build({
		allowFormats: ["es"],
		sizeCalc: false
	});

	await next();
});

plug.build.complete(({ ctx }: HookHandlerApi) => {
	console.log(
		chalk.green(
			`\n✔ Builded ${chalk.bold(ctx.currentPkg().pkgData().name)} in ${chalk.bold(
				ms(Date.now() - ctx.keys<number>("startTime"))
			)}!`
		)
	);
});

plug.build.error(({ ctx }: HookHandlerApi) => {
	console.log(chalk.redBright(ctx.ex()));
});

plug.build.clean(() => {
	stopService();
});
