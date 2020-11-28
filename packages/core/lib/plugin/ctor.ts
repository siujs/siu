import chalk from "chalk";

import { HookHandler, PkgCmdHookLifecycle, PkgCommand } from "../types";
import { getCurrentPlugContext, PlugContext } from "./context/plug";

function getHookId(action: PkgCommand, lifeCycle: PkgCmdHookLifecycle) {
	return `${action}.${lifeCycle}`;
}

export class SiuPlugin {
	private hooks: Record<string, HookHandler[]>;
	private readonly _id: string;
	private ctx: PlugContext;
	private action: PkgCommand;
	private lifecycle: PkgCmdHookLifecycle;
	private _opts: Record<string, any>;
	constructor(id: string, defaultOpts?: Record<string, any>) {
		this._id = id;
		this._opts = defaultOpts || {};
		this.hooks = {};
	}

	id() {
		return this._id;
	}

	/**
	 *
	 * 新增插件hook
	 *
	 * @param hookName hook名称
	 * @param hookHandler hook处理器
	 */
	async addHook(action: PkgCommand, lifeCycle: PkgCmdHookLifecycle, hookHandler: HookHandler) {
		const hookId = getHookId(action, lifeCycle);
		this.hooks[hookId] = this.hooks[hookId] || [];
		this.hooks[hookId].push(hookHandler);
	}

	private async callHook(hookKey: string) {
		const handlers = this.hooks[hookKey];

		if (!handlers || !handlers.length) return;

		const next =
			hookKey.endsWith("error") || hookKey.endsWith("complete") || hookKey.endsWith("clean")
				? null
				: this.next.bind(this);

		for (let i = 0; i < handlers.length; i++) {
			await handlers[i]({
				ctx: this.ctx,
				opts: this.opts.bind(this),
				next
			});
		}
	}

	private async next(err?: Error) {
		if (err) {
			this.ctx.ex(err);
			return this.callHook(getHookId(this.action, "error"));
		}

		if (this.lifecycle === "start") {
			return this.callHook(getHookId(this.action, (this.lifecycle = "proc")));
		}

		if (this.lifecycle === "proc") {
			return this.callHook(getHookId(this.action, (this.lifecycle = "complete")));
		}
	}
	/**
	 *
	 * 获取当前插件在当前action的配置信息
	 *
	 * @param key 键名
	 */
	private opts<T>(key: string) {
		return this._opts[this.action]?.[key] as T;
	}

	private hasHook(hookId: string) {
		return this.hooks[hookId] && this.hooks[hookId].length;
	}

	/**
	 *
	 * 执行hooks
	 *
	 * @param pkgName package full name
	 * @param action 当前action
	 * @param actionOpts 当前运行类别携带的用户配置
	 */
	async apply(pkgName: string, action: PkgCommand, actionOpts: Record<string, any> = {}) {
		this.ctx = getCurrentPlugContext(this._id, pkgName);

		this.action = action;

		this._opts[action] = {
			...(this._opts[action] || {}),
			...actionOpts
		};

		const hasStartHook = this.hasHook(getHookId(action, "start"));
		const hasProcHook = this.hasHook(getHookId(action, "proc"));

		const hasHook = hasStartHook || hasProcHook;

		if (!hasHook) return;

		console.log(chalk.hex("#4c91ff").bold(`[${pkgName}:${this.ctx.id()}:${action}] ============\n`));

		try {
			await this.callHook(getHookId(action, (this.lifecycle = hasStartHook ? "start" : "proc")));
		} catch (ex) {
			console.log(chalk.redBright(`\n[${this._id}] ERROR:`));
			this.ctx.ex(ex);
			await this.callHook(getHookId(action, "error"));
		}

		console.log(chalk.hex("#4c91ff").bold(`\n============ [${pkgName}:${this.ctx.id()}:${action}]\n`));
	}
	/**
	 *
	 * 清理当前package的流程废弃物
	 *
	 * @param pkgDirName dirname of package
	 */
	async clean(pkgDirName: string) {
		this.ctx = getCurrentPlugContext(this._id, pkgDirName);
		await this.callHook(getHookId(this.action, "clean"));
	}
}
