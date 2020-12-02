// import { resolvePkgDirName } from "@siujs/utils";

// import { getSiuConfiger } from "./config/siu";
// import { getMonorepoRootContext } from "./plugin/context/root";
// import { GLintHookHandler, HookHandler, PluginApi, PluginCommand, PluginCommandLifecycle } from "./types";

// export * from "./types";

// const buckets = {} as Record<string, PluginApi>;

// const pluginBuckets = [] as SiuPlugin[];

// const actions = ["creation", "genDocs", "glint", "test", "build", "publish"] as PluginCommand[];
// const lifecycles = ["start", "process", "complete", "error", "clean"] as PluginCommandLifecycle[];

// export function plugin(defaultOpts: Partial<Record<PluginCommand, Record<string, any>>> = {}) {
// 	const cfger = getSiuConfiger();
// 	const id = cfger.currentPlugId();
// 	if (!buckets[id]) {
// 		const plug = new SiuPlugin(id, {
// 			...defaultOpts,
// 			...cfger.options(id)
// 		});
// 		pluginBuckets.push(plug);

// 		buckets[id] = new Proxy({} as any, {
// 			get(_, action) {
// 				if (!actions.includes(action as PluginCommand)) return void 0;
// 				return new Proxy({} as any, {
// 					get(_, lifecycle) {
// 						if (action === "glint") {
// 							if (lifecycle !== "process") return void 0;
// 							return (fn: GLintHookHandler) => {
// 								plug.addHook("glint", "process", fn);
// 							};
// 						} else {
// 							if (!lifecycles.includes(lifecycle as PluginCommandLifecycle)) return void 0;
// 							return (fn: HookHandler) => {
// 								plug.addHook(action as PluginCommand, lifecycle as PluginCommandLifecycle, fn);
// 							};
// 						}
// 					},
// 					set() {
// 						return false;
// 					},
// 					deleteProperty() {
// 						return false;
// 					}
// 				});
// 			},
// 			set() {
// 				return false;
// 			},
// 			deleteProperty() {
// 				return false;
// 			}
// 		});
// 	}
// 	return buckets[id];
// }

// export async function applyPlugins(cmd: PluginCommand, pkgNames?: string, opts?: any) {
// 	const cfger = getSiuConfiger();
// 	cfger.resolvePlugins();

// 	const pkgsOrder = cfger.get("pkgsOrder") || "priority";

// 	let pkgDirList: string[] = [];

// 	const ctx = getMonorepoRootContext();

// 	const allPkgMetas = await ctx.allPkgMetas();

// 	if (cmd === "creation" && pkgNames) {
// 		pkgNames.split(",").forEach(pkg => {
// 			pkgDirList.push(resolvePkgDirName(pkg));
// 			allPkgMetas[pkgDirList[pkgDirList.length - 1]] = { name: pkg };
// 		});
// 	} else {
// 		if (pkgsOrder === "auto") {
// 			pkgDirList = await ctx.allPkgDirs();
// 		} else if (pkgsOrder === "priority") {
// 			pkgDirList = await ctx.getSortedPkgByPriority();
// 		} else {
// 			pkgDirList = pkgsOrder as string[];
// 		}

// 		if (pkgNames) {
// 			const pkgs = pkgNames.split(",").map(resolvePkgDirName);
// 			pkgDirList = pkgDirList.filter(dir => pkgs.includes(dir));
// 		}
// 	}

// 	const kv = pkgDirList.reduce((prev, cur) => {
// 		const plugs = pluginBuckets.filter(plug => !cfger.isPkgDisable(cur, cmd, plug.id()));

// 		if (plugs && plugs.length) {
// 			prev[cur] = plugs;
// 		}

// 		return prev;
// 	}, {} as Record<string, SiuPlugin[]>);

// 	const pkgs = Object.keys(kv);

// 	for (let i = 0; i < pkgs.length; i++) {
// 		const plugs = kv[pkgs[i]];
// 		for (let j = 0; j < plugs.length; j++) {
// 			await plugs[j].apply(allPkgMetas[pkgs[i]].name, cmd, {
// 				...(opts || {}),
// 				...(cfger.options(plugs[j].id())?.[cmd] ?? {})
// 			});
// 		}
// 	}

// 	await Promise.all(pkgs.map(pkg => kv[pkg].map(plug => plug.clean(pkg))).flat());
// }

import { getSiuConfiger } from "./config/siu";
import { getPlugin, getPlugins, SiuPlugin } from "./plugin";
import { HookHandler, PluginCommand, PluginCommandLifecycle } from "./types";
import { getMetasOfPackages, getPackageDirs, getPkgDirName, getSortedPkgByPriority } from "./utils";

export function plugin(
	opts?: Record<string, any>
): Record<PluginCommand, Record<PluginCommandLifecycle, (fn: HookHandler) => void>> {
	const id = getSiuConfiger().currentPlugId();
	return getPlugin(id).refreshOpts(opts).output();
}

export async function applyPlugins(cmd: PluginCommand, pkgNames?: string, opts?: any) {
	const configer = getSiuConfiger().resolvePlugins();

	const plugs = getPlugins();

	if (cmd === "glint") {
		for (let i = 0; i < plugs.length; i++) {
			await plugs[i].process("glint", opts);
		}

		await Promise.all(plugs.map(plug => plug.clean()));

		return;
	}

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
			await plugs[j].process(cmd, opts, pkgMetas[pkgs[i]].name);
		}
	}

	await Promise.all(pkgs.map(pkg => kv[pkg].map(plug => plug.clean(pkg))).flat());
}

export * from "./types";
export * from "./utils";
