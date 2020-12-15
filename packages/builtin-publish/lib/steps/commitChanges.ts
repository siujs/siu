import execa from "execa";

import { PublishContext } from "../ctx";
import { log } from "../utils";

export async function commitChanges(ctx: PublishContext) {
	const { stdout } = await execa("git", ["diff"], { stdio: "pipe" });

	if (stdout) {
		log("\nCommitting Changes....");
		await execa("git", ["add", "-A"]);
		await execa("git", ["commit", "-m", `release: v${ctx.version()}`]);
	} else {
		console.log("No changes to commit.");
	}
}
