import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ms from "pretty-ms";

import {
	asRollupPlugin,
	Config,
	generateDTSWithTSC,
	SiuRollupBuilder,
	stopService,
	TOutputFormatKey
} from "@siujs/builder";
import { HookHandlerApi } from "@siujs/core";

type TransformConfigHook = (config: Config, format: TOutputFormatKey) => void | Promise<void>;

export async function onBuildStart({ ctx, next }: HookHandlerApi) {
	ctx.keys("startTime", Date.now());

	await fs.remove(path.resolve(ctx.currentPkg().pkgData().path, "./dist"));

	await next();
}

export async function onBuildProc({ ctx, opts, next }: HookHandlerApi) {
	const customTransform = opts<TransformConfigHook>("transformConfig");

	const pkgData = ctx.currentPkg().pkgData();

	const builder = new SiuRollupBuilder(pkgData, {
		async onConfigTransform(config: Config, format: TOutputFormatKey) {
			config.plugin("esbuild").use(asRollupPlugin(), [
				{
					sourcemap: true,
					loaders: {
						".js": "js",
						".ts": "ts"
					}
				}
			]);

			config.plugin("babel").use(require("rollup-plugin-babel"), [
				{
					extensions: [".mjs", ".cjs", ".js", ".es", ".es6"],
					include: ["packages/**/*"],
					// 自定会去读取目标项目的.babelrc文件配置
					root: pkgData.root
				}
			]);

			if (customTransform) {
				await customTransform(config, format);
			}
		},
		async onBuildError(ex: Error) {
			await next(ex);
		}
	});
	await builder.build();
	console.log();
	await generateDTSWithTSC(pkgData);
	await next();
}

export async function onBuildComplete({ ctx }: HookHandlerApi) {
	console.log(
		chalk.green(
			`\n✔ Builded ${chalk.bold(ctx.currentPkg().pkgData().name)} in ${chalk.bold(
				ms(Date.now() - ctx.keys<number>("startTime"))
			)}!`
		)
	);
}

export async function onBuildError({ ctx }: HookHandlerApi) {
	console.log(chalk.redBright(ctx.ex()));
}

export async function onBuildClean({ ctx }: HookHandlerApi) {
	/**
	 * 关闭esbuild的servie
	 *
	 *  note: 放在clean周期而不是放在buildComplete或者Builder.finished这几个地方主要是为了当前项目全程保持esbuild service进程一直存在,可以缩短项目编译时间
	 */
	stopService();

	const pkgData = ctx.currentPkg().pkgData();

	await Promise.all([
		fs.remove(path.resolve(pkgData.path, "./dts_dist")),
		fs.remove(path.resolve(pkgData.path, "./temp")),
		fs.remove(path.resolve(pkgData.path, "./tsconfig.tsbuildinfo"))
	]);
}
