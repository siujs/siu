import { HookHandlerContext, plugin } from "@siujs/core";
import { GitClientHooks } from "@siujs/git-hooks";
import { camelize } from "@siujs/utils";

const plug = plugin({});

const gitClientHooks = new GitClientHooks(process.cwd());

plug.glint.process(async (ctx: HookHandlerContext) => {
	const targetHook = ctx.opts<string>("hook");

	if (targetHook) {
		await gitClientHooks[camelize(targetHook) as keyof GitClientHooks]();
	}
});

plug.glint.error((ctx: HookHandlerContext) => {
	console.error(`[@siujs/glint]`, ctx.ex());
	process.exit(1);
});
