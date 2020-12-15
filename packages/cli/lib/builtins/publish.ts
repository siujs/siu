import { release } from "@siujs/builtin-publish";
import { HookHandlerContext, plugin } from "@siujs/core";

export function asPublishFallback() {
	const plug = plugin();

	plug.deps.process(async (ctx: HookHandlerContext) => {
		await release();
	});
}
