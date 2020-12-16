import { getMetasOfPackages, getPackageDirs, getPkgDirName, getSortedPkgByPriority } from "@siujs/utils";

import { getSiuConfiger } from "./config";
import { getPlugin, getPlugins, SiuPlugin } from "./plugin";
import { CommandOptionsHandlerParams, PluginApi, PluginCommand } from "./types";
import { adjustCWD } from "./utils";

/**
 *
 * 定义插件
 *
 * @param opts 插件的默认参数
 */
export function plugin(opts?: Record<string, any>): PluginApi {
	const id = getSiuConfiger().currentPlugId();
	const plug = getPlugin(id);
	opts && plug.refreshOpts(opts);
	return plug.output();
}

/**
 * 加载插件
 */
export async function loadPlugins() {
	await adjustCWD();

	getSiuConfiger().resolvePlugins();

	const plugs = getPlugins();

	if (!plugs || !plugs.length) return;

	return plugs;
}

/**
 *
 * 判断当前插件是否存在对应命令的处理
 *
 * @param cmd target command
 */
export function hasHooks(cmd: PluginCommand) {
	return getPlugins().reduce((prev, cur) => prev || cur.hasHooks(cmd), false);
}

/**
 *
 * apply plugins with commander options initialize
 *
 * @param cmd client command
 * @param command `Command` instance
 */
export async function applyPluginCommandOptions(cmd: PluginCommand, command: CommandOptionsHandlerParams) {
	const plugs = await loadPlugins();

	if (!plugs) return;

	await Promise.all(getPlugins().map(plug => plug.processCommandOptions(cmd, command)));
}

/**
 *
 * apply plugins without package
 *
 *  tips: only for `glint` and `deps`
 *
 * @param cmd client command
 * @param opts options of current client command
 */
export async function applyPluginsNoPkg(cmd: PluginCommand, opts: { [x: string]: any }) {
	const plugs = await loadPlugins();

	if (!plugs) return;

	for (let i = 0; i < plugs.length; i++) {
		await plugs[i].process(cmd, opts);
	}

	await Promise.all(plugs.map(plug => plug.clean()));
}

/**
 *
 * apply plugins with package
 *
 *  tips: not for `glint` and `deps`
 *
 * @param cmd client command
 * @param opts options of current client command
 */
export async function applyPlugins(
	cmd: PluginCommand,
	opts: {
		pkg?: string;
		[x: string]: any;
	}
) {
	const plugs = await loadPlugins();

	if (!plugs) return;

	const configer = getSiuConfiger();

	const { pkg, ...options } = opts;

	const pkgsOrder = configer.get("pkgsOrder") || "priority";

	let pkgDirList: string[] = [];

	const pkgMetas = await getMetasOfPackages();

	if (cmd === "create" && pkg) {
		pkg.split(",").forEach(pkg => {
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

		if (pkg) {
			const pkgs = pkg.split(",").map(getPkgDirName);
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
