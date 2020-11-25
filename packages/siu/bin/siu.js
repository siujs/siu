#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const validProjectName = require("validate-npm-package-name");

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

		const { runCmd } = require("../dist/index");

		await runCmd("init", usrStdin);
	});

program
	.command("create <pkg>")
	.option("-d, --deps <deps>", "dependencies of siblings package name, e.g. `pkg1` or `pkg1,pkg2`")
	.description("Create monorepo's package")
	.action(async (pkg, cmd) => {});

program
	.command("add [deps]")
	.option("-t, --target <target>", "target package name,e.g. foo、@foo/bar")
	.description("Add deps to target monorepo's package")
	.action(async (deps, cmd) => {});

program
	.command("doc [pkgs]")
	.description("Generate docs of target monorepo's package")
	.action(async (pkgs, cmd) => {});

program
	.command("test [pkgs]")
	.description("Test single of multiple monorepo's package")
	.action(async (pkgs, cmd) => {});

program
	.command("build [pkgs]")
	.description("Build single of multiple monorepo's package")
	.action(async (pkgs, cmd) => {});

program
	.command("publish")
	.description("Publish packages")
	.action(async cmd => {});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
	program.outputHelp();
}
