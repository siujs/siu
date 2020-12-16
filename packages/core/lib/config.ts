import fs from "fs-extra";
import path from "path";

import { resolvePluginId } from "@siujs/utils";

import { PluginCommand, SiuConfig, SiuConfigExcludePkgs } from "./types";

export function resolveSiuConfig(cwd: string) {
	const configFile = path.resolve(cwd, "siu.config.js");

	const exists = fs.pathExistsSync(configFile);

	if (!exists) {
		throw new Error("[@siujs/core] Error: Can't find `siu.config.js`");
	}

	const siuConfig = require(configFile) as SiuConfig;

	siuConfig.pkgsOrder = siuConfig.pkgsOrder || "priority";

	if (!siuConfig.plugins || !siuConfig.plugins.length) {
		console.warn("[@siujs/core] Warning: `plugins` can't be empty!");
		return siuConfig;
	}

	const { plugins } = siuConfig;

	for (let l = plugins.length; l--; ) {
		const plug = plugins[l];
		if (Array.isArray(plug)) {
			plug[0] = resolvePluginId(plug[0]);
		} else {
			plugins[l] = resolvePluginId(plug);
		}
	}

	return siuConfig;
}

export class SiuConfiger {
	private readonly _cwd: string;
	private readonly _config: SiuConfig;
	private _currentPluginId: string;
	private isResolved = false;
	constructor(cwd: string) {
		this._cwd = cwd;
		this._config = resolveSiuConfig(cwd);
	}

	isPkgDisable(pkgDirName: string, cmd: PluginCommand, plugId: string) {
		const { excludePkgs, plugins } = this._config;

		if (!plugins || !plugins.length) return false;

		function validFromExcludePkgs(excludePkgs: SiuConfigExcludePkgs) {
			if (Array.isArray(excludePkgs) && excludePkgs.includes(pkgDirName)) return true;
			const opts = (excludePkgs as Record<PluginCommand, string[]>)[cmd];
			if (opts && opts.includes(pkgDirName)) return true;
		}

		let flag = false;

		if (excludePkgs) {
			flag = !!validFromExcludePkgs(excludePkgs);
			if (flag) return true;
		}

		for (let l = plugins.length; l--; ) {
			const plug = plugins[l];
			if (Array.isArray(plug)) {
				if (plugId === plug[0] && plug[1] && plug[1].excludePkgs && validFromExcludePkgs(plug[1].excludePkgs)) {
					return true;
				}
			}
		}

		return false;
	}

	currentPlugId() {
		return this._currentPluginId || "__SIU_BUILTIN__";
	}

	resolvePlugins() {
		if (this.isResolved) return;

		const { plugins } = this._config;

		if (!plugins || !plugins.length) return;

		try {
			plugins.forEach(plug => {
				require((this._currentPluginId = Array.isArray(plug) ? plug[0] : plug));
			});
			this._currentPluginId = "";
			this.isResolved = true;
		} catch (ex) {
			throw new Error(`[@siujs/core] Error: can't resolve plugins ` + ex);
		}

		return this;
	}

	get(key: keyof SiuConfig) {
		return this._config[key];
	}

	options(plugId: string) {
		const { plugins } = this._config;

		if (!plugins || !plugins.length) return;

		const targetPlug = plugins.filter(plug => (Array.isArray(plug) ? plug[0] : plug) === plugId);

		return targetPlug && targetPlug.length && Array.isArray(targetPlug[0]) ? targetPlug[0][1].custom || {} : {};
	}
}

let cfger: SiuConfiger;

export function getSiuConfiger() {
	if (!cfger) cfger = new SiuConfiger(process.cwd());
	return cfger;
}
