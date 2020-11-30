import { resolvePkgDirName } from "@siujs/utils";

import { getSiuConfiger } from "./config/siu";
import { getMonorepoRootContext } from "./plugin/context/root";
import { SiuPlugin } from "./plugin/ctor";
import { HookHandler, PkgCmdHookLifecycle, PkgCommand } from "./types";

export * from "./types";

export type PluginApi = Record<PkgCommand, Record<PkgCmdHookLifecycle, (fn: HookHandler) => void>>;

const buckets = {} as Record<string, PluginApi>;

const pluginBuckets = [] as SiuPlugin[];

const actions = ["creation", "genDocs", "glint", "test", "build", "publish"] as PkgCommand[];
const lifecycles = ["start", "proc", "complete", "error", "clean"] as PkgCmdHookLifecycle[];

export function plugin(defaultOpts: Partial<Record<PkgCommand, Record<string, any>>> = {}) {
	const cfger = getSiuConfiger();
	const id = cfger.currentPlugId();
	if (!buckets[id]) {
		const plug = new SiuPlugin(id, {
			...defaultOpts,
			...cfger.options(id)
		});
		pluginBuckets.push(plug);

		buckets[id] = new Proxy({} as any, {
			get(_, action) {
				if (!actions.includes(action as PkgCommand)) return void 0;
				return new Proxy({} as any, {
					get(_, lifecycle) {
						if (!lifecycles.includes(lifecycle as PkgCmdHookLifecycle)) return void 0;
						return (fn: HookHandler) => {
							plug.addHook(action as PkgCommand, lifecycle as PkgCmdHookLifecycle, fn);
						};
					},
					set() {
						return false;
					},
					deleteProperty() {
						return false;
					}
				});
			},
			set() {
				return false;
			},
			deleteProperty() {
				return false;
			}
		});
	}
	return buckets[id];
}

export async function applyPlugins(cmd: PkgCommand, pkgNames?: string, opts?: any) {
	const cfger = getSiuConfiger();
	cfger.resolvePlugins();

	const pkgsOrder = cfger.get("pkgsOrder") || "priority";

	let pkgDirList: string[] = [];

	const ctx = getMonorepoRootContext();

	const allPkgMetas = await ctx.allPkgMetas();

	if (cmd === "creation" && pkgNames) {
		pkgNames.split(",").forEach(pkg => {
			pkgDirList.push(resolvePkgDirName(pkg));
			allPkgMetas[pkgDirList[pkgDirList.length - 1]] = { name: pkg };
		});
	} else {
		if (pkgsOrder === "auto") {
			pkgDirList = await ctx.allPkgDirs();
		} else if (pkgsOrder === "priority") {
			pkgDirList = await ctx.getSortedPkgByPriority();
		} else {
			pkgDirList = pkgsOrder as string[];
		}

		if (pkgNames) {
			const pkgs = pkgNames.split(",").map(resolvePkgDirName);
			pkgDirList = pkgDirList.filter(dir => pkgs.includes(dir));
		}
	}

	const kv = pkgDirList.reduce((prev, cur) => {
		const plugs = pluginBuckets.filter(plug => !cfger.isPkgDisable(cur, cmd, plug.id()));

		if (plugs && plugs.length) {
			prev[cur] = plugs;
		}

		return prev;
	}, {} as Record<string, SiuPlugin[]>);

	const pkgs = Object.keys(kv);

	for (let i = 0; i < pkgs.length; i++) {
		const plugs = kv[pkgs[i]];
		for (let j = 0; j < plugs.length; j++) {
			await plugs[j].apply(allPkgMetas[pkgs[i]].name, cmd, {
				...(opts || {}),
				...(cfger.options(plugs[j].id())?.[cmd] ?? {})
			});
		}
	}

	await Promise.all(pkgs.map(pkg => kv[pkg].map(plug => plug.clean(pkg))).flat());
}
