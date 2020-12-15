import {
	findUpSiuConfigCwd,
	getMetasOfPackages,
	getPackageDirs,
	getPkgDirName,
	getSortedPkgByPriority
} from "@siujs/utils";

import { getSiuConfiger } from "./config";
import { getPlugin, getPlugins, SiuPlugin } from "./plugin";
import { HookHandler, PluginCommand, PluginCommandLifecycle } from "./types";

/**
 *
 * 定义插件
 *
 * @param opts 插件的默认参数
 */
export function plugin(
	opts?: Record<string, any>
): Record<PluginCommand, Record<PluginCommandLifecycle, (fn: HookHandler) => void>> {
	const id = getSiuConfiger().currentPlugId();
	return getPlugin(id).refreshOpts(opts).output();
}

/**
 *
 * has command hooks in current plugin
 *
 * @param cmd target command
 */
export function hasCommandHooks(cmd: PluginCommand) {
	const plugs = getPlugins();

	return plugs.reduce((prev, cur) => prev || cur.hasCommandHooks(cmd), false);
}

/**
 *
 * adjust current workspace directory
 *
 */
export async function adjustCWD() {
	const siuConfigCWD = await findUpSiuConfigCwd();

	if (!siuConfigCWD) {
		throw new Error(`[siu] ERROR: Cant't find root workspace directory of \`siu.config.js\``);
	}

	process.chdir(siuConfigCWD);
}

/**
 *
 * apply plugins without package
 *
 * @param cmd client command
 * @param opts options of current client command
 */
export async function applyPluginsNoPkg(cmd: PluginCommand, opts: { [x: string]: any }) {
	await adjustCWD();

	getSiuConfiger().resolvePlugins();

	const plugs = getPlugins();

	for (let i = 0; i < plugs.length; i++) {
		await plugs[i].process(cmd, opts);
	}

	await Promise.all(plugs.map(plug => plug.clean()));

	return;
}

/**
 *
 * apply plugins with package
 *
 * @param cmd client command
 * @param opts options of current client command
 */
export async function applyPlugins(
	cmd: PluginCommand,
	opts: {
		pkgNames?: string;
		[x: string]: any;
	}
) {
	await adjustCWD();

	const configer = getSiuConfiger().resolvePlugins();

	const plugs = getPlugins();

	const { pkgNames, ...options } = opts;

	const pkgsOrder = configer.get("pkgsOrder") || "priority";

	let pkgDirList: string[] = [];

	const pkgMetas = await getMetasOfPackages();

	if (cmd === "creation" && pkgNames) {
		pkgNames.split(",").forEach(pkg => {
			pkgDirList.push(getPkgDirName(pkg));
			pkgMetas[pkgDirList[pkgDirList.length - 1]] = { name: pkg };
		});
	} else {
		if (pkgsOrder === "auto") {
			pkgDirList = await getPackageDirs();
		} else if (pkgsOrder === "priority") {
			pkgDirList = await getSortedPkgByPriority();
		} else {
			pkgDirList = pkgsOrder as string[];
		}

		if (pkgNames) {
			const pkgs = pkgNames.split(",").map(getPkgDirName);
			pkgDirList = pkgDirList.filter(dir => pkgs.includes(dir));
		}
	}

	const kv = pkgDirList.reduce((prev, cur) => {
		const plugList = plugs.filter(plug => !configer.isPkgDisable(cur, cmd, plug.id()));
		if (plugList && plugList.length) {
			prev[cur] = plugList;
		}
		return prev;
	}, {} as Record<string, SiuPlugin[]>);

	const pkgs = Object.keys(kv);

	for (let i = 0; i < pkgs.length; i++) {
		const plugs = kv[pkgs[i]];
		for (let j = 0; j < plugs.length; j++) {
			await plugs[j].process(cmd, options, pkgMetas[pkgs[i]].name);
		}
	}

	await Promise.all(pkgs.map(pkg => kv[pkg].map(plug => plug.clean(pkg))).flat());
}

export * from "./types";
