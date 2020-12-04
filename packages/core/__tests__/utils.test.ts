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
		JSON.stringify(["builder", "core", "git-hooks", "init-app", "publisher", "siu", "utils"])
	);

	done();
});

test("getPackagePaths", async done => {
	const dirs = await getPackagePaths(cwd);

	expect(JSON.stringify(dirs)).toBe(
		JSON.stringify(
			["builder", "core", "git-hooks", "init-app", "publisher", "siu", "utils"].map(it =>
				path.resolve(cwd, "packages", it)
			)
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

	expect(metas).toHaveProperty("utils");
	expect(metas).toHaveProperty("core");
	expect(metas).toHaveProperty("git-hooks");
	expect(metas).toHaveProperty("init-app");
	expect(metas).toHaveProperty("publisher");
	expect(metas).toHaveProperty("siu");
	expect(metas).toHaveProperty("builder");

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
		JSON.stringify(["utils", "core", "git-hooks", "init-app", "publisher", "siu", "builder"])
	);

	done();
});

test("findUpSiuConfigCwd", async done => {
	const targetCWD = await findUpSiuConfigCwd(path.resolve(__dirname, "../"));

	expect(targetCWD).toBe(cwd);

	done();
});
