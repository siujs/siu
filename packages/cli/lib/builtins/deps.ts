import { changeDeps } from "@siujs/builtin-deps";
import { HookHandlerContext, plugin } from "@siujs/core";

export function asDepsFallback() {
	const plug = plugin();

	plug.deps.process(async (ctx: HookHandlerContext) => {
		await changeDeps(ctx.opts<string>("pkgNames"), ctx.opts<string>("dep"), ctx.opts<"rm" | "add">("action"));
	});
}
