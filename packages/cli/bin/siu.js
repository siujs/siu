#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const { prompt } = require("inquirer");

const { validPkgName, initCommanders, runCmd } = require("../dist/index");

program.version(fs.readJSONSync(path.resolve(__dirname, "../package.json")).version);

program
	.command("init <template> <app>")
	.option("-s,--source <source>", "source of template: gitlab、github、gitee or self private git-repo url")
	.description("Generate project from a remote template")
	.action(async (template, app, cmd) => {
		const usrStdin = {
			appName: app,
			cwd: path.resolve(process.cwd(), app),
			template,
			source: cmd.source
		};
		const isCurrent = app === ".";

		const name = isCurrent ? path.basename(usrStdin.cwd) : app;

		validPkgName(name);

		if (isCurrent) {
			const { ok } = await prompt([
				{
					name: "ok",
					type: "confirm",
					message: `Generate project in current directory?`
				}
			]);

			if (!ok) return;
		} else if (fs.pathExistsSync(usrStdin.cwd)) {
			console.log(chalk.red(`Target directory is not empty!`));
			return;
		}

		await runCmd("init", usrStdin);
	});

(async () => {
	await initCommanders();
})();
