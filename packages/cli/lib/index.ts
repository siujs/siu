import { PkgCommand } from "@siujs/core";

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

async function initApp(opts: InitAppOptios) {
	const tmplArr = opts.template.split("#");

	const branch = tmplArr.length > 1 ? tmplArr[tmplArr.length - 1] : opts.source === "github" ? "main" : "master";

	const isGitStylePath = opts.template.startsWith("git@");

	const isHttpPath = opts.template.startsWith("http://") || opts.template.startsWith("https://");

	const realGitPath =
		isGitStylePath || isHttpPath ? tmplArr[0] : `https://${HostMap[opts.source || "github"]}/${tmplArr[0]}`;

	console.log({
		gitUrl: realGitPath,
		branch,
		dest: opts.cwd
	});
}

export async function runCmd<T extends InitAppOptios & Record<string, any>>(cmd: PkgCommand | "init", options: T) {
	if (cmd === "init") {
		// TODO: init template app
		await initApp(options);
		return;
	}

	if (cmd === "creation") {
		// TODO: package creation
		return;
	}
}
