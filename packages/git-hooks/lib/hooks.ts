import chalk from "chalk";
import fs from "fs";
import path from "path";
import shell from "shelljs";

import { isWindows } from "@siujs/utils";

import { GitClientHooksHandlers } from "./types";
import { getChangedFilePaths, getLatestCommitFilePaths } from "./utils";

const ConfigPathsPLaceHolder = [
	".__T__rc.js",
	"__T__.config.js",
	".__T__",
	".__T__rc",
	".__T__rc.json",
	".__T__rc.yml",
	".__T__rc.yaml",
	".__T__rc.json5",
	".__T__rc.cjs",
	"__T__.config.cjs"
];

const getConfigPaths = (target: "prettier" | "eslint") => ConfigPathsPLaceHolder.map(it => it.replace("__T__", target));

function findConfigPath(cwd: string, target: "prettier" | "eslint") {
	const configPaths = getConfigPaths(target);

	for (let i = 0, l = configPaths.length; i < l; i++) {
		const p = path.resolve(cwd, configPaths[i]);
		if (fs.existsSync(p)) {
			return p;
		}
	}
	return "";
}

const commitRE = /^(revert: )?(feat|wip|fix|to|upd|docs|style|refactor|perf|types|test|wf|chore|ci|build|release)(\(.+\))?: .{1,50}/;

const DEFAULT_HOOK_HNDS = {
	async preCommit(stagedFiles: string[], cwd: string) {
		if (!shell.which("prettier")) {
			shell.exec((isWindows ? "" : "sudo") + "npm i -g prettier");
		}

		let execRslt: { code: number };

		let cfgPath = findConfigPath(cwd, "prettier");

		execRslt = shell.exec(
			`prettier ${cfgPath ? `--config ${cfgPath}` : ""} --write ${stagedFiles.join(" ")} --color=always`
		);

		if (execRslt.code !== 0) {
			return false;
		}

		if (!shell.which("eslint")) {
			shell.exec((isWindows ? "" : "sudo") + "npm i -g eslint");
		}

		cfgPath = findConfigPath(cwd, "eslint");

		execRslt = shell.exec(`eslint ${cfgPath ? `-c ${cfgPath}` : ""} --fix ${stagedFiles.join(" ")} --color=always`);

		if (execRslt.code !== 0) {
			return false;
		}

		return true;
	},
	async commitMsg(commitMsg: string) {
		if (!commitRE.test(commitMsg)) {
			console.log();
			console.error(
				` ${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`invalid commit message format.`)}\n\n` +
					chalk.red(` Proper commit message format is required for automated changelog generation. Examples:\n\n`) +
					`    ${chalk.green(`feat(xxx): add some logic function or add some option `)}\n` +
					`    ${chalk.green(`fix: handle events on blur (close #28)`)}\n\n`
			);
			return false;
		}
		return true;
	}
};

export class GitClientHooks {
	protected cwd: string;
	protected hnds: GitClientHooksHandlers;
	constructor(cwd: string, hnds?: GitClientHooksHandlers) {
		this.cwd = cwd;
		this.hnds = hnds || DEFAULT_HOOK_HNDS;
	}

	async preCommit() {
		const files = await getChangedFilePaths(this.cwd);

		if (this.hnds.preCommit && typeof this.hnds.preCommit === "function") {
			const rslt = await this.hnds.preCommit(files, this.cwd);

			if (!rslt) {
				process.exit(1);
			}
		}
	}

	async prepareCommitMsg() {
		let msgPath = process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS;

		if (!msgPath) return;

		msgPath = msgPath.split(" ").shift();

		const commitMsg = fs.readFileSync(msgPath, "utf-8").trim();

		if (this.hnds.prepareCommitMsg && typeof this.hnds.prepareCommitMsg === "function") {
			const newCommitMsg = await this.hnds.prepareCommitMsg(commitMsg, this.cwd);

			if (!newCommitMsg) return;

			fs.writeFileSync(msgPath, newCommitMsg);
		}
	}

	async commitMsg() {
		let msgPath = process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS;

		if (!msgPath) {
			console.log();
			console.error(`${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`Can't find temp commit-msg-path!`)}`);
			process.exit(1);
		}

		msgPath = msgPath.split(" ").shift();

		const commitMsg = fs.readFileSync(msgPath, "utf-8").trim();

		if (!commitMsg) {
			console.log();
			console.error(`${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`Empty commit message is not allowed!`)}`);
			process.exit(1);
		}

		if (this.hnds.commitMsg && typeof this.hnds.commitMsg === "function") {
			const rslt = await this.hnds.commitMsg(commitMsg, this.cwd);

			if (!rslt) {
				process.exit(1);
			}
		}
	}

	async postCommit() {
		const format = shell.exec(`git log -1 --pretty=format:(%H)(%an,%ae)(%ci)(%s)(%b)`);

		if (format.code !== 0) {
			console.log();
			console.log(chalk.red("ERROR: " + format.stderr));
			process.exit(1);
		}

		const arr = format.stdout.split(/\(|\)|,/g).filter(Boolean);

		const commitKV = {
			id: arr[0],
			userName: arr[1],
			userEmail: arr[2],
			time: arr[3],
			shortMsg: arr[4],
			msg: arr[4] + "\n" + arr[5],
			files: [] as string[]
		};

		const files = await getLatestCommitFilePaths(this.cwd);
		commitKV.files = files;

		if (this.hnds.postCommit && typeof this.hnds.postCommit === "function") {
			await this.hnds.postCommit(commitKV, this.cwd);
		}
	}

	async postMerge() {
		const mergedFiles = await getLatestCommitFilePaths(this.cwd);

		if (this.hnds.postMerge && typeof this.hnds.postMerge === "function") {
			const rslt = await this.hnds.postMerge(mergedFiles, this.cwd);
			if (!rslt) {
				process.exit(1);
			}
		}
	}
}
