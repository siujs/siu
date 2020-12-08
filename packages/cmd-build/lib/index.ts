import { getPkgData } from "@siujs/core";

import { SiuRollupBuilder } from "./builder/rollup";
import { Config } from "./config";
import { asRollupPlugin, stopService } from "./esbuildService";

function transformConfig(config: Config) {
	config.plugin("esbuild").use(asRollupPlugin(), [
		{
			sourcemap: true,
			loaders: {
				".js": "js",
				".ts": "ts"
			}
		}
	]);
}

/**
 *
 * Default fallback handle for `siu build`
 *
 * @param pkgs package name string, use comma to split
 */
export async function simpleBuild(pkgs: string) {
	const datas = pkgs.split(",").map(pkg => getPkgData(pkg));

	for (let i = 0; i < datas.length; i++) {
		const builder = new SiuRollupBuilder(datas[i], {
			onConfigTransform: transformConfig
		});

		await builder.build();
	}

	stopService();
}

export * from "./builder/rollup";
export * from "./config";
export * from "./dts";
export * from "./esbuildService";
export * from "./pkgData";
export * from "rollup";
