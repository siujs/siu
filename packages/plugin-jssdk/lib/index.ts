import { plugin } from "@siujs/core";

import { onBuildClean, onBuildComplete, onBuildError, onBuildProc, onBuildStart } from "./build";
import { onCreationComplete, onCreationError, onCreationProc, onCreationStart } from "./creation";

const plug = plugin({});

plug.creation.start(onCreationStart);
plug.creation.process(onCreationProc);
plug.creation.complete(onCreationComplete);
plug.creation.error(onCreationError);

plug.build.start(onBuildStart);
plug.build.process(onBuildProc);
plug.build.complete(onBuildComplete);
plug.build.error(onBuildError);
plug.build.clean(onBuildClean);
