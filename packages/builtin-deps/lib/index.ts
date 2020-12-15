import shell from "shelljs";

import { getPackagePath } from "@siujs/utils";

import { addDeps, detectYarn, normalizeDepStr } from "./utils";

/**
 *
 * add/remove dependencies/devDependencies
 *
 * @param pkg target package name e.g. foo or @scope/foo
 *
 * @param depStr dependencies string
 * 		 e.g. "foo,bar:D,bar2@1.1.0,foo2@1.2.2:D"  will be like this:
 *
 *    {
 *         "deps": ["foo","bar2@1.0.0"],
 * 		  "devDeps": ["bar","foo2@1.2.2"]
 *    }
 *
 * @param action `add` or `rm`
 */
export async function changeDeps(pkg: string, depStr: string, action: "add" | "rm" = "add") {
	const depsMap = normalizeDepStr(depStr);
	if (!depsMap) return;

	detectYarn();

	const cwd = pkg ? await getPackagePath(pkg) : process.cwd();

	const { deps = [], devDeps = [] } = depsMap;

	if (action === "rm") {
		shell.exec(
			`yarn -W remove ${(deps || [])
				.concat(devDeps || [])
				.map(it => it.name)
				.join(" ")}`,
			{ cwd }
		);
	} else {
		deps.length && (await addDeps(deps, cwd));
		devDeps.length && (await addDeps(devDeps, cwd, true));
	}
}
