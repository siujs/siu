import path from "path";
import shell from "shelljs";

/**
 * get changed file paths which in staged changes
 *
 * @param {string} cwd current workspace directory
 *
 * @return {Promise<string[]} changed file paths
 */
export function getChangedFilePaths(cwd: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		shell.exec("git diff --name-only --cached", { silent: true }, (code, stdout, stderr) => {
			if (code === 0) {
				return resolve(
					stdout
						.split("\n")
						.filter(Boolean)
						.map(it => path.resolve(cwd, it))
				);
			}
			reject(stderr);
		});
	});
}

/**
 * get changed file paths which is commited
 *
 * @param {string} cwd current workspace directory
 *
 * @return {Promise<string[]} commited file paths
 */
export function getLatestCommitFilePaths(cwd: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		shell.exec("git diff --name-only HEAD^ HEAD", { silent: true }, (code, stdout, stderr) => {
			if (code === 0) {
				return resolve(
					stdout
						.split("\n")
						.filter(Boolean)
						.map(it => path.resolve(cwd, it))
				);
			}
			reject(stderr);
		});
	});
}
