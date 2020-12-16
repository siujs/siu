import chalk from "chalk";
import program from "commander";
import validProjectName from "validate-npm-package-name";

import { initApp } from "@siujs/cli-init";
import {
	applyPluginCommandOptions,
	applyPlugins,
	applyPluginsNoPkg,
	hasHooks,
	loadPlugins,
	PluginCommand
} from "@siujs/core";
import { filterUnExistsPkgs, isPkgExists } from "@siujs/utils";

import { loadDefaultCommander, loadFallback } from "./builtins";

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

const handleWithPkgAction = async (pkg: string, cmd: any, cmdText: PluginCommand) => {
	const arr = await filterUnExistsPkgs(pkg);
	if (arr.length) {
		console.log(chalk.red.bold(`[siu] ERROR: \`${arr.join(",")}\` does not exists!`));
		return;
	}
	await runCmd(cmdText, { pkg, ...cmd.opts() });
};

const DEFAULT_COMMAND = {
	create: program
		.command("create <pkg>")
		.description("Create monorepo's package")
		.action(async (pkg, cmd) => {
			validPkgName(pkg);
			const exists = await isPkgExists(pkg);
			if (exists) {
				console.log(chalk.red.bold(`[siu] ERROR: \`${pkg}\` already exists! `));
				return;
			}
			await runCmd("create", { pkg, ...cmd.opts() });
		}),
	deps: program
		.command("deps <deps>")
		.option("-p, --pkg <pkg>", "target package name,e.g. foo、@foo/bar")
		.option("-r, --rm", "is remove deps from package")
		.description("Add deps to target monorepo's package, e.g. add foo,foo@1.2.2,foo:D,foo@1.2.2:D ")
		.action(async (deps, cmd) => {
			if (cmd.pkg) {
				validPkgName(cmd.pkg);
				const exists = await isPkgExists(cmd.target);
				if (!exists) {
					console.log(chalk.red.bold(`[siu] ERROR: \`${cmd.target}\` does not exists! `));
					return;
				}
			}
			if (!deps) return;
			await runCmd("deps", {
				deps,
				pkg: cmd.pkg,
				action: cmd.rm ? "rm" : "add",
				...cmd.opts()
			});
		}),
	glint: program
		.command("glint")
		.description("Lint for git action")
		.option(
			"-h, --hook <hook>",
			"Git lifecycle hook: pre-commit、prepare-commit-msg、commit-msg、post-commit、post-merge"
		)
		.action(async cmd => {
			await runCmd("glint", cmd.opts());
		}),
	test: program
		.command("test [pkg]")
		.description("Test single of multiple monorepo's package")
		.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "test")),
	doc: program
		.command("doc [pkg]")
		.description("Generate docs of target monorepo's package")
		.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "doc")),
	build: program
		.command("build [pkg]")
		.description("Build single of multiple monorepo's package")
		.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "build")),
	publish: program
		.command("publish [pkg]")
		.description("publish single of multiple monorepo's package")
		.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "publish"))
};

export async function initCommanders() {
	const plugs = await loadPlugins();

	if (!plugs) {
		// 加载默认
		loadDefaultCommander();
	}

	await Promise.all(
		Object.keys(DEFAULT_COMMAND).map((key: PluginCommand) => applyPluginCommandOptions(key, DEFAULT_COMMAND[key]))
	);

	program.parse(process.argv);

	if (!process.argv.slice(2).length) {
		program.outputHelp();
	}
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

	try {
		!hasHooks(cmd) && loadFallback(cmd);

		cmd === "glint" || cmd === "deps" || cmd === "publish"
			? await applyPluginsNoPkg(cmd, options)
			: await applyPlugins(cmd, options);
	} catch (ex) {
		console.error(ex);
		process.exit(1);
	}
}
