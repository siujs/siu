import chalk from "chalk";

import { deepFreezeObject } from "@siujs/utils";

import { HookHandler, HookHandlerContext, PkgData, PluginCommand, PluginCommandLifecycle } from "./types";
import { getPkgData } from "./utils";

const pluginCommands = ["creation", "glint", "genDocs", "test", "build", "publish"] as PluginCommand[];

const lifecycles = ["start", "process", "complete", "error", "clean"] as PluginCommandLifecycle[];

const GlobalKeyValues = {} as Record<string, any>;

const PkgCaches = {} as Record<string, PkgData>;

function getHookId(action: PluginCommand, lifeCycle: PluginCommandLifecycle) {
	return `${action}.${lifeCycle}`;
}

const noop = () => {};

export class SiuPlugin {
	private readonly _id: string;
	private readonly _cacheKeyPrefix: string;
	private readonly hooks: Partial<Record<string, HookHandler[]>>;
	private readonly _output: Record<PluginCommand, Record<PluginCommandLifecycle, (fn: HookHandler) => void>>;
	private readonly _ctx: HookHandlerContext;

	private _opts: Record<string, any> = {};

	private cmd?: PluginCommand;

	private lifecycle: PluginCommandLifecycle = "start";

	private _currentPkg = "";

	constructor(id: string) {
		this._id = id;
		this._cacheKeyPrefix = `@${id}/`;
		this.hooks = {};
		this._output = this.initOutputApi();
		this._ctx = this.initHookCtx();
	}

	private initHookCtx() {
		return {
			opts: this.opts.bind(this),
			keys: this.keys.bind(this),
			scopedKeys: this.scopedKeys.bind(this),
			ex: this.ex.bind(this),
			pkg: this.pkg.bind(this)
		};
	}

	private initOutputApi() {
		const addHook = this.addHook.bind(this);

		const kv = pluginCommands.reduce((prev, cmd) => {
			prev[cmd] = lifecycles.reduce((kv, cur) => {
				kv[cur] = (fn: HookHandler) => {
					addHook(cmd, cur, fn);
				};
				return kv;
			}, {} as Record<PluginCommandLifecycle, (fn: HookHandler) => void>);
			return prev;
		}, {} as Record<PluginCommand, Record<PluginCommandLifecycle, (fn: HookHandler) => void>>);

		deepFreezeObject(kv);

		return kv;
	}

	output() {
		return this._output;
	}

	id() {
		return this._id;
	}

	/**
	 *
	 * refresh options of plugin
	 *
	 * @param opts  new options
	 */
	refreshOpts(opts?: Record<string, any>) {
		if (opts) {
			this._opts = {
				...this._opts,
				...opts
			};
		}
		return this;
	}

	/**
	 *
	 * 获取当前插件在当前action的配置信息
	 *
	 * @param key 键名
	 */
	private opts<T>(key: string) {
		return this._opts[this.cmd]?.[key] as T;
	}

	/**
	 *
	 * 新增插件hook
	 *
	 * @param hookName hook名称
	 * @param hookHandler hook处理器
	 */
	private addHook(action: PluginCommand, lifeCycle: PluginCommandLifecycle, hookHandler: HookHandler) {
		const hookId = getHookId(action, lifeCycle);
		this.hooks[hookId] = this.hooks[hookId] || [];
		this.hooks[hookId].push(hookHandler);
	}

	/**
	 *
	 * 判断是否具备对应的hook
	 *
	 * @private
	 * @param hookKey target hook key
	 */
	private hasHook(hookKey: string) {
		return this.hooks[hookKey] && !!this.hooks[hookKey].length;
	}

	private hasTargetHooks(cmd: PluginCommand) {
		return this.hasHook(getHookId(cmd, "start")) || this.hasHook(getHookId(cmd, "process"));
	}

	/**
	 *
	 * 1. 获取当前上下文的临时缓存中特定键对应的值
	 * 2. 设置新的临时缓存键值对
	 *
	 * @param key 键名
	 * @param value [可选] 值
	 */
	private keys<T>(key: string, value?: T) {
		const realKey = this._cacheKeyPrefix + key;
		return value ? (GlobalKeyValues[realKey] = value) : (GlobalKeyValues[realKey] as T);
	}

