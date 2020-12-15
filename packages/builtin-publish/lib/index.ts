import { PublishContext, PublishContextOptions } from "./ctx";
import { build } from "./steps/build";
import { commitChanges } from "./steps/commitChanges";
import { confirmVersion } from "./steps/confirmVersion";
import { lint } from "./steps/lint";
import { publish } from "./steps/publish";
import { pushToGit } from "./steps/pushToGit";
import { updateCrossDeps } from "./steps/updateCrossDeps";

export interface PublishHooks {
	confirmVersion: (ctx: PublishContext) => Promise<void>;
	lint: (ctx: PublishContext) => Promise<void>;
	updateCrossDeps: (ctx: PublishContext) => Promise<void>;
	build: (ctx: PublishContext) => Promise<void>;
	commitChanges: (ctx: PublishContext) => Promise<void>;
	publish: (ctx: PublishContext) => Promise<void>;
	pushToGit: (ctx: PublishContext) => Promise<void>;
}

export const DEFAULT_HOOKS = {
	confirmVersion,
	lint,
	updateCrossDeps,
	build,
	commitChanges,
	publish,
	pushToGit
} as Partial<PublishHooks>;

export async function release(opts: PublishContextOptions = {}, hooks = DEFAULT_HOOKS) {
	const ctx = new PublishContext(process.cwd(), opts);

	const skipStep = ctx.opts("skipStep") || [];

	try {
		hooks.confirmVersion && (await hooks.confirmVersion(ctx));

		!skipStep.includes("lint") && hooks.lint && (await hooks.lint(ctx));

		hooks.updateCrossDeps && (await hooks.updateCrossDeps(ctx));

		!skipStep.includes("build") && hooks.build && (await hooks.build(ctx));

		hooks.commitChanges && (await hooks.commitChanges(ctx));

		hooks.publish && (await hooks.publish(ctx));

		!skipStep.includes("pushToGit") && hooks.pushToGit && (await hooks.pushToGit(ctx));
	} catch (ex) {
		throw ex;
	}
}
