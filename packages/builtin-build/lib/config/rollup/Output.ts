import { GlobalsOption, ModuleFormat, OptionsPaths, OutputOptions, PreRenderedAsset, PreRenderedChunk } from "rollup";

import { ChainedMap } from "../ChainedMap";
import { Plugin } from "./Plugin";

export interface Output<T> {
	plugin(name: string): Plugin<Output<T>>;
	hasPlugin(name: string): boolean;

	assetFileNames(name: string | ((chunkInfo: PreRenderedChunk) => string)): Output<T>;
	banner(val: string | ((chunkInfo: PreRenderedAsset) => string)): Output<T>;
	chunkFileNames(name: string | ((chunkInfo: PreRenderedChunk) => string)): Output<T>;
	compact(val: boolean): Output<T>;
	dir(val: string): Output<T>;
	entryFileNames(name: string | ((chunkInfo: PreRenderedChunk) => string)): Output<T>;
	esModule(val: boolean): Output<T>;
	exports(val: "default" | "named" | "none" | "auto"): Output<T>;
	file(val: string): Output<T>;
	footer(val: string | (() => string | Promise<string>)): Output<T>;
	format(fmt: ModuleFormat): Output<T>;
	freeze(val: boolean): Output<T>;
	globals: ChainedMap<Output<T>, string>;
	name(val: string): Output<T>;
	paths: ChainedMap<Output<T>, string>;
	sourcemap(val: boolean | "inline" | "hidden"): Output<T>;
	sourcemapExcludeSources(val: boolean): Output<T>;
	sourcemapFile(val: string): Output<T>;
	strict(val: boolean): Output<T>;
}

export type TOutputFormatKey = "umd-min" | "umd" | "cjs" | "es";

const methods = [
	"assetFileNames",
	"banner",
	"chunkFileNames",
	"compact",
	"dir",
	"entryFileNames",
	"esModule",
	"exports",
	"file",
	"format",
	"freeze",
	"name",
	"sourcemap",
	"sourcemapExcludeSources",
	"sourcemapFile",
	"strict"
];

export class Output<T> extends ChainedMap<T, any> {
	protected readonly key: TOutputFormatKey;

	globals: ChainedMap<Output<T>, string>;
	paths: ChainedMap<Output<T>, string>;
	plugins: ChainedMap<Output<T>, Plugin<Output<T>>>;

	constructor(parent: T, key: TOutputFormatKey) {
		super(parent);
		this.key = key;
		this.globals = new ChainedMap<Output<T>, string>(this);
		this.paths = new ChainedMap<Output<T>, string>(this);
		this.plugins = new ChainedMap<Output<T>, Plugin<Output<T>>>(this);
		this.extend(methods);
	}

	plugin(name: string): Plugin<Output<T>> {
		if (!this.plugins.has(name)) {
			this.plugins.set(name, new Plugin(this, name));
		}
		return this.plugins.get(name);
	}

	hasPlugin(name: string): boolean {
		return this.plugins.has(name);
	}

	clear(): Output<T> {
		this.globals.clear();
		this.store.clear();
		return this;
	}

	toConfig(): OutputOptions {
		return this.clean({
			...methods.reduce((prev, cur) => {
				prev[cur] = this.get(cur);
				return prev;
			}, {} as Record<string, any>),
			plugins: this.plugins
				.values()
				.map(item => item.toConfig())
				.filter(Boolean),
			globals: this.globals.entries() as GlobalsOption,
			paths: this.paths.entries() as OptionsPaths
		});
	}
}
