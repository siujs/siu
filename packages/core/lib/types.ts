import { PlugContext } from "./plugin/context/plug";

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

export type PkgCommand = "creation" | "rm" | "addDeps" | "test" | "build" | "publish" | "genDocs";

export type PkgCmdHookLifecycle = "start" | "proc" | "complete" | "error" | "clean";

export type SiuConfigExcludePkgs = string[] | Record<PkgCommand, string[]>;

export interface SiuConfig {
	/**
	 *
	 *  指定pkgs(目录名称)排序来控制插件的执行顺序
	 *
	 * 	选项: "auto" | "priority" | custom stirng array
	 *
	 *  默认值: "auto"
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
					custom?: Partial<Record<PkgCommand, Record<string, any>>>;
				}
		  ]
	)[];
}

export type HookHandlerOpts = <T extends any>(key: string) => T;
export type HookHandlerNext = (err?: Error) => Promise<void>;

export interface HookHandlerApi {
	ctx: PlugContext;
	opts: HookHandlerOpts;
	next: HookHandlerNext;
}

export type HookHandler = (api: HookHandlerApi) => Promise<void> | void;

export { PlugContext };
