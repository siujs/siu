import path from "path";

import { analysisDepsStr, getPkgMeta, getPkgPath, isLocalPackage, transformDepStr } from "../lib/utils";

test(" transformDepStr ", () => {
	let depsMap = transformDepStr("foo");
	expect(depsMap.name).toBe("foo");
	expect(depsMap.version).toBe("latest");

	depsMap = transformDepStr("foo:D");
	expect(depsMap.name).toBe("foo");
	expect(depsMap.version).toBe("latest");

	depsMap = transformDepStr("foo@1.1.1");
	expect(depsMap.name).toBe("foo");
	expect(depsMap.version).toBe("1.1.1");

	depsMap = transformDepStr("foo@1.1.1:D");
	expect(depsMap.name).toBe("foo");
	expect(depsMap.version).toBe("1.1.1");
});

test(" analysisDepsStr ", () => {
	const map = analysisDepsStr("foo,foo2:D,foo3@1.0.0,foo4@1.0.0:D");

	expect(map).toHaveProperty("deps");
	expect(map.deps.length).toBe(2);
	expect(map.deps[0].name).toBe("foo");
	expect(map.deps[0].version).toBe("latest");
	expect(map.deps[1].name).toBe("foo3");
	expect(map.deps[1].version).toBe("1.0.0");

	expect(map).toHaveProperty("devDeps");
	expect(map.devDeps.length).toBe(2);

	expect(map.devDeps[0].name).toBe("foo2");
	expect(map.devDeps[0].version).toBe("latest");
	expect(map.devDeps[1].name).toBe("foo4");
	expect(map.devDeps[1].version).toBe("1.0.0");
});

test(" isLocalPackage ", async done => {
	process.chdir(path.resolve(__dirname, "../../../"));

	const depsVersion = require(path.resolve(process.cwd(), "packages", "cmd-deps", "package.json")).version;

	let version = await isLocalPackage("@siujs/cmd-deps");
	expect(version).toBe(depsVersion);

	version = await isLocalPackage("@siujs/cmd-deps2");
	expect(version).toBe("");

	done();
});

test(" getPkgPath ", () => {
	process.chdir(path.resolve(__dirname, "../../../"));
	expect(getPkgPath("cmd-deps")).toBe(path.resolve(process.cwd(), "packages", "cmd-deps"));
});

test(" getPkgMeta ", async done => {
	process.chdir(path.resolve(__dirname, "../../../"));

	const meta = await getPkgMeta("cmd-deps");

	expect(meta).toHaveProperty("name");
	expect(meta).toHaveProperty("version");
	expect(meta.name).toBe("@siujs/cmd-deps");
	expect(meta.version).toBe("1.0.0");

	done();
});
