/*
 * @Author: buns
 * @Date: 2020-10-10 08:51:40
 * @LastEditTime: 2020-10-10 08:52:26
 * @Description: Judge current client environment
 */
export const isWindows = process.platform === "win32";
export const isMac = process.platform === "darwin";
export const isLinux = process.platform === "linux";
