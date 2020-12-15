import { InputOptions, OutputOptions, RollupOptions } from "rollup";

import { ChainedMap } from "../ChainedMap";
import { ChainedSet } from "../ChainedSet";
import { Output, TOutputFormatKey } from "./Output";
import { Plugin } from "./Plugin";

export interface Config {
	input(value: string | Record<string, string>): Config;
	external: ChainedSet<Config, string>;
	plugin(name: string): Plugin<Config>;
	output(key: TOutputFormatKey): Output<Config>;
	treeshake(value: Record<string, any>): Config;
}

export class Config extends ChainedMap<void, any> {
	external: ChainedSet<Config, string>;
	plugins: ChainedMap<Config, Plugin<Config>>;
	outputs: ChainedMap<Config, Output<Config>>;
	constructor() {
		super();
		this.external = new ChainedSet<Config, string>(this);

		this.plugins = new ChainedMap<Config, Plugin<Config>>(this);

		this.outputs = new ChainedMap<Config, Output<Config>>(this);

		this.extend(["input", "treeshake"]);
	}

	output(key: TOutputFormatKey): Output<Config> {
		if (!this.outputs.has(key)) {
			this.outputs.set(key, new Output(this, key));
		}
		return this.outputs.get(key);
	}

	plugin(name: string): Plugin<Config> {
		if (!this.plugins.has(name)) {
			this.plugins.set(name, new Plugin(this, name));
		}
		return this.plugins.get(name);
	}

	hasPlugin(name: string): boolean {
		return this.plugins.has(name);
	}

	toInput(): InputOptions {
		const input = this.get("input") as string;
		const external = this.external.values();

		return this.clean({
			input,
			external,
			treeshake: this.get("treeshake"),
			plugins: this.plugins
				.values()
				.map(item => item.toConfig())
				.filter(Boolean)
		}) as InputOptions;
	}

	toOutput(): OutputOptions[] {
		return this.outputs
			.values()
			.map(it => it.toConfig())
			.filter(p => Object.keys(p).length);
	}

	toConfig(): RollupOptions {
		const inputOptions = this.toInput();

		const outOptions = this.toOutput();

		return this.clean({
			...inputOptions,
			output: outOptions
		});
	}

	toString(): string {
		return JSON.stringify(this.toConfig(), null, 2);
	}

	clone(): Config {
		const config = new Config();

		this.external.values().forEach(val => config.external.add(val));

		Object.entries(this.outputs.entries()).forEach(([key, value]) => {
			const output = config
				.output(key as TOutputFormatKey)
				.file(value.get("file"))
				.format(value.get("format"));

			Object.entries(value.globals.entries()).forEach(([key2, value2]) => {
				output.globals.set(key2, value2);
			});
		});

		Object.entries(this.plugins.entries()).forEach(([key, value]) => {
			config
				.plugin(key)
				// eslint-disable-next-line @typescript-eslint/ban-types
				.use(value.get("plugin") as Function, value.get("args") as any[]);
		});

		return config.input(this.get("input"));
	}
}

export * from "./Output";
