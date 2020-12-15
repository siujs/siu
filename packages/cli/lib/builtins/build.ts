import { asRollupPlugin, Config, SiuRollupBuilder, stopService, TOutputFormatKey } from "@siujs/builtin-build";
import { HookHandlerContext, HookHandlerNext, plugin } from "@siujs/core";

function transformConfig(config: Config) {
	config.plugin("esbuild").use(asRollupPlugin(), [
		{
			sourcemap: true,
			loaders: {
				".js": "js",
				".mjs": "js",
				".cjs": "js",
				".ts": "ts"
			}
		}
	]);
}

export function asBuildFallback() {
	const plug = plugin();

	plug.build.process(async (ctx: HookHandlerContext, next: HookHandlerNext) => {
		const builder = new SiuRollupBuilder(ctx.pkg(), {
			onConfigTransform: transformConfig
		});

		const format = ctx.opts<string>("format");

		await builder.build({
			[`allowFormats`]: format && (format.split(",") as TOutputFormatKey[])
		});

		await next();
	});

	plug.build.complete(() => {
		stopService();
	});
}
