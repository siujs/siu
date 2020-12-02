import chalk from "chalk";
import fs from "fs-extra";
import glob from "glob";
import path from "path";
import ms from "pretty-ms";

import { asRollupPlugin, Config, SiuRollupBuilder, stopService, TOutputFormatKey } from "@siujs/builder";
import { HookHandlerContext, HookHandlerNext, plugin } from "@siujs/core";

const plug = plugin({
	build: {
		sourceDir: "lib",
		destDir: "es"
	}
});

plug.build.start(async (ctx: HookHandlerContext, next: HookHandlerNext) => {
	const sourceDir = ctx.opts<string>("sourceDir");

	if (!sourceDir) {
		await next(new Error(`ERROR: 'sourceDir' options can't be emtpy!`));
		return;
	}

	const destDir = ctx.opts<string>("destDir") || "es";

	ctx.keys("startTime", Date.now());

	await fs.remove(path.resolve(ctx.pkg().path, destDir));

	await next();
});

plug.build.process(async (ctx: HookHandlerContext, next: HookHandlerNext) => {
	const pkgData = ctx.pkg();

	const sourceESDirPath = path.resolve(pkgData.path, ctx.opts<string>("sourceDir"));

	const destESDir = path.resolve(pkgData.path, ctx.opts<string>("destDir") || "es");

	const bablePluginImportBuilder = new SiuRollupBuilder(pkgData, {
		onEachBuildStart(config: Config) {
			const outputs = config.toOutput();

			const input = sourceESDirPath + "/**/*.ts";

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

			const sourceESDirFiles = glob.sync("**/*.ts", { cwd: sourceESDirPath }).reduce((prev, cur) => {
				prev[cur.replace(".ts", "")] = path.resolve(sourceESDirPath, cur);
				return prev;
			}, {} as Record<string, string>);

			config
				.input(sourceESDirFiles)
				.output(format)
				.format("es")
				.dir(destESDir)
				.entryFileNames("[name].js")
				.set("file", void 0)
				.end()
				.plugin("esbuild")
				.use(asRollupPlugin(), [{ sourcemap: true, loaders: { ".js": "js", ".ts": "ts" } }]);
		}
	});

	await bablePluginImportBuilder.build({
		allowFormats: ["es"],
		sizeCalc: false
	});

	await next();
});

plug.build.complete((ctx: HookHandlerContext) => {
	console.log(
		chalk.green(
			`\n✔ Builded ${chalk.bold(ctx.pkg().name)} in ${chalk.bold(ms(Date.now() - ctx.keys<number>("startTime")))}!`
		)
	);
});

plug.build.error((ctx: HookHandlerContext) => {
	console.log(chalk.redBright(ctx.ex()));
});

plug.build.clean(() => {
	stopService();
});
