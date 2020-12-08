import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import semver, { ReleaseType } from "semver";

import { PublishContext } from "../ctx";

const versionIncrements = [
	"patch",
	"minor",
	"major",
	"prepatch",
	"preminor",
	"premajor",
	"prerelease"
] as ReleaseType[];

export async function confirmVersion(ctx: PublishContext) {
	let targetVersion = ctx.opts("version");

	if (!targetVersion) {
		const meta = await fs.readJSON(path.resolve(ctx.root(), "package.json"));

		const rootVersion = meta.version || "0.0.0-alpha";

		const prereleaseArr = semver.prerelease(rootVersion);

		const preId = prereleaseArr && prereleaseArr.length ? prereleaseArr[0] : "alpha";

		const inc = (i: ReleaseType) => semver.inc(rootVersion, i, preId);

		const { release } = await inquirer.prompt({
			type: "list",
			name: "release",
			message: "Select release type",
			choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(["custom"])
		});

		if (release === "custom") {
			targetVersion = (
				await inquirer.prompt({
					type: "input",
					name: "version",
					message: "Input custom version",
					default: targetVersion
				})
			).version;
		} else {
			targetVersion = release.match(/\((.*)\)/)[1];
		}
	}

	if (!semver.valid(targetVersion)) {
		throw new Error(`Invalid target version: ${targetVersion}`);
	}

	const { yes } = await inquirer.prompt({
		type: "confirm",
		name: "yes",
		message: `Releasing v${targetVersion}. Confirm?`
	});

	if (!yes) {
		process.exit(1);
	}

	ctx.version(targetVersion);
}
