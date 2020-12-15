import { GitClientHooksHandlers, lintWithGHooks } from "@siujs/builtin-githooks";
import { HookHandlerContext, plugin } from "@siujs/core";

export function asGLintFallback() {
	const plug = plugin();

	plug.deps.process(async (ctx: HookHandlerContext) => {
		await lintWithGHooks(ctx.opts<keyof GitClientHooksHandlers>("hookName"));
	});
}
