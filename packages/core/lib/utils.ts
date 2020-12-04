import fs from "fs-extra";
import path from "path";

import { camelize } from "@siujs/utils";

import { PkgData } from "./types";

/**
 *
 * 获取当前工作目录下的所有有效package的目录名称
 *
 * @param cwd 当前工作目录 默认process.cwd()
 */
export async function getPackageDirs(cwd = process.cwd()) {
	const pkgsRoot = path.resolve(cwd, "./packages");
	const dirs = await fs.readdir(pkgsRoot);
	return dirs.filter(dir => fs.statSync(path.resolve(pkgsRoot, dir)).isDirectory());
}

/**
 *
 * 获取当前工作目录下的所有有效package的地址
 *
 * @param cwd 当前工作目录 默认process.cwd()
 */
export async function getPackagePaths(cwd = process.cwd()) {
	const pkgsRoot = path.resolve(cwd, "./packages");
	const dirs = await getPackageDirs(cwd);
	return dirs.map(dir => path.resolve(pkgsRoot, dir));
}

/**
 *
 * 获取当前工作目录下的所有有效package的package.json数据内容
 *
 * @param cwd 当前工作目录 默认process.cwd()
 */
export async function getMetasOfPackages(cwd = process.cwd()) {
	const pkgPaths = await getPackagePaths(cwd);

	const kv = {} as Record<string, Record<string, any>>;

	for (let l = pkgPaths.length; l--; ) {
		kv[path.basename(pkgPaths[l])] = await fs.readJSON(path.resolve(pkgPaths[l], "package.json"));
	}

	return kv;
}

/**
 * 通过pkgName来得到准确的pkg目录名称
 *
 * @param pkgName 客户端传入的pkg名称
 *
 * @returns 正确的pkg目录名称
 */
export function getPkgDirName(pkgName: string) {
	let dirName = pkgName;
	if (dirName.startsWith("@") && ~dirName.indexOf("/")) {
		dirName = dirName.split("/").pop();
	}
	return dirName;
}

/**
 *
 * 获取当前package的完整数据结构
 *
 * @param pkgName 当前包的名称
 * @param cwd 当前工作目录 默认process.cwd()
 */
export function getPkgData(pkgName: string, cwd = process.cwd()): PkgData {
	const dirName = getPkgDirName(pkgName);

	const pkgsRoot = path.resolve(cwd, "./packages");

	const pkgPath = path.resolve(pkgsRoot, dirName);

	const metaPath = path.resolve(pkgPath, "./package.json");

	const meta = fs.pathExistsSync(metaPath) ? fs.readJSONSync(metaPath) : { name: pkgName };

	return {
		root: cwd,
		pkgsRoot,
		path: pkgPath,
		name: meta.name,
		dirName,
		umdName: camelize(dirName, true),
		metaPath,
		meta
	};
}

/**
 * 获取通过优先级排序的packag目录名称列表
 *
 *  priority: 主要是通过各个package被引用的计数大小倒排
 *
 * @param cwd current workspace directory
 */
export async function getSortedPkgByPriority(cwd = process.cwd()) {
	const pkgPaths = await getPackagePaths(cwd);

	const kv = {} as Record<string, number>;

	const pkgMetaNames = [] as string[];

	for (let l = pkgPaths.length; l--; ) {
		const meta = await fs.readJSON(path.resolve(pkgPaths[l], "package.json"));
		pkgMetaNames.push(meta.name);
		if (!kv[meta.name]) {
			kv[meta.name] = 0;
		}
		if (meta.dependencies) {
			Object.keys(meta.dependencies).reduce((prev, cur) => {
				prev[cur] = kv[meta.name] + 1;
				return prev;
			}, kv);
		}
	}

	return Object.keys(kv)
		.filter(key => pkgMetaNames.includes(key))
		.reduce((prev, cur) => {
			prev[kv[cur]] = prev[kv[cur]] || [];
			prev[kv[cur]].push(getPkgDirName(cur));
			return prev;
		}, [] as string[][])
		.reverse()
		.flat();
}

/**
 *
 * Find up working directory of `siu.config.js `
 *
 * @param cwd current workspace directory
 * @param deep search deep
 */
export async function findUpSiuConfigCwd(cwd = process.cwd(), deep = 3): Promise<string> {
	if (deep === 0) return "";

	const hasSiuConfig = await fs.pathExists(path.resolve(cwd, "./siu.config.js"));

	if (!hasSiuConfig) {
		return await findUpSiuConfigCwd(path.resolve(cwd, "../"), deep - 1);
	}

	return cwd;
}
