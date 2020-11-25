import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ms from "pretty-ms";
import shell from "shelljs";

import { isWindows, startSpinner } from "@siujs/utils";

interface InitAppOptios {
	cwd: string;
	appName: string;
	template: string;
	source?: "github" | "gitee";
}

const HostMap = {
	github: "github.com",
	gitee: "gitee.com"
};

function getGitInfo(template: string, source?: "github" | "gitee") {
	const tmplArr = template.split("#");

	const branch = tmplArr.length > 1 ? tmplArr[tmplArr.length - 1] : source === "github" ? "main" : "master";

	const isGitStylePath = template.startsWith("git@");

	const isHttpPath = template.startsWith("http://") || template.startsWith("https://");

	const gitPath = isGitStylePath || isHttpPath ? tmplArr[0] : `https://${HostMap[source || "github"]}/${tmplArr[0]}`;

	return {
		gitPath,
		branch
	};
}

async function downloadTpl(opts: InitAppOptios) {
	if (!shell.which("git")) {
		shell.echo(chalk.redBright("Sorry, you need install `git`"));
		shell.exit(1);
	}

	const startTime = Date.now();

	const spinner = startSpinner(chalk.greenBright(`Initializing \`${chalk.bold(opts.appName)}\` files... `));

	const { gitPath, branch } = getGitInfo(opts.template, opts.source);

	await new Promise((resolve, reject) => {
		shell.exec(`git clone -b ${branch} ${gitPath} ${opts.cwd}`, { silent: true }, (code, stdout, stderr) => {
			if (code !== 0) {
				shell.echo("Err: Failed clone template files, reason: " + stderr);
				shell.exit(1);
			}
			shell.rm("-rf", "./.git").exec("git init", { silent: true }, (code, stdout, stderr) => {
				code !== 0 ? reject(stderr) : resolve(stdout);
			});
		});
	});

	const siuConfigPath = path.resolve(opts.cwd, "./siu.config.js");

	const hasSiuConfig = await fs.pathExists(siuConfigPath);

	if (!hasSiuConfig) {
		await fs.writeFile(siuConfigPath, `module.exports={ excludePkgs:[], plugins:[] }`);
	}

	spinner.stop(true);

	console.log(
		chalk.green(
			`${chalk.greenBright("✔")} ${chalk.bold("Initialized")} ${chalk.bold(opts.appName)} files! (cost ${ms(
				Date.now() - startTime
			)})`
		)
	);
}

async function installDeps() {
	const startTime = Date.now();

	const spinner = startSpinner(chalk.greenBright(`☕ Installing packages, it will take a while `));

	if (!shell.which("yarn")) {
		shell.echo(chalk.yellowBright(`Warning: Missing \`yarn\`, and we will install it --global`));
		shell.exec(`${isWindows ? "" : "sudo "}npm i -g yarn`);
	}

	await new Promise((resolve, reject) => {
		shell.exec("git init", { silent: true }, code => {
			if (code !== 0) {
				reject(false);
			}
			shell.exec("yarn", { silent: true }, code => {
				if (code !== 0) {
					reject(false);
				}
				resolve();
			});
		});
	});

	spinner.stop(true);

	console.log(
		chalk.green(`${chalk.greenBright("✔")} ${chalk.bold("Installed")} packages in ${ms(Date.now() - startTime)}!`)
	);
}

export async function initApp(opts: InitAppOptios) {
	shell.mkdir(opts.cwd);

	shell.cd(opts.cwd);

	const startTime = Date.now();

	await downloadTpl(opts);

	await installDeps();

	console.log(
		chalk.green(
			`${chalk.greenBright("✔")} \`${chalk.bold(opts.appName)}\` Created successfully in ${chalk.bold(
				ms(Date.now() - startTime)
			)}!`
		)
	);
}
