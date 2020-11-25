import glob from "glob";
import path from "path";

import { Config } from "../config";
import { TOutputFormatKey } from "../config/Output";
import { asRollupPlugin, stopService } from "../esbuildService";
import { PkgData, SiuRollupBuilder } from "./base";

export class BabelPluginImportBuilder extends SiuRollupBuilder {
	private destESDir: string;
	constructor(pkgData: PkgData, destESDir: string) {
		super(pkgData);
		this.destESDir = destESDir;
	}

	onBuildFinished() {
		stopService();
	}

	async onConfigTransform(config: Config, format: TOutputFormatKey) {
		if (format === "es") {
			const destESFiles = glob
				.sync("**/*.ts", {
					cwd: this.destESDir
				})
				.reduce((prev, cur) => {
					prev[cur.replace(".ts", "")] = path.resolve(this.destESDir, cur);
					return prev;
				}, {} as Record<string, string>);

			config
				.input(destESFiles)
				.output(format)
				.format("es")
				.file("")
				.entryFileNames(path.resolve(this.pkgData.path, "dist/es/[name].js"))
				.plugin("esbuild")
				.use(asRollupPlugin(), [
					{
						sourcemap: false,
						loaders: {
							".ts": "ts"
						}
					}
				]);
		}
	}
}
