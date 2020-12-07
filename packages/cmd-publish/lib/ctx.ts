import fs from "fs";
import path from "path";

export class PublishContext {
	private _cwd: string;
	private _version: string;
	constructor(cwd: string) {
		this._cwd = cwd;
	}

	version(version?: string) {
		if (version) {
			this._version = version;
			return this;
		}
		return this._version;
	}

	bin(name: string) {
		return path.resolve(this._cwd, "node_modules/.bin/", name);
	}

	root() {
		return this._cwd;
	}

	pkgRoot(pkg: string) {
		return path.resolve(this._cwd, "packages", pkg);
	}

	pkgMetaPath(pkg: string) {
		return path.resolve(this._cwd, "packages", pkg, "package.json");
	}

	pkgDirs() {
		return fs
			.readdirSync(path.resolve(this._cwd, "../packages"))
			.filter(p => !p.startsWith(".") && fs.statSync(this.pkgRoot(p)).isDirectory());
	}

	pkgRoots() {
		return this.pkgDirs().map(dir => this.pkgRoot(dir));
	}
}

let instance: PublishContext;

export function getContext() {
	return instance || (instance = new PublishContext(process.cwd()));
}
