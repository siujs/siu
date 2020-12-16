import { HookHandlerContext, plugin } from "@siujs/core";

export function asCreationFallback() {
	const plug = plugin();

	plug.create.process(async (ctx: HookHandlerContext) => {});
}
