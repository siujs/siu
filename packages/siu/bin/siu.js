#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");

const { validPkgName, isPkgExists, findUnfoundPkgs, runCmd } = require("../dist/index");

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

program
	.command("create <pkg>")
	.option("-d, --deps <deps>", "dependencies of siblings package name, e.g. `pkg1` or `pkg1,pkg2`")
	.description("Create monorepo's package")
	.action(async (pkg, cmd) => {
		validPkgName(pkg);

		const exists = await isPkgExists(pkg);

		if (exists) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${pkg}\` already exists! `));
			return;
		}

		await runCmd("creation", {
			pkgs: pkg,
			deps: cmd.deps
		});
	});

program
	.command("add [deps]")
	.option("-t, --target <target>", "target package name,e.g. foo、@foo/bar")
	.description("Add deps to target monorepo's package")
	.action(async (deps, cmd) => {});

program
	.command("doc [pkgs]")
	.description("Generate docs of target monorepo's package")
	.action(async pkgs => {
		const arr = findUnfoundPkgs(pkgs);

		if (arr.length) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${arr.join(",")}\` does not exists!`));
			return;
		}

		await runCmd("genDocs", { pkgs });
	});

program
	.command("test [pkgs]")
	.description("Test single of multiple monorepo's package")
	.action(async pkgs => {
		const arr = findUnfoundPkgs(pkgs);

		if (arr.length) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${arr.join(",")}\` does not exists!`));
			return;
		}

		await runCmd("test", { pkgs });
	});

program
	.command("build [pkgs]")
	.description("Build single of multiple monorepo's package")
	.action(async pkgs => {
		const arr = findUnfoundPkgs(pkgs);

		if (arr.length) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${arr.join(",")}\` does not exists!`));
			return;
		}

		await runCmd("build", { pkgs });
	});

program
	.command("publish")
	.description("Publish packages")
	.action(async () => {
		await runCmd("publish", {});
	});

program
	.command("glint")
	.description("Lint for git action")
	.option(
		"-h, --hook <hook>",
		"Git lifecycle hook: pre-commit、prepare-commit-msg、commit-msg、post-commit、post-merge"
	)
	.action(async () => {});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
	program.outputHelp();
}
