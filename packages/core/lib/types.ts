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
