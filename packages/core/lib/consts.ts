import { PkgData } from "@siujs/utils";

import { PluginCommand, PluginCommandLifecycle } from "./types";

export const pluginCommands = ["create", "glint", "doc", "test", "build", "publish"] as PluginCommand[];

export const lifecycles = ["initCmdOpts", "start", "process", "complete", "error", "clean"] as PluginCommandLifecycle[];

export const GlobalKeyValues = {} as Record<string, any>;

export const PkgCaches = {} as Record<string, PkgData>;

export const noop = () => {};
