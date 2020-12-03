import { camelize, decodeCamelizeStr, deepFreezeObject, isLinux, isMac, isWindows, sortObject } from "../lib";
import { isOfficalPlugin, isSiuPlugin, resolvePluginId } from "../lib/plugin-id-resolve";

test("str:camelize", () => {
	expect(camelize("-a")).toBe("A");
	expect(camelize("-aB")).toBe("AB");
	expect(camelize("A-B")).toBe("AB");
	expect(camelize("a-b")).toBe("aB");
	expect(camelize("-a-b")).toBe("AB");
	expect(camelize("a--b")).toBe("a-B");
	expect(camelize("a-b", true)).toBe("AB");
});

test("str:decodeCamelizeStr", () => {
	expect(decodeCamelizeStr("A")).toBe("a");
	expect(decodeCamelizeStr("Ab")).toBe("ab");
	expect(decodeCamelizeStr("aB")).toBe("a-b");
	expect(decodeCamelizeStr("a-B")).toBe("a--b");
	expect(decodeCamelizeStr("abCD")).toBe("ab-c-d");
	expect(decodeCamelizeStr("-a")).toBe("-a");
});

test("env:ut", () => {
	expect(isWindows).toBe(true);
	expect(isMac).toBe(false);
	expect(isLinux).toBe(false);
});

test("sort-object:not keyOrder", () => {
	const kv = {
		a: 1,
		c: 2,
		b: 3
	};

	const kv2 = sortObject(kv);

	const keys2 = Object.keys(kv2);

	expect(keys2[0]).toBe("a");
	expect(keys2[1]).toBe("b");
	expect(keys2[2]).toBe("c");
});

test("sort-object:set keyOrder", () => {
	const kv = {
		a: 1,
		c: 2,
		b: 3,
		f: 4,
		e: 5
	};

	const kv2 = sortObject(kv, ["b", "a", "c"]);

	const keys2 = Object.keys(kv2);

	expect(keys2[0]).toBe("b");
	expect(keys2[1]).toBe("a");
	expect(keys2[2]).toBe("c");
	expect(keys2[3]).toBe("e");
	expect(keys2[4]).toBe("f");
});

test("sort-object:set dontSortByUnicode", () => {
	const kv = {
		a: 1,
		c: 2,
		b: 3,
		f: 4,
		e: 5
	};

	const kv2 = sortObject(kv, ["b", "a", "c"], true);

	const keys2 = Object.keys(kv2);

	expect(keys2[0]).toBe("b");
	expect(keys2[1]).toBe("a");
	expect(keys2[2]).toBe("c");
	expect(keys2[3]).toBe("f");
	expect(keys2[4]).toBe("e");
});

test("deepFreezeObject", () => {
	const kv = {
		creation: {
			start: 1
		}
	};

	deepFreezeObject(kv);

	try {
		kv.creation.start = 2;
	} catch {}
	expect(kv.creation.start).toBe(1);

	try {
		delete kv.creation.start;
	} catch {}
	expect(kv.creation).toHaveProperty("start");
});

test("isSiuPlugin", () => {
	expect(isSiuPlugin("@siujs/plugin-foo")).toBe(true);
	expect(isSiuPlugin("siujs-plugin-foo")).toBe(true);
	expect(isSiuPlugin("@scope/siujs-plugin-foo")).toBe(true);

	expect(isSiuPlugin("foo")).toBe(false);
	expect(isSiuPlugin("@scope/foo")).toBe(false);
	expect(isSiuPlugin("@scope/plugin-foo")).toBe(false);
});

test("isOfficalPlugin", () => {
	expect(isOfficalPlugin("@siujs/plugin-foo")).toBe(true);

	expect(isOfficalPlugin("@siujs/foo")).toBe(false);
	expect(isOfficalPlugin("siujs-plugin-foo")).toBe(false);
	expect(isOfficalPlugin("@scope/plugin-foo")).toBe(false);
	expect(isOfficalPlugin("@scope/siujs-plugin-foo")).toBe(false);
	expect(isOfficalPlugin("@scope.li/siujs-plugin-foo")).toBe(false);
});

test("resolvePluginId: full id", () => {
	expect(resolvePluginId("@siujs/plugin-foo")).toBe("@siujs/plugin-foo");
	expect(resolvePluginId("siujs-plugin-foo")).toBe("siujs-plugin-foo");
	expect(resolvePluginId("@scope/siujs-plugin-foo")).toBe("@scope/siujs-plugin-foo");
});

test("resolvePluginId: scoped short id", () => {
	expect(resolvePluginId("@siujs/foo")).toBe("@siujs/plugin-foo");
	expect(resolvePluginId("@siujs/bar")).toBe("@siujs/plugin-bar");
});

test("resolvePluginId: short id", () => {
	expect(resolvePluginId("foo")).toBe("siujs-plugin-foo");
	expect(resolvePluginId("bar")).toBe("siujs-plugin-bar");
});
