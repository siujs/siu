import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ms from "pretty-ms";
import shell from "shelljs";

import { HookHandlerApi } from "@siujs/core";
import { downloadGit, resolvePkgDirName, startSpinner } from "@siujs/utils";

export async function onCreationStart(api: HookHandlerApi) {
	api.ctx.keys("startTime", Date.now());

	api.ctx.keys(
		"spinner",
		startSpinner(chalk.greenBright(`Creating \`${chalk.bold(api.ctx.currentPkg().pkgData().name)}\` package... `))
	);

	await api.next();
}

export async function onCreationProc(api: HookHandlerApi) {
	const pkgData = api.ctx.currentPkg().pkgData();

	await downloadGit("https://github.com/siujs/tpls", "jssdk", pkgData.path);

	/**
	 * replace placeholder chars
	 */
	const filePaths = shell.grep("-l", "__SIU_PKG_", `${pkgData.path}/**/*.*`).split("\n");

	filePaths.filter(Boolean).forEach(filePath => {
		shell.sed("-i", /__SIU_PKG_UMDNAME__/, pkgData.umdName, filePath);
		shell.sed("-i", /__SIU_PKG_DIRNAME__/, pkgData.dirName, filePath);
		shell.sed("-i", /__SIU_PKG_NAME__/, pkgData.name, filePath);
	});

	/**
	 * pretty files in current workspace
	 */
	await new Promise((resolve, reject) => {
		shell.exec(`yarn pretty`, { silent: true, cwd: pkgData.path }, (code, stdout, stderr) => {
			code === 0 ? resolve(true) : reject(stderr);
		});
	});

	const deps = api.opts<string>("deps");

	if (deps) {
		const depsArr = [] as { name: string; isDev: boolean }[];

		if (deps) {
			depsArr.push(...deps.split(",").map(dep => ({ name: dep, isDev: false })));
		}

		if (deps.length) {
			const depMetas = await Promise.all(
				depsArr.map(dep => fs.readJSON(path.resolve(pkgData.pkgsRoot, resolvePkgDirName(dep.name), "package.json")))
			);

			const pkgMeta = await fs.readJSON(pkgData.metaPath);

			if (pkgMeta) {
				depMetas.forEach((depMeta, index) => {
					pkgMeta[depsArr[index].isDev ? "devDependencies" : "dependencies"][depMeta.name] = depMeta.version;
				});

				await Promise.all([
					api.ctx.currentPkg().refreshPkgMeta(pkgMeta),
					fs.writeJSON(pkgData.metaPath, pkgMeta, {
						spaces: 2
					})
				]);
			}
		}
	}

	api.ctx.keys("spinner").stop(true);

	await api.next();
}

export async function onCreationComplete({ ctx }: HookHandlerApi) {
	console.log(
		chalk.green(`${chalk.greenBright("✔")} ${chalk.bold("Created")} ${chalk.bold(ctx.currentPkg().pkgData().name)}!`)
	);
	console.log(chalk.greenBright(`Done in ${ms(Date.now() - ctx.keys<number>("startTime"))}`));
}

export async function onCreationError({ ctx }: HookHandlerApi) {
	ctx.keys("spinner").stop(true);
	shell.rm("-rf", ctx.currentPkg().pkgData().path);
	console.log(chalk.redBright(ctx.ex()));
}
