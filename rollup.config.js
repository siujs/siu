import fs from "fs-extra";
import path from "path";
import esbuild from "./scripts/rollup-plugin-esbuild.mjs";
import externals from "rollup-plugin-node-externals";

// import dts from "rollup-plugin-dts";

const packagesRoot = path.resolve(__dirname, "./packages/");

const pkgDirList = fs.readdirSync(packagesRoot);

function resolvePkgInput(pkgDir) {
	return path.resolve(packagesRoot, pkgDir, "./lib/index.ts");
}

function resolvePkgOutput(pkgDir, format) {
	return path.resolve(packagesRoot, pkgDir, `./dist/index.${format === "es" ? "mjs" : "js"}`);
}

function getPkgDeps(pkgDir) {
	const meta = fs.readJSONSync(path.resolve(packagesRoot, pkgDir, "package.json"));

	return {
		...(meta.dependencies || {}),
		...(meta.peerDependencies || {}),
		...(meta.devDependencies || {})
	};
}

const configs = pkgDirList.map(pkgDir => {
	const deps = getPkgDeps(pkgDir);

	return {
		input: resolvePkgInput(pkgDir),
		output: [
			{
				format: "cjs",
				file: resolvePkgOutput(pkgDir),
				sourcemap: true
			},
			{
				format: "es",
				file: resolvePkgOutput(pkgDir, "es"),
				sourcemap: true
			}
		],
		plugins: [externals(), esbuild()],
		external: Object.keys(deps)
	};
});

export default configs;
