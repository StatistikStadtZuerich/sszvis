/// <reference lib="webworker" />

import * as BrowserWorkerRunner from "@effect/platform-browser/BrowserWorkerRunner";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

import { findRecipe, recipes } from "@sszvis/chart-builder/recipes";
import { summarize } from "@sszvis/chart-builder/spec";
import { BuilderRpc } from "./domain";
import { makePipeline } from "./pipeline";

const summaries = recipes.map(summarize);

const BuilderRpcHandlers = BuilderRpc.toLayer(
  Effect.gen(function* () {
    const generate = yield* makePipeline;

    return BuilderRpc.of({
      compile: (spec) =>
        Effect.flatMap(findRecipe(spec.recipe), (recipe) => generate(recipe, spec)),
      recipes: () => Effect.succeed(summaries),
    });
  }),
);

const WorkerLive = RpcServer.layer(BuilderRpc, { concurrency: 2 }).pipe(
  Layer.provide(BuilderRpcHandlers),
  Layer.provide(RpcServer.layerProtocolWorkerRunner),
  Layer.provide(BrowserWorkerRunner.layer),
);

Effect.runFork(Layer.launch(WorkerLive).pipe(Effect.tapCause(Effect.logError)));
