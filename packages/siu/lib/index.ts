import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import validProjectName from "validate-npm-package-name";

import { applyPlugins, PkgCommand } from "@siujs/core";
import { initApp } from "@siujs/init-app";
import { resolvePkgDirName } from "@siujs/utils";

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

		result.errors &&
			result.errors.forEach(err => {
				console.error(chalk.red.dim("Error: " + err));
			});

		result.warnings &&
			result.warnings.forEach(warn => {
				console.error(chalk.red.dim("Warning: " + warn));
			});

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
	const dirName = resolvePkgDirName(name);

	const pkgs = await fs.readdir(path.resolve(process.cwd(), "packages"));

	return pkgs.includes(dirName);
}

export async function findUnfoundPkgs(pkgs: string) {
	const arr = pkgs.split(",");

	const unfoundPkgs = [] as string[];

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
export async function runCmd<T extends CommonOptions>(cmd: PkgCommand | "init", options: T) {
	if (cmd === "init") {
		await initApp(options as any);
		return;
	}

	const { pkgs, ...rest } = options || {};
	try {
		await applyPlugins(cmd, pkgs, rest);
	} catch (ex) {
		console.error(ex);
		process.exit(1);
	}
}
