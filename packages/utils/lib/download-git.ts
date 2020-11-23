import path from "path";
import shell from "shelljs";

/**
 *
 * Download templates from git
 *
 * @param branch branch name
 * @param dest dest path
 */
export async function downloadGit(branch: string, dest: string) {
	return new Promise((resolve, reject) => {
		shell.exec(
			`git clone -b ${branch} https://gitee.com/kuafujs/siu-tpls ${dest}`,
			{ silent: true },
			(code, stdout, stderr) => {
				if (code === 0) {
					/**
					 * remove unused directory `.git`
					 */
					shell.rm("-rf", path.resolve(dest, "./.git"));
					resolve(stdout);
				} else {
					reject(stderr);
				}
			}
		);
	});
}
