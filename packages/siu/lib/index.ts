import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import validProjectName from "validate-npm-package-name";

import { simpleBuild } from "@siujs/cmd-build";
import { changeDeps } from "@siujs/cmd-deps";
import { lintWithGHooks } from "@siujs/cmd-glint";
import { initApp } from "@siujs/cmd-init";
import { release } from "@siujs/cmd-publish";
import { applyPlugins, applyPluginsNoPkg, getPkgDirName, hasCommandHooks, PluginCommand } from "@siujs/core";

interface CommonOptions {
	pkgs?: string;
	[x: string]: any;
}

/**
 *
 * valid package name
 *
 * @param name input name
 */
export function validPkgName(name: string) {
	const result = validProjectName(name);

	if (!result.validForNewPackages) {
		console.error(chalk.red(`Invalid name: "${name}"`));

		if ("errors" in result) {
			result.errors.forEach(err => {
				console.error(chalk.red.dim("Error: " + err));
			});
		}

		if ("warnings" in result) {
			result.warnings.forEach(warn => {
				console.error(chalk.red.dim("Warning: " + warn));
			});
		}

		process.exit(1);
	}
}

/**
 *
 * package is exists
 *
 * @param name package name
 */
export async function isPkgExists(name: string) {
	const dirName = getPkgDirName(name);

	const pkgs = await fs.readdir(path.resolve(process.cwd(), "packages"));

	return pkgs.includes(dirName);
}

export async function findUnfoundPkgs(pkgs: string) {
	const unfoundPkgs = [] as string[];

	if (!pkgs) return unfoundPkgs;

	const arr = pkgs.split(",");
	let exists: boolean;

	for (let l = arr.length; l--; ) {
		exists = await isPkgExists(arr[l]);
		if (!exists) {
			unfoundPkgs.push(arr[l]);
		}
	}

	return unfoundPkgs;
}

/**
 *
 * run client command
 *
 * @param cmd client command
 * @param options client command payload options
 */
export async function runCmd<T extends CommonOptions>(cmd: PluginCommand | "init", options: T) {
	if (cmd === "init") {
		await initApp(options as any);
		return;
	}

	const { pkgNames, ...rest } = options || ({} as Record<string, any>);

	try {
		if (!hasCommandHooks(cmd)) {
			switch (cmd) {
				case "build":
					// invoke official processing: cmd-build
					return await simpleBuild(pkgNames);
				case "deps":
					// invoke official processing: cmd-deps
					return await changeDeps(pkgNames, rest.deps, rest.action);
				case "glint":
					// invoke official processing: cmd-glint
					return await lintWithGHooks(options.hook, process.cwd());
				case "publish":
					// invoke official processing: cmd-publish
					return await release();
			}

			console.log(chalk.yellowBright(`[siu] Warning: Can't find any plugins to handle '${cmd}'`));
			return;
		}

		cmd === "glint" || cmd === "deps" || cmd === "publish"
			? await applyPluginsNoPkg(cmd, options)
			: await applyPlugins(cmd, options);
	} catch (ex) {
		console.error(ex);
		process.exit(1);
	}
}
