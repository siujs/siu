import { HookHandlerContext, plugin } from "@siujs/core";

export function asCreationFallback() {
	const plug = plugin();

	plug.deps.process(async (ctx: HookHandlerContext) => {});
}
