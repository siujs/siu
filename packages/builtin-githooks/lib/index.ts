import { GitClientHooks } from "./hooks";
import { GitClientHooksHandlers } from "./types";

export * from "./types";
export * from "./utils";

/**
 *
 * invoke default githooks handle
 *
 * @param hookName git hook name
 * @param cwd [optional] current workspace directory
 */
export async function lintWithGHooks(hookName: keyof GitClientHooksHandlers, cwd?: string) {
	const instance = new GitClientHooks(cwd || process.cwd());
	await instance[hookName]();
}
