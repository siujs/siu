import { plugin } from "@siujs/core";

import { onBuildComplete, onBuildError, onBuildProc, onBuildStart } from "./build";
import { onCreationComplete, onCreationError, onCreationProc, onCreationStart } from "./creation";

const plug = plugin({});

plug.creation.start(onCreationStart);
plug.creation.proc(onCreationProc);
plug.creation.complete(onCreationComplete);
plug.creation.error(onCreationError);

plug.build.start(onBuildStart);
plug.build.proc(onBuildProc);
plug.build.complete(onBuildComplete);
plug.build.error(onBuildError);