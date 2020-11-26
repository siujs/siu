import path from "path";

import { getMonorepoRootContext } from "../lib/plugin/context/root";

test(`getMonorepoRootContext`, async done => {
	process.chdir(path.resolve(__dirname, "../../../"));

	const sortedPkgs = await getMonorepoRootContext().getSortedPkgByPriority();

	expect(JSON.stringify(sortedPkgs)).toBe(
		JSON.stringify(["utils", "core", "init-app", "rollup", "siu", "plugin-jssdk"])
	);

	done();
});
