import { getSiuConfiger } from "./config/siu";
import { getMonorepoRootContext } from "./plugin/context/root";
import { SiuPlugin } from "./plugin/ctor";
import { HookHandler, PkgCmdHookLifecycle, PkgCommand } from "./types";

export * from "./types";

export type PluginApi = Record<PkgCommand, Record<PkgCmdHookLifecycle, (fn: HookHandler) => void>>;

const buckets = {} as Record<string, PluginApi>;

const pluginBuckets = [] as SiuPlugin[];

const actions = ["creation", "rm", "addDeps", "test", "build", "publish", "genDocs"] as PkgCommand[];
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

export async function applyPlugins(opts: { pkgName?: string; cmd: PkgCommand; actionOpts?: any }) {
	const cfger = getSiuConfiger();

	cfger.resolvePlugins();

	const pkgDirList = opts.pkgName ? [opts.pkgName] : await getMonorepoRootContext().allPkgDirs();

	await Promise.all(
		pluginBuckets
			.map(plug =>
				pkgDirList
					.filter(pkgDir => !cfger.isPkgDisable(pkgDir, opts.cmd, plug.id()))
					.map(pkgDir => plug.apply(pkgDir, opts.cmd, opts.actionOpts || {}))
			)
			.flat()
	);

	await Promise.all(
		pluginBuckets
			.map(plug =>
				pkgDirList.filter(pkgDir => !cfger.isPkgDisable(pkgDir, opts.cmd, plug.id())).map(pkgDir => plug.clean(pkgDir))
			)
			.flat()
	);
}