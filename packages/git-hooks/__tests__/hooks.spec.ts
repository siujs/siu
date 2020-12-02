import path from "path";

import { getChangedFilePaths } from "../lib/utils";

const cmd = path.resolve(__dirname, "../../../../");

describe("git hooks ut", () => {
	it("getChangedFilePaths", async done => {
		const files = await getChangedFilePaths(cmd);

		console.log(files);

		expect(files.length).toBe(1);

		expect(files[0]).toBe(path.resolve(cmd, "./test.js"));

		done();
	});
});
