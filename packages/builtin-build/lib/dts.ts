import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import shell from "shelljs";

import { PkgData } from "@siujs/utils";

/**
 *
 * Use `api-extractor` to generate types definition
 *
 * @param pkgData current package data
 *
 * @property {string} pkgData.path current package path
 * @property {string} pkgData.name current package name
 * @property {Record<string,any>} [pkgData.meta] current package.json data of package
 */
export async function generateDTS(pkgData: PkgData) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { Extractor, ExtractorConfig } = require("@microsoft/api-extractor");

	const extractorConfigPath = path.resolve(pkgData.path, `api-extractor.json`);

	const exists = await fs.pathExists(extractorConfigPath);

	if (!exists) return;

	console.log(chalk.bold(chalk.yellow(`Building type definitions for ${pkgData.name}...`)));

	const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath);
	const extractorResult = Extractor.invoke(extractorConfig, {
		localBuild: true,
		showVerboseMessages: true
	});

	if (extractorResult.succeeded) {
		// concat additional d.ts to rolled-up dts
		const typesDir = path.resolve(pkgData.path, "types");
		if (fs.existsSync(typesDir)) {
			const dtsPath = path.resolve(pkgData.path, pkgData.meta?.types);
			const existing = await fs.readFile(dtsPath, "utf-8");
			const typeFiles = await fs.readdir(typesDir);
			const toAdd = await Promise.all(typeFiles.map(file => fs.readFile(path.resolve(typesDir, file), "utf-8")));
			await fs.writeFile(dtsPath, toAdd.join("\n") + "\n" + existing);
		}
		console.log(chalk.bold(chalk.green(`API Extractor completed successfully.`)));
	} else {
		console.error(
			`API Extractor completed with ${extractorResult.errorCount} errors` +
				` and ${extractorResult.warningCount} warnings`
		);
		process.exitCode = 1;
	}
}

/**
 *
 * Use tsc and `api-extractor` to generate types definition
 *
 * @param pkgData current package data
 *
 * @property {string} pkgData.path current package path
 * @property {string} pkgData.name current package name
 * @property {Record<string,any>} [pkgData.meta] current package.json data of package
 */
export async function generateDTSWithTSC(pkgData: PkgData) {
	const pkgRoot = path.resolve(pkgData.path, "../../");

	const tscCmdPath = path.resolve(pkgRoot, "node_modules/.bin/tsc");

	const exists = await fs.pathExists(tscCmdPath);

	if (!exists) {
		throw new Error(`[@siujs/builtin-build] Error: Cant't find typescript in \`${pkgRoot}\``);
	}

	shell.exec(`${tscCmdPath} --emitDeclarationOnly`, {
		cwd: pkgData.path
	});

	await generateDTS(pkgData);
}
