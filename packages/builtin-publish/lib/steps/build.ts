import execa from "execa";

import { PublishContext } from "../ctx";
import { log } from "../utils";

export async function build(ctx: PublishContext) {
	log("\n Building packages...");
	await execa("yarn", ["build"], { stdio: "inherit" });
}
