#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const { prompt } = require("inquirer");

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
	.option("-d, --deps <deps>", "name of siblings package, e.g. `pkg1` or `pkg1,pkg2`")
	.description("Create monorepo's package")
	.action(async (pkg, cmd) => {
		validPkgName(pkg);

		const exists = await isPkgExists(pkg);

		if (exists) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${pkg}\` already exists! `));
			return;
		}

		await runCmd("creation", {
			pkgNames: pkg,
			deps: cmd.deps
		});
	});

program
	.command("deps <deps>")
	.option("-t, --target <target>", "target package name,e.g. foo、@foo/bar")
	.option("-r, --rm", "is remove deps from package")
	.description("Add deps to target monorepo's package, e.g. add foo,foo@1.2.2,foo:D,foo@1.2.2:D ")
	.action(async (deps, cmd) => {
		if (cmd.target) {
			validPkgName(cmd.target);

			const exists = await isPkgExists(cmd.target);

			if (!exists) {
				console.log(chalk.red.bold(`[siu] ERROR: \`${cmd.target}\` does not exists! `));
				return;
			}
		}
		if (deps) {
			await runCmd("deps", {
				pkgNames: cmd.target,
				deps,
				action: cmd.rm ? "rm" : "add"
			});
		}
	});

program
	.command("doc [pkgs]")
	.description("Generate docs of target monorepo's package")
	.action(async pkgs => {
		const arr = findUnfoundPkgs(pkgs);

		if (arr.length) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${arr.join(",")}\` does not exists!`));
			return;
		}

		await runCmd("genDocs", { pkgNames: pkgs });
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

		await runCmd("test", { pkgNames: pkgs });
	});

program
	.command("build [pkgs]")
	.option("-f, --format <format>", "Output format: es、cjs、umd、umd-min")
	.description("Build single of multiple monorepo's package")
	.action(async (pkgs, cmd) => {
		const arr = findUnfoundPkgs(pkgs);

		if (arr.length) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${arr.join(",")}\` does not exists!`));
			return;
		}

		await runCmd("build", { pkgNames: pkgs, format: cmd.format });
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
	.action(async cmd => {
		await runCmd("glint", { hook: cmd.hook });
	});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
	program.outputHelp();
}
