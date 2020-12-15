import fs from "fs-extra";
import path from "path";

export interface PublishContextOptions {
	/**
	 * Whether to use independent version for each package or special version string
	 */
	version?: "independent" | string;
	/**
	 *
	 * Custom published registry url
	 *
	 */
	publishRegistry?: string;
	/**
	 *
	 * default git remote name
	 *
	 */
	gitRemoteName?: "origin" | string;
	/**
	 *
	 * Special tag of target package
	 *
	 */
	pkgTag?: (pkgName: string) => string | null;
	/**
	 *
	 * Whether skip step of build
	 *
	 */
	skipStep?: ("lint" | "build" | "pushToGit")[];
}

const DEFAULT_OPTIONS = {
	independent: false,
	gitRemoteName: "origin"
};

export class PublishContext {
	private _cwd: string;
	private _version: string;
	private readonly _opts: PublishContextOptions;
	constructor(cwd: string, opts: PublishContextOptions) {
		this._cwd = cwd;
		this._opts = { ...DEFAULT_OPTIONS, ...(opts || {}) };
	}

	opts<T extends keyof PublishContextOptions>(key: T): PublishContextOptions[T] {
		return this._opts[key];
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
			.readdirSync(path.resolve(this._cwd, "packages"))
			.filter(p => !p.startsWith(".") && fs.statSync(this.pkgRoot(p)).isDirectory());
	}

	pkgRoots() {
		return this.pkgDirs().map(dir => this.pkgRoot(dir));
	}
}
