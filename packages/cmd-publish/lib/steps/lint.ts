import execa from "execa";

import { PublishContext } from "../ctx";
import { log } from "../utils";

export async function lint(ctx: PublishContext) {
	log("\n Lint packages...");
	await execa("yarn", ["test"], { stdio: "inherit" });
}
