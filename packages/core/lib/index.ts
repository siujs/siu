import { getSiuConfiger } from "./config/siu";
import { getPlugin, getPlugins, SiuPlugin } from "./plugin";
import { HookHandler, PluginCommand, PluginCommandLifecycle } from "./types";
import { getMetasOfPackages, getPackageDirs, getPkgDirName, getSortedPkgByPriority } from "./utils";

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
	return plugs.reduce((prev, cur) => prev && cur.hasCommandHooks(cmd), true);
}

/**
 *
 * 应用插件
 *
 * @param cmd 当前执行的命令
 * @param opts 执行命令所携带的配置参数
 */
export async function applyPlugins(
	cmd: PluginCommand,
	opts: {
		pkgNames?: string;
		[x: string]: any;
	}
) {
	const configer = getSiuConfiger().resolvePlugins();

	const plugs = getPlugins();

	if (cmd === "glint") {
		for (let i = 0; i < plugs.length; i++) {
			await plugs[i].process("glint", opts);
		}

		await Promise.all(plugs.map(plug => plug.clean()));

		return;
	}

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
export * from "./utils";
