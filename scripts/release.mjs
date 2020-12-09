import fs from "fs-extra";
import path2 from "path";
import execa2 from "execa";
import chalk2 from "chalk";
import inquirer2 from "inquirer";
import semver2 from "semver";

const DEFAULT_OPTIONS = {
	independent: false,
	gitRemoteName: "origin"
};
class PublishContext {
	constructor(cwd, opts) {
		this._cwd = cwd;
		this._opts = { ...DEFAULT_OPTIONS, ...(opts || {}) };
	}
	opts(key) {
		return this._opts[key];
	}
	version(version) {
		if (version) {
			this._version = version;
			return this;
		}
		return this._version;
	}
	bin(name) {
		return path2.resolve(this._cwd, "node_modules/.bin/", name);
	}
	root() {
		return this._cwd;
	}
	pkgRoot(pkg) {
		return path2.resolve(this._cwd, "packages", pkg);
	}
	pkgMetaPath(pkg) {
		return path2.resolve(this._cwd, "packages", pkg, "package.json");
	}
	pkgDirs() {
		return fs
			.readdirSync(path2.resolve(this._cwd, "packages"))
			.filter(p => !p.startsWith(".") && fs.statSync(this.pkgRoot(p)).isDirectory());
	}
	pkgRoots() {
		return this.pkgDirs().map(dir => this.pkgRoot(dir));
	}
}

const log = msg => console.log(chalk2.cyan(msg));

async function build(ctx2) {
	log("\n Building packages...");
	await execa2("yarn", ["build"], { stdio: "inherit" });
	await execa2("yarn", ["changelog"], { stdio: "inherit" });
}

async function commitChanges(ctx2) {
	const { stdout } = await execa2("git", ["diff"], { stdio: "pipe" });
	if (stdout) {
		log("\nCommitting Changes....");
		await execa2("git", ["add", "-A"]);
		await execa2("git", ["commit", "-m", `release: v${ctx2.version()}`]);
	} else {
		console.log("No changes to commit.");
	}
}

const versionIncrements = ["patch", "minor", "major", "prepatch", "preminor", "premajor", "prerelease"];
async function confirmVersion(ctx2) {
	let targetVersion = ctx2.opts("version");
	if (!targetVersion) {
		const meta = await fs.readJSON(path2.resolve(ctx2.root(), "package.json"));
		const rootVersion = meta.version || "0.0.0-alpha";
		const prereleaseArr = semver2.prerelease(rootVersion);
		const preId = prereleaseArr && prereleaseArr.length ? prereleaseArr[0] : "alpha";
		const inc = i => semver2.inc(rootVersion, i, preId);
		const { release } = await inquirer2.prompt({
			type: "list",
			name: "release",
			message: "Select release type",
			choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(["custom"])
		});
		if (release === "custom") {
			targetVersion = (
				await inquirer2.prompt({
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
	if (!semver2.valid(targetVersion)) {
		throw new Error(`Invalid target version: ${targetVersion}`);
	}
	const { yes } = await inquirer2.prompt({
		type: "confirm",
		name: "yes",
		message: `Releasing v${targetVersion}. Confirm?`
	});
	if (!yes) {
		process.exit(1);
	}
	ctx2.version(targetVersion);
}

async function lint(ctx2) {
	log("\n Lint packages...");
	await execa2("yarn", ["test"], { stdio: "inherit" });
}

async function publish(ctx2) {
	const version = ctx2.version();
	const pkgRoots = ctx2.pkgRoots();
	const customPkgTag = ctx2.opts("pkgTag");
	for (let l = pkgRoots.length; l--; ) {
		const pkgName = path2.basename(pkgRoots[l]);
		const meta = await fs.readJSON(ctx2.pkgMetaPath(pkgRoots[l]));
		if (meta.private) continue;
		log(`Publishing ${pkgName}...`);
		const releaseTag = customPkgTag ? customPkgTag(pkgName) : null;
		const publishRegistry = ctx2.opts("publishRegistry") || null;
		try {
			await execa2(
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
			console.log(chalk2.green(`Successfully published ${pkgName}@${version}`));
		} catch (e) {
			if (e.stderr.match(/previously published/)) {
				console.log(chalk2.red(`Skipping already published: ${pkgName}`));
			} else {
				throw e;
			}
		}
	}
}

async function pushToGit(ctx2) {
	log("\nPushing new version and tag to Git Server....");
	const newTag = `v${ctx2.version()}`;
	await execa2("git", ["tag", newTag]);
	await execa2("git", ["push", ctx2.opts("gitRemoteName"), `refs/tags/${newTag}`]);
	await execa2("git", ["push"]);
}

async function updateCrossDeps(ctx2) {
	const version = ctx2.version();
	const rootMeta = await fs.readJSON(path2.resolve(ctx2.root(), "package.json"));
	rootMeta.version = version;
	const dirs = ctx2.pkgDirs();
	const pkgMetas = (await Promise.all(dirs.map(dir => fs.readJSON(ctx2.pkgMetaPath(dir))))).reduce((prev, meta) => {
		prev[meta.name] = meta;
		return prev;
	}, {});
	const depTypes = ["dependencies", "peerDependencies"];
	const metas = Object.values(pkgMetas);
	depTypes.forEach(depType => {
		metas.forEach(meta => {
			meta.version = version;
			if (!meta[depType]) return;
			Object.keys(meta[depType]).forEach(key => {
				if (pkgMetas[key]) {
					meta[depType][key] = version;
				}
			});
		});
	});
	await Promise.all([
		fs.writeJSON(path2.resolve(ctx2.root(), "package.json"), rootMeta, { spaces: 2 }),
		...Object.keys(pkgMetas).map((value, index) =>
			fs.writeJSON(path2.resolve(ctx2.pkgRoot(dirs[index]), "package.json"), pkgMetas[value], { spaces: 2 })
		)
	]);
}

const DEFAULT_HOOKS = {
	confirmVersion: confirmVersion,
	lint: lint,
	updateCrossDeps: updateCrossDeps,
	build: build,
	commitChanges: commitChanges,
	publish: publish,
	pushToGit: pushToGit
};
async function release(opts = {}, hooks = DEFAULT_HOOKS) {
	const ctx2 = new PublishContext(process.cwd(), opts);
	const skipStep = ctx2.opts("skipStep") || [];
	try {
		hooks.confirmVersion && (await hooks.confirmVersion(ctx2));
		!skipStep.includes("lint") && hooks.lint && (await hooks.lint(ctx2));
		hooks.updateCrossDeps && (await hooks.updateCrossDeps(ctx2));
		!skipStep.includes("build") && hooks.build && (await hooks.build(ctx2));
		// hooks.commitChanges && (await hooks.commitChanges(ctx2));
		hooks.publish && (await hooks.publish(ctx2));
		!skipStep.includes("pushToGit") && hooks.pushToGit && (await hooks.pushToGit(ctx2));
	} catch (ex) {
		throw ex;
	}
}

import minimist from "minimist";

const args = minimist(process.argv.slice(2));

release({
	publishRegistry: args.registry || "https://registry.npmjs.org/",
	skipStep: args.skipStep || []
}).then(ex => console.log(ex));
