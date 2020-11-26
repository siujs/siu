import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import { HookHandlerApi } from "@siujs/core";

export async function onBuildStart({ ctx, next }: HookHandlerApi) {
	ctx.keys("startTime", Date.now());

	await fs.remove(path.resolve(ctx.currentPkg().pkgData().path, "./dist"));

	await next();
}

export async function onBuildProc({ ctx, opts, next }: HookHandlerApi) {}

export async function onBuildComplete({ ctx }: HookHandlerApi) {}

export async function onBuildError({ ctx }: HookHandlerApi) {
	console.log(chalk.redBright(ctx.ex()));
}
