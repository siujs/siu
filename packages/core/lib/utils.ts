import { findUpSiuConfigCwd } from "@siujs/utils";

import { PluginCommand, PluginCommandLifecycle, PluginHookKey } from "./types";

/**
 *
 * 调整当前工作区间目录
 *
 */
export async function adjustCWD() {
	const siuConfigCWD = await findUpSiuConfigCwd();
	if (!siuConfigCWD) {
		throw new Error(`[siu] ERROR: Cant't find root workspace directory of \`siu.config.js\``);
	}
	process.chdir(siuConfigCWD);
}

/**
 *
 * 生成当前hook的标识
 *
 * @param action 操作名称
 * @param lifeCycle 操作周期
 */
export function getHookId(action: PluginCommand, lifeCycle: PluginCommandLifecycle) {
	return `${action}.${lifeCycle}` as PluginHookKey;
}
