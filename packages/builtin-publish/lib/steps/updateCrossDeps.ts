import fs from "fs-extra";
import path from "path";

import { PublishContext } from "../ctx";

export async function updateCrossDeps(ctx: PublishContext) {
	const version = ctx.version();

	const rootMeta = await fs.readJSON(path.resolve(ctx.root(), "package.json"));

	rootMeta.version = version;

	const dirs = ctx.pkgDirs();

	const pkgMetas = (await Promise.all(dirs.map(dir => fs.readJSON(ctx.pkgMetaPath(dir))))).reduce((prev, meta) => {
		prev[meta.name] = meta;
		return prev;
	}, {} as Record<string, Record<string, any>>) as Record<string, Record<string, any>>;

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
		fs.writeJSON(path.resolve(ctx.root(), "package.json"), rootMeta, { spaces: 2 }),
		...Object.keys(pkgMetas).map((value, index) =>
			fs.writeJSON(path.resolve(ctx.pkgRoot(dirs[index]), "package.json"), pkgMetas[value], { spaces: 2 })
		)
	]);
}
