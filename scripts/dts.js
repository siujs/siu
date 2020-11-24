const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const shelljs = require("shelljs");

const packagesRoot = path.resolve(__dirname, "../packages/");

const pkgDirList = ["utils", "core", "cli"];

async function runApiExtractor(pkgName) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { Extractor, ExtractorConfig } = require("@microsoft/api-extractor");

	const extractorConfigPath = path.resolve(path.resolve(packagesRoot, pkgName), `api-extractor.json`);

	const exists = await fs.pathExists(extractorConfigPath);

	if (!exists) return;

	console.log(chalk.bold(chalk.yellow(`Building type definitions for ${pkgName}...`)));

	const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath);
	const extractorResult = Extractor.invoke(extractorConfig, {
		localBuild: true,
		showVerboseMessages: true
	});

	if (extractorResult.succeeded) {
		console.log(chalk.bold(chalk.green(`API Extractor completed successfully.`)));
	} else {
		console.error(
			`API Extractor completed with ${extractorResult.errorCount} errors` +
				` and ${extractorResult.warningCount} warnings`
		);
		process.exitCode = 1;
	}
}

(async () => {
	for (let i = 0; i < pkgDirList.length; i++) {
		shelljs.exec("tsc --emitDeclarationOnly", {
			cwd: path.resolve(packagesRoot, pkgDirList[i])
		});
		await runApiExtractor(pkgDirList[i]);
	}
})();
