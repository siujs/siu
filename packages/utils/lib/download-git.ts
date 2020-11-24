import path from "path";
import shell from "shelljs";

/**
 *
 * Download templates from git
 *
 * @param gitUrl git url
 * @param branch branch name
 * @param dest dest path
 */
export async function downloadGit(gitUrl: string, branch: string, dest: string) {
	return new Promise((resolve, reject) => {
		shell.exec(`git clone -b ${branch} ${gitUrl} ${dest}`, { silent: true }, (code, stdout, stderr) => {
			if (code === 0) {
				/**
				 * remove unused directory `.git`
				 */
				shell.rm("-rf", path.resolve(dest, "./.git"));
				resolve(stdout);
			} else {
				reject(stderr);
			}
		});
	});
}
