/**
 * 通过pkgName来得到准确的pkg目录名称
 *
 * @param pkgName 客户端传入的pkg名称
 *
 * @returns 正确的pkg目录名称
 */
export function resolvePkgDirName(pkgName: string) {
	let dirName = pkgName;
	if (dirName.startsWith("@") && ~dirName.indexOf("/")) {
		dirName = dirName.split("/").pop();
	}
	return dirName;
}
