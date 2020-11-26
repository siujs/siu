import fs from "fs-extra";
import path from "path";

import { camelize, resolvePkgDirName } from "@siujs/utils";

import { PkgData } from "../../types";

export class MonorepoRootContext {
	private readonly _cwd: string;
	private readonly _pkgMetaCache: Record<string, PkgData> = {};
	private keyValues: Record<string, any> = {};
	constructor(cwd: string) {
		this._cwd = cwd;
	}
	/**
	 * 获取当前工作目录地址
	 */
	cwd() {
		return this._cwd;
	}
	/**
	 * 获取当前cwd下的packages位置
	 */
	pkgsRoot() {
		return path.resolve(this._cwd, "./packages");
	}
	/**
	 * 获取当前
	 */
	async allPkgDirs() {
		return await fs.readdir(this.pkgsRoot());
	}

	/**
	 * 获取指定pkg的完整数据信息
	 *
	 * @param pkgName pkg名称
	 */
	pkgData(pkgName: string) {
		const dirName = resolvePkgDirName(pkgName);

		if (!this._pkgMetaCache[dirName]) {
			const pkgsRoot = this.pkgsRoot();

			const pkgPath = path.resolve(pkgsRoot, dirName);

			const metaPath = path.resolve(pkgPath, "./package.json");

			const meta = fs.pathExistsSync(metaPath) ? fs.readJSONSync(metaPath) : { name: pkgName };

			this._pkgMetaCache[dirName] = {
				root: this.cwd(),
				pkgsRoot,
				path: pkgPath,
				name: meta.name,
				dirName,
				umdName: camelize(dirName, true),
				metaPath,
				meta
			} as PkgData;
		}

		return this._pkgMetaCache[dirName];
	}

	/**
	 *
	 * 1. 获取当前pkg上下文的临时缓存中特定键对应的值
	 * 2. 设置新的临时缓存键值对
	 *
	 * @param key 键名
	 * @param value [可选] 值
	 */
	keys<T>(key: string, value?: T) {
		if (value) {
			this.keyValues[key] = value;
			return;
		}
		return this.keyValues[key];
	}

	keysForPkg<T>(pkgName: string, key: string, value?: T) {
		const realKey = MonorepoRootContext.getPkgUniqKey(pkgName) + key;
		return this.keys(realKey, value);
	}

	keysForPlug<T>(pkgName: string, plugId: string, key: string, value?: T) {
		const realKey = MonorepoRootContext.getPlugUniqKey(plugId, pkgName) + key;
		return this.keys(realKey, value);
	}

	clean() {
		this.keyValues = {};
	}

	cleanPkg(pkgName: string) {
		const id = MonorepoRootContext.getPkgUniqKey(pkgName);

		Object.keys(this.keyValues)
			.filter(p => p.startsWith(id))
			.forEach(key => delete this.keyValues[key]);
	}

	cleanPlug(pkgName: string, plugId: string) {
		const id = MonorepoRootContext.getPlugUniqKey(plugId, pkgName);

		Object.keys(this.keyValues)
			.filter(p => p.startsWith(id))
			.forEach(key => delete this.keyValues[key]);
	}

	async getSortedPkgByPriority() {
		const pkgDirList = await this.allPkgDirs();

		const kv = {} as Record<string, number>;

		const pkgMetaNames = [] as string[];

		for (let l = pkgDirList.length; l--; ) {
			const meta = await fs.readJSON(path.resolve(ctx.pkgsRoot(), pkgDirList[l], "package.json"));
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
				prev[kv[cur]].push(resolvePkgDirName(cur));
				return prev;
			}, [] as string[][])
			.reverse()
			.flat();
	}

	static getPkgUniqKey(pkgName: string) {
		return `|__pkg:${resolvePkgDirName(pkgName)}__|`;
	}

	static getPlugUniqKey(plugId: string, pkgName: string) {
		return `|__pkg:${resolvePkgDirName(pkgName)}__|__plug:${plugId}__|`;
	}
}

let ctx: MonorepoRootContext;

export function getMonorepoRootContext() {
	if (!ctx) ctx = new MonorepoRootContext(process.cwd());
	return ctx;
}
