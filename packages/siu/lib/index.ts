import { applyPlugins, PkgCommand } from "@siujs/core";
import { initApp } from "@siujs/init-app";

interface CommonOptions {
	pkgs?: string;
	[x: string]: any;
}

/**
 *
 * run client command
 *
 * @param cmd client command
 * @param options client command payload options
 */
export async function runCmd<T extends CommonOptions>(cmd: PkgCommand | "init", options: T) {
	if (cmd === "init") {
		await initApp(options as any);
		return;
	}

	const { pkgs, ...rest } = options || {};
	try {
		await applyPlugins(cmd, pkgs, rest);
	} catch (ex) {
		console.error(ex);
		process.exit(1);
	}
}
