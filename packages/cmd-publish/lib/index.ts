import { getContext, PublishContext } from "./ctx";
import { build } from "./steps/build";
import { commitChanges } from "./steps/commitChanges";
import { confirmVersion } from "./steps/confirmVersion";
import { lint } from "./steps/lint";
import { publish } from "./steps/publish";
import { pushToGit } from "./steps/pushToGit";
import { updateCrossDeps } from "./steps/updateCrossDeps";
import { log } from "./utils";

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

export async function release(hooks = DEFAULT_HOOKS) {
	const ctx = getContext();

	try {
		hooks.confirmVersion && (await hooks.confirmVersion(ctx));
		hooks.lint && (await hooks.lint(ctx));
		hooks.updateCrossDeps && (await hooks.updateCrossDeps(ctx));
		hooks.build && (await hooks.build(ctx));
		hooks.commitChanges && (await hooks.commitChanges(ctx));
		hooks.publish && (await hooks.publish(ctx));
		hooks.pushToGit && (await hooks.pushToGit(ctx));

		log(`\n run finished - run git diff to see package changes.`);
	} catch (ex) {
		throw ex;
	}
}
