import chalk from "chalk";
import execa from "execa";
import fs from "fs-extra";
import path from "path";

import { PublishContext } from "../ctx";
import { log } from "../utils";

export async function publish(ctx: PublishContext) {
	const version = ctx.version() as string;

	const pkgRoots = ctx.pkgRoots();

	const customPkgTag = ctx.opts("pkgTag");

	for (let l = pkgRoots.length; l--; ) {
		const pkgName = path.basename(pkgRoots[l]);

		const meta = await fs.readJSON(ctx.pkgMetaPath(pkgRoots[l]));

		if (meta.private) continue;

		log(`Publishing ${pkgName}...`);

		const releaseTag = customPkgTag ? customPkgTag(pkgName) : null;

		const publishRegistry = ctx.opts("publishRegistry") || null;

		try {
			await execa(
				"npm",
				[
					"publish",
					...(releaseTag ? ["--tag", releaseTag] : []),
					"--access",
					"public",
					...(publishRegistry ? ["--registry", publishRegistry] : [])
				],
				{
					cwd: pkgRoots[l],
					stdio: "inherit"
				}
			);
			console.log(chalk.green(`Successfully published ${pkgName}@${version}`));
		} catch (e) {
			if (e.stderr.match(/previously published/)) {
				console.log(chalk.red(`Skipping already published: ${pkgName}`));
			} else {
				throw e;
			}
		}
	}
}
