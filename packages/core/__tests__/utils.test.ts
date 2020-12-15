import path from "path";

import {
	findUpSiuConfigCwd,
	getMetasOfPackages,
	getPackageDirs,
	getPackagePaths,
	getPkgData,
	getPkgDirName,
	getSortedPkgByPriority
} from "../lib/utils";

let cwd = "";
beforeAll(() => {
	cwd = path.resolve(__dirname, "../../../");
});

test("getPackageDirs", async done => {
	const dirs = await getPackageDirs(cwd);

	expect(JSON.stringify(dirs)).toBe(
		JSON.stringify([
			"cli",
			"builtin-build",
			"builtin-deps",
			"builtin-githooks",
			"cli-init",
			"builtin-publish",
			"core",
			"utils"
		])
	);

	done();
});

test("getPackagePaths", async done => {
	const dirs = await getPackagePaths(cwd);

	expect(JSON.stringify(dirs)).toBe(
		JSON.stringify(
			[
				"cli",
				"builtin-build",
				"builtin-deps",
				"builtin-githooks",
				"cli-init",
				"builtin-publish",
				"core",
				"utils"
			].map(it => path.resolve(cwd, "packages", it))
		)
	);

	done();
});

test("getPkgDirName", () => {
	expect(getPkgDirName("foo")).toBe("foo");
	expect(getPkgDirName("@siujs/foo")).toBe("foo");
	expect(getPkgDirName("/foo")).toBe("/foo");
});

test("getMetasOfPackages", async done => {
	const metas = await getMetasOfPackages(cwd);

	expect(!!metas).toBe(true);

	expect(metas).toHaveProperty("builtin-build");
	expect(metas).toHaveProperty("builtin-deps");
	expect(metas).toHaveProperty("builtin-githooks");
	expect(metas).toHaveProperty("cli-init");
	expect(metas).toHaveProperty("builtin-publish");
	expect(metas).toHaveProperty("core");
	expect(metas).toHaveProperty("cli");
	expect(metas).toHaveProperty("utils");

	done();
});

test("getPkgData", () => {
	const pkgData = getPkgData("utils", cwd);

	expect(pkgData).toHaveProperty("root");
	expect(pkgData.root).toBe(cwd);
	expect(pkgData).toHaveProperty("pkgsRoot");
	expect(pkgData.pkgsRoot).toBe(path.resolve(cwd, "packages"));
	expect(pkgData).toHaveProperty("path");
	expect(pkgData.path).toBe(path.resolve(cwd, "packages", "utils"));
	expect(pkgData).toHaveProperty("name");
	expect(pkgData.name).toBe("@siujs/utils");
	expect(pkgData).toHaveProperty("dirName");
	expect(pkgData.dirName).toBe("utils");
	expect(pkgData).toHaveProperty("umdName");
	expect(pkgData.umdName).toBe("Utils");
	expect(pkgData).toHaveProperty("metaPath");
	expect(pkgData.metaPath).toBe(path.resolve(cwd, "packages", "utils", "package.json"));
	expect(pkgData).toHaveProperty("meta");

	expect(pkgData.meta).toHaveProperty("name");
	expect(pkgData.meta.name).toBe("@siujs/utils");
});

test("getSortedPkgByPriority", async done => {
	const sortedPkgs = await getSortedPkgByPriority(cwd);

	expect(JSON.stringify(sortedPkgs)).toBe(
		JSON.stringify([
			"utils",
			"core",
			"builtin-publish",
			"cli-init",
			"builtin-githooks",
			"builtin-deps",
			"builtin-build",
			"cli"
		])
	);

	done();
});

test("findUpSiuConfigCwd", async done => {
	const targetCWD = await findUpSiuConfigCwd(__dirname);

	expect(targetCWD).toBe(__dirname);

	done();
});
