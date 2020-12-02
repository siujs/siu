export interface PkgData {
	/**
	 * full name of package, equlas `name` in package.json
	 */
	name: string;
	/**
	 * directory name of package
	 */
	dirName: string;
	/**
	 * output name for umd format file
	 */
	umdName: string;
	/**
	 * absolute address of package
	 */
	path: string;
	/**
	 * absolute address of package's package.json
	 */
	metaPath: string;
	/**
	 * data of package's package.json
	 */
	meta?: Record<string, any>;
	/**
	 * absolute address of packages
	 */
	pkgsRoot: string;
	/**
	 * absolute address of current workspace
	 */
	root: string;
}

export type PluginCommand = "creation" | "genDocs" | "test" | "build" | "publish" | "glint";

export type PluginCommandLifecycle = "start" | "process" | "complete" | "error" | "clean";

export type GLintClientHooks = "pre-commit" | "prepare-commit-msg" | "commit-msg" | "post-commit" | "post-merge";

export type GLintHookHandler = <O extends Record<string, any>, R>(hook: GLintClientHooks, options: O) => R | Promise<R>;

export type PluginApi = Record<PluginCommand, Record<PluginCommandLifecycle, (fn: HookHandler) => void>>;

export type SiuConfigExcludePkgs = string[] | Record<PluginCommand, string[]>;

export interface SiuConfig {
	/**
	 *
	 *  指定pkgs(目录名称)排序来控制插件的执行顺序
	 *
	 * 	选项: "auto" | "priority" | custom stirng array
	 *
	 *  默认值: "priority"
	 *
	 *  提示:
	 *    auto: 默认按照package的目录名称排序
	 *    priority: 通过分析当前packages之间依赖关系形成的优先级数组(从高到低)
	 *    string[]: 自定义排序
	 *
	 *  使用场景:
	 *    想通过esbuild来快速打包ts项目, 但是这个时候又需要dts声明的情况下，可以利用这个优先级使用(ts --emitDeclarationOnly + @microsoft/api-extractor)
	 */
	pkgsOrder?: "auto" | "priority" | string[];
	/**
	 * 排除某些pkg参与plugin中的流程处理
	 */
	excludePkgs?: SiuConfigExcludePkgs;
	/**
	 * siujs的相关插件配置,必填
	 */
	plugins: (
		| string
		| [
				string,
				{
					excludePkgs?: SiuConfigExcludePkgs;
					custom?: Partial<Record<PluginCommand, Record<string, any>>>;
				}
		  ]
	)[];
}

export type HookHandlerOpts = <T extends any>(key: string) => T;
export type HookHandlerNext = (err?: Error) => Promise<void>;

export interface HookHandlerContext {
	/**
	 *
	 * 当前插件在当前生命周期钩子下的配置获取
	 *
	 * @param key 配置key
	 */
	opts<T>(key: string): T;
	/**
	 *
	 * 当前插件全局临时缓存设置/获取
	 *
	 * @param key 目标键
	 * @param value 如果设置则表示存入临时值,反之获取临时值
	 */
	keys<T>(key: string, value?: T): T extends unknown ? any : T;
	/**
	 *
	 * 当前插件在当前生命周期/当前pkg下的缓存设置/获取
	 *
	 * @param key 目标键
	 * @param value 如果设置则表示存入临时值,反之获取临时值
	 */
	scopedKeys<T>(key: string, value?: T): T extends unknown ? any : T;
	/**
	 *
	 * 当前插件在当前生命周期/当前pkg下的异常设置/获取
	 *
	 * @param value 如果设置则表示存入临时值,反之获取临时值
	 */
	ex(value?: Error | string): string | Error | void;
	/**
	 * 当前插件运行时对应的正在处理的package对象获取
	 */
	pkg(): PkgData | undefined;
	/**
	 * 刷新当前pkg的meta信息
	 */
	refreshPkgMeta(meta: Record<string, any>): void;
}

export type HookHandler = (ctx: HookHandlerContext, next: HookHandlerNext) => Promise<void> | void;
