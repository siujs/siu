import { camelize, decodeCamelizeStr, isLinux, isMac, isWindows, sortObject } from "../lib";
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

test("isSiuPlugin", () => {
	expect(isSiuPlugin("@siu/cli-plugin-foo")).toBe(true);
	expect(isSiuPlugin("siu-cli-plugin-foo")).toBe(true);
	expect(isSiuPlugin("@buns/siu-cli-plugin-foo")).toBe(true);
	expect(isSiuPlugin("@buns.li/siu-cli-plugin-foo")).toBe(true);

	expect(isSiuPlugin("foo")).toBe(false);
	expect(isSiuPlugin("@buns/foo")).toBe(false);
	expect(isSiuPlugin("@buns.li/foo")).toBe(false);
	expect(isSiuPlugin("@buns/plugin-foo")).toBe(false);
});

test("isOfficalPlugin", () => {
	expect(isOfficalPlugin("@siu/cli-plugin-foo")).toBe(true);

	expect(isOfficalPlugin("@siu/foo")).toBe(false);
	expect(isOfficalPlugin("siu-plugin-foo")).toBe(false);
	expect(isOfficalPlugin("@buns/plugin-foo")).toBe(false);
	expect(isOfficalPlugin("@buns/siu-plugin-foo")).toBe(false);
	expect(isOfficalPlugin("@buns.li/siu-plugin-foo")).toBe(false);
});

test("resolvePluginId: full id", () => {
	expect(resolvePluginId("@siu/cli-plugin-vui")).toBe("@siu/cli-plugin-vui");
	expect(resolvePluginId("siu-cli-plugin-vui")).toBe("siu-cli-plugin-vui");
	expect(resolvePluginId("@buns/siu-cli-plugin-vui")).toBe("@buns/siu-cli-plugin-vui");
});

test("resolvePluginId: official short id", () => {
	expect(resolvePluginId("lib")).toBe("@siu/cli-plugin-lib");
	expect(resolvePluginId("vui")).toBe("@siu/cli-plugin-vui");
	expect(resolvePluginId("vui2")).toBe("@siu/cli-plugin-vui2");
	expect(resolvePluginId("vmfe")).toBe("@siu/cli-plugin-vmfe");
});

test("resolvePluginId: scoped short id", () => {
	expect(resolvePluginId("@siu/vui")).toBe("@siu/cli-plugin-vui");
	expect(resolvePluginId("@siu/lib")).toBe("@siu/cli-plugin-lib");
});

test("resolvePluginId: short id", () => {
	expect(resolvePluginId("vue")).toBe("siu-cli-plugin-vue");
	expect(resolvePluginId("node")).toBe("siu-cli-plugin-node");
});
