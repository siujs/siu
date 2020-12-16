import { CommandOptionsHandlerParams, plugin, PluginCommand } from "@siujs/core";

import { asBuildFallback } from "./build";
import { asCreationFallback } from "./create";
import { asDepsFallback } from "./deps";
import { asGLintFallback } from "./glint";
import { asPublishFallback } from "./publish";

export function loadDefaultCommander() {
	const plug = plugin();

	plug.create.initCmdOpts((cmd: CommandOptionsHandlerParams) => {
		cmd.option("-d, --deps <deps>", "name of siblings package, e.g. `pkg1` or `pkg1,pkg2`");
	});

	plug.build.initCmdOpts((cmd: CommandOptionsHandlerParams) => {
		cmd.option("-f, --format <format>", "Output format: es、cjs、umd、umd-min");
	});
}

export function loadFallback(cmd: PluginCommand) {
	switch (cmd) {
		case "create":
			asCreationFallback();
		case "build":
			asBuildFallback();
		case "deps":
			asDepsFallback();
		case "glint":
			asGLintFallback();
		case "publish":
			asPublishFallback();
	}
}
