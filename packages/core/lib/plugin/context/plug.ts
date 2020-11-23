import { getPkgContext, PkgContext } from "./pkg";
import { MonorepoRootContext } from "./root";

export class PlugContext {
	private readonly _id: string;
	private readonly _pkg: PkgContext;
	constructor(id: string, parent: PkgContext) {
		this._id = id;
		this._pkg = parent;
	}
	id() {
		return this._id;
	}
	/**
	 * 获取当前插件分配到的pkg上下文
	 */
	currentPkg() {
		return this._pkg;
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
		return this._pkg.parent().keysForPlug(this._pkg.pkgName(), this._id, key, value);
	}

	clean() {
		this._pkg.parent().cleanPlug(this._pkg.pkgName(), this._id);
	}
}

const caches = {} as Record<string, PlugContext>;

export function getCurrentPlugContext(id: string, pkgName: string) {
	const key = MonorepoRootContext.getPlugUniqKey(id, pkgName);
	return (caches[key] = caches[key] || new PlugContext(id, getPkgContext(pkgName)));
}
