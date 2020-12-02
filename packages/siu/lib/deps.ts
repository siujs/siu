import shell from "shelljs";

import { getPkgDirName } from "@siujs/core";
import { isWindows } from "@siujs/utils";

/**
 *
 * Analysis user input deps string
 *
 *  e.g. "foo,bar:D,bar2@1.1.0,foo2@1.2.2:D"  will be like this:
 *
 *    {
 *         "deps": ["foo","bar2@1.0.0"],
 * 		  "devDeps": ["bar","foo2@1.2.2"]
 *    }
 *
 * @param deps deps string
 */
export function analysisDeps(deps: string) {
	if (!deps) return null;

	return deps.split(",").reduce(
		(prev, cur) => {
			if (cur.endsWith(":D")) {
				prev.devDeps = prev.devDeps || [];
				prev.devDeps.push(cur.replace(":D", ""));
			} else {
				prev.deps = prev.deps || [];
				prev.deps.push(cur);
			}
			return prev;
		},
		{} as {
			deps?: string[];
			devDeps?: string[];
		}
	);
}

export function handleDepsCmd(pkg: string, deps: string, action: "add" | "rm" = "add") {
	const depsMap = analysisDeps(deps);

	if (!depsMap) return;

	if (!shell.which("yarn")) {
		shell.exec(isWindows ? `npm i -g yarn` : `sudo npm i -g yarn`);
	}

	shell.exec("yarn config set workspaces-experimental true");

	const workspaceName = getPkgDirName(pkg);

	if (depsMap.deps && depsMap.deps.length) {
		shell.exec(`yarn workspace ${workspaceName} ${action} ${depsMap.deps.join(" ")}`);
	}

	if (depsMap.devDeps && depsMap.devDeps.length) {
		shell.exec(`yarn workspace ${workspaceName} ${action} ${depsMap.devDeps.join(" ")} --dev`);
	}
}
