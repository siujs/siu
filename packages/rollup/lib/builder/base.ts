import fs from "fs-extra";
import path from "path";
import { ModuleFormat, rollup } from "rollup";
import gzipPlugin from "rollup-plugin-gzip";
import { terser } from "rollup-plugin-terser";
import { brotliCompressSync, gzipSync } from "zlib";

import { camelize } from "@siujs/utils";

import { Config } from "../config";
import { TOutputFormatKey } from "../config/Output";

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

const FormatMap = {
	"umd-min": "umd",
	umd: "umd",
	cjs: "cjs",
	es: "es"
} as Record<TOutputFormatKey, ModuleFormat>;

const TerserOptions = {
	// sourcemap option is removed. Now it is inferred from rollup options.
	// sourcemap: true,
	compress: {
		keep_infinity: true,
		pure_getters: true,
		passes: 10
	},
	output: {
		wrap_func_args: false
	},
	warnings: true,
	mangle: {}
};

const DEFAULT_BUILD_OPTIONS = {
	allowFormats: ["es", "cjs", "umd", "umd-min"] as TOutputFormatKey[],
	sizeCheck: true,
	gzipThreshold: 1024 * 1024 * 10
} as SiuRollupBuildOption;

/**
 *
 * calculate file size (unit: kb)
 *
 * @param {Buffer} fileContent file content buffer
 */
function toKB(fileContent: Buffer): string {
	return (fileContent.length / 1024).toFixed(2) + "kb";
}

export interface SiuRollupBuildOption {
	allowFormats?: TOutputFormatKey[];
	gzipThreshold?: number;
	sizeCheck?: boolean;
}

export class SiuRollupBuilder {
	protected pkgData: PkgData;
	protected config: Config;
	protected browserConfig: Config;
	constructor(pkgData: PkgData) {
		this.pkgData = pkgData;
		this.config = new Config();
		this.browserConfig = new Config();
	}
	private initBrowserConfig(mini?: boolean) {
		const config = this.browserConfig;

		config.input(path.resolve(this.pkgData.path, "lib/index.ts"));

		if (mini) {
			config
				.output("umd-min")
				.format(FormatMap["umd-min"])
				.exports("named")
				.file(path.resolve(this.pkgData.path, `dist/${this.pkgData.dirName}.min.js`))
				.plugin("gzip")
				.use(gzipPlugin)
				.end()
				.plugin("brotli")
				.use(gzipPlugin, [
					{
						customCompression: (content: string) => brotliCompressSync(Buffer.from(content)),
						fileName: ".br"
					}
				])
				.end()
				.plugin("mini")
				.use(terser, [TerserOptions]);
		} else {
			config
				.output("umd")
				.format(FormatMap.umd)
				.exports("named")
				.file(path.resolve(this.pkgData.path, `dist/${this.pkgData.dirName}.js`));
		}

		return config;
	}

	private initConfig(format: "cjs" | "es") {
		const config = this.config;

		config.input(path.resolve(this.pkgData.path, "lib/index.ts"));

		config
			.output(format)
			.format(FormatMap[format])
			.exports("named")
			.file(path.resolve(this.pkgData.path, `dist/${this.pkgData.dirName}.${format === "es" ? "mjs" : "cjs"}`));

		Object.keys(this.pkgData.meta.dependencies || []).forEach(item => {
			config.external.add(item);
			config
				.output(format)
				.globals.set(
					item,
					camelize(item.startsWith("@") && ~item.indexOf("/") ? item.replace(/^@[\w-]+(\.)?[\w-]+\//g, "") : item, true)
				);
		});

		return config;
	}

	static async checkSize(filePath: string, gzipThreshold = 1024 * 1024 * 10) {
		const file = fs.readFileSync(filePath);

		const minSize = toKB(file);

		const gzippedFile = gzipSync(file);
		const gzippedSize = toKB(gzippedFile);

		if (gzippedFile.length >= gzipThreshold) {
			// 生成.gz文件
			await fs.writeFile(filePath + ".gz", gzippedFile);
		}

		const compressedFile = brotliCompressSync(file);
		const compressedSize = toKB(compressedFile);

		if (compressedFile.length >= gzipThreshold) {
			// 生成.gz文件
			await fs.writeFile(filePath + ".br", compressedFile);
		}

		return {
			mini: minSize,
			gzip: gzippedSize,
			brotli: compressedSize
		};
	}

	/**
	 *
	 * 自定义转换浏览器环境的配置
	 *
	 * @param config browser config or non-browser config
	 * @param format "browser" | "browser-min" | "module" | "main"
	 */
	protected onConfigTransform(config: Config, format: TOutputFormatKey): void | Promise<void> {}

	/**
	 * 构建开始
	 */
	protected onBuildStart(opts: SiuRollupBuildOption): void | Promise<void> {}

	/**
	 * 构建完成时的调用
	 */
	protected onBuildFinished(): void | Promise<void> {}

	/**
	 * 构建发生异常时候的处理
	 *
	 * @param ex - 异常信息
	 */
	protected onBuildError(ex: Error): void | Promise<void> {}

	/**
	 *
	 * 执行构建流程
	 *
	 * @param opts 构建时的相关设置
	 */
	async build(opts: SiuRollupBuildOption) {
		try {
			opts = {
				...DEFAULT_BUILD_OPTIONS,
				...opts
			};

			const configs = new Set();

			await Promise.all(
				opts.allowFormats.map(format => {
					switch (format) {
						case "umd-min":
							configs.add(this.browserConfig);
							return this.onConfigTransform(this.initBrowserConfig(true), format);
						case "umd":
							configs.add(this.browserConfig);
							this.initBrowserConfig();
							return this.onConfigTransform(this.initBrowserConfig(), format);
						case "cjs":
						case "es":
							configs.add(this.config);
						default:
							return this.onConfigTransform(this.initConfig(format), format);
					}
				})
			);

			const finalConfigs = Array.from(configs) as Config[];

			await this.onBuildStart(opts);

			for (let l = finalConfigs.length; l--; ) {
				const bundle = await rollup(finalConfigs[l].toInput());
				await Promise.all(finalConfigs[l].toOutput().map(bundle.write));
			}

			await this.onBuildFinished();
		} catch (ex) {
			await this.onBuildError(ex);
		}
	}
}
