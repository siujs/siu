import fs from "fs-extra";

import { getMonorepoRootContext, MonorepoRootContext } from "./root";

export class PkgContext {
	private readonly _pkgName: string;
	private readonly _parent: MonorepoRootContext;
	private readonly __cacheKeyPrefix__: string;
	constructor(pkgName: string, parent: MonorepoRootContext) {
		this._parent = parent;
		this._pkgName = pkgName;
		this.__cacheKeyPrefix__ = `__pkg:${this.pkgName}__`;
	}

	parent() {
		return this._parent;
	}

	pkgName() {
		return this._pkgName;
	}

	/**
	 * 获取当前pkg上下文的pkg数据
	 */
	pkgData() {
		return this._parent.pkgData(this._pkgName);
	}

	/**
	 *
	 * 刷新pkg.meta
	 *
	 * @param keyValue 新的键值对
	 */
	async refreshPkgMeta(keyValue: Record<string, any>) {
		const pkgData = this.pkgData();
		await fs.writeJSON(pkgData.metaPath, { ...pkgData.meta, ...keyValue }, { spaces: 2 });
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
		return this._parent.keysForPkg(this._pkgName, key, value);
	}

	clean() {
		this._parent.cleanPkg(this._pkgName);
	}
}

const ctxCaches = {} as Record<string, PkgContext>;

export function getPkgContext(pkgName: string) {
	const dirName = MonorepoRootContext.resolvePkgDirName(pkgName);

	if (!ctxCaches[dirName]) {
		ctxCaches[dirName] = new PkgContext(pkgName, getMonorepoRootContext());
	}

	return ctxCaches[dirName];
}
