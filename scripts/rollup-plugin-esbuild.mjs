import { existsSync, statSync } from "fs";
import { extname, resolve, dirname, join, relative } from "path";
import { startService } from "esbuild";
import { createFilter } from "@rollup/pluginutils";

const defaultLoaders = {
	".js": "js",
	".jsx": "jsx",
	".ts": "ts",
	".tsx": "tsx"
};

export default (options = {}) => {
	let target;

	const loaders = {
		...defaultLoaders
	};

	if (options.loaders) {
		for (const key of Object.keys(options.loaders)) {
			const value = options.loaders[key];
			if (typeof value === "string") {
				loaders[key] = value;
			} else if (value === false) {
				delete loaders[key];
			}
		}
	}

	const extensions = Object.keys(loaders);
	const INCLUDE_REGEXP = new RegExp(`\\.(${extensions.map(ext => ext.slice(1)).join("|")})$`);
	const EXCLUDE_REGEXP = /node_modules/;

	const filter = createFilter(options.include || INCLUDE_REGEXP, options.exclude || EXCLUDE_REGEXP);

	let service;

	const stopService = () => {
		if (service) {
			service.stop();
			service = undefined;
		}
	};

	// The order is:
	// buildStart -> resolveId -> transform -> buildEnd -> renderChunk -> generateBundle

	const resolveFile = (resolved, index = false) => {
		for (const ext of extensions) {
			const file = index ? join(resolved, `index${ext}`) : `${resolved}${ext}`;
			if (existsSync(file)) return file;
		}
		return null;
	};

	return {
		name: "esbuild",

		async buildStart() {
			if (!service) {
				service = await startService();
			}
		},

		resolveId(importee, importer) {
			if (importer && importee[0] === ".") {
				const resolved = resolve(importer ? dirname(importer) : process.cwd(), importee);

				let file = resolveFile(resolved);
				if (file) return file;
				if (!file && existsSync(resolved) && statSync(resolved).isDirectory()) {
					file = resolveFile(resolved, true);
					if (file) return file;
				}
			}
		},

		async transform(code, id) {
			if (!filter(id)) {
				return null;
			}

			const ext = extname(id);
			const loader = loaders[ext];

			if (!loader || !service) {
				return null;
			}

			const defaultOptions = {};

			target = options.target || defaultOptions.target || "esnext";

			const result = await service.transform(code, {
				loader,
				target,
				jsxFactory: options.jsxFactory || defaultOptions.jsxFactory,
				jsxFragment: options.jsxFragment || defaultOptions.jsxFragment,
				define: options.define,
				sourcemap: options.sourceMap !== false,
				sourcefile: id
			});

			printWarnings(id, result, this);

			return result;
		},

		buildEnd(error) {
			// Stop the service early if there's error
			if (error && !this.meta.watchMode) {
				stopService();
			}
		},

		async renderChunk(code) {
			if (options.minify && service) {
				const result = await service.transform(code, {
					loader: "js",
					minify: true,
					target
				});
				if (result.cpde) {
					return result;
				}
			}
			return null;
		},

		generateBundle() {
			if (!this.meta.watchMode) {
				stopService();
			}
		}
	};
};

function printWarnings(id, result, plugin) {
	if (result.warnings) {
		for (const warning of result.warnings) {
			let message = `[esbuild]`;
			if (warning.location) {
				message += ` (${relative(process.cwd(), id)}:${warning.location.line}:${warning.location.column})`;
			}
			message += ` ${warning.text}`;
			plugin.warn(message);
		}
	}
}