	/**
	 *
	 * 带作用域的key
	 *
	 * @param key 键名
	 * @param value [可选] 值
	 */
	private scopedKeys<T>(key: string, value?: T) {
		return this.keys(`@${this.cmd}${this._currentPkg ? `${this._currentPkg}/` : ""}/${key}`, value);
	}

	/**
	 *
	 * 记录异常信息
	 *
	 * @param value [可选] 异常的错误对象或者异常文本信息
	 */
	private ex(value?: Error | string) {
		return this.scopedKeys("SIU_PLUGIN_CATCH_ERR", value);
	}

	private pkg(meta?: Record<string, any>) {
		if (meta) {
			if (!this._currentPkg) return;

			const data = PkgCaches[this._currentPkg];

			data.meta = {
				...data.meta,
				...meta
			};
			return;
		}

		return this._currentPkg
			? PkgCaches[this._currentPkg] || (PkgCaches[this._currentPkg] = getPkgData(this._currentPkg, process.cwd()))
			: null;
	}

	private async next(err?: Error) {
		if (err) {
			this.ex(err);
			return this.callHook(getHookId(this.cmd, "error"));
		}
		if (this.lifecycle === "start") {
			return this.callHook(getHookId(this.cmd, (this.lifecycle = "process")));
		}
		if (this.lifecycle === "process") {
			return this.callHook(getHookId(this.cmd, (this.lifecycle = "complete")));
		}
	}

	private async callHook(hookKey: string) {
		const handlers = this.hooks[hookKey] as HookHandler[];

		if (!handlers || !handlers.length) return;

		const next =
			hookKey.endsWith("error") || hookKey.endsWith("complete") || hookKey.endsWith("clean")
				? noop
				: this.next.bind(this);

		for (let i = 0; i < handlers.length; i++) {
			await handlers[i](this._ctx, next);
		}
	}

	private cleanKeys() {
		Object.keys(GlobalKeyValues)
			.filter(key => key.startsWith(this._cacheKeyPrefix))
			.forEach(item => {
				delete GlobalKeyValues[item];
			});
	}

	async clean(pkg?: string) {
		this._currentPkg = pkg;

		this.cleanKeys();

		await this.callHook(getHookId(this.cmd, "clean"));
	}

	/**
	 *
	 * has command hooks in current plugin
	 *
	 * @param cmd target command
	 */
	hasCommandHooks(cmd: PluginCommand) {
		return lifecycles.reduce((prev, cur) => prev && this.hasHook(getHookId(cmd, cur)), true);
	}

	async process(cmd: PluginCommand, cmdOpts: Record<string, any>, pkgName?: string) {
		if (!this.hasTargetHooks(cmd)) return;

		this.cmd = cmd;

		this._opts[cmd] = {
			...(this._opts[cmd] || {}),
			...cmdOpts
		};

		this._currentPkg = pkgName;

		const hasStartHook = this.hasHook(getHookId(cmd, "start"));

		const logStr = `[${pkgName ? `${pkgName}:` : ""}${this._id}:${cmd}]`;

		console.log(chalk.hex("#4c91ff").bold(`${logStr} ============\n`));

		try {
			await this.callHook(getHookId(cmd, (this.lifecycle = hasStartHook ? "start" : "process")));
		} catch (ex) {
			console.log(chalk.redBright(`\n[${this._id}] ERROR:`));
			this.ex(ex);
			await this.callHook(getHookId(cmd, "error"));
		}

		console.log(chalk.hex("#4c91ff").bold(`\n============ ${logStr}\n`));
	}
}

const PluginCaches = {} as Record<string, SiuPlugin>;

export function getPlugin(id: string) {
	return PluginCaches[id] || (PluginCaches[id] = new SiuPlugin(id));
}

export function getPlugins() {
	return Object.values(PluginCaches);
}
