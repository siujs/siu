import execa from "execa";

import { PublishContext } from "../ctx";
import { log } from "../utils";

export async function pushToGit(ctx: PublishContext) {
	log("\nPushing new version and tag to Git Server....");

	const newTag = `v${ctx.version()}`;

	await execa("git", ["tag", newTag]);
	await execa("git", ["push", ctx.opts("gitRemoteName"), `refs/tags/${newTag}`]);
	await execa("git", ["push"]);
}
