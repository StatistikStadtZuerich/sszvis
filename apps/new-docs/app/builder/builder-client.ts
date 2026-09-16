import { useAtom } from "@effect/atom-react";
import * as BrowserWorker from "@effect/platform-browser/BrowserWorker";
import { useSelector } from "@tanstack/react-form";
import { Effect, Layer, Option } from "effect";
import { AsyncResult, Atom, AtomRpc } from "effect/unstable/reactivity";
import { RpcClient } from "effect/unstable/rpc";
import { useEffect, useMemo } from "react";

import type { BuilderForm } from "./builder-form";
import { identity } from "./domain/identity";
import type { Spec } from "./domain/spec";
import { BuilderRpc } from "./workers/domain";

export const WORKER_STOPPED_MESSAGE = "The chart builder's worker stopped unexpectedly.";
class BuilderClient extends AtomRpc.Service<BuilderClient>()("builder/BuilderClient", {
  group: BuilderRpc,
  protocol: RpcClient.layerProtocolWorker({ size: 1, concurrency: 2 }).pipe(
    Layer.provide(
      BrowserWorker.layer(
        () =>
          new Worker(new URL("./workers/builder.worker.ts", import.meta.url), {
            type: "module",
          }),
      ),
    ),
  ),
}) {}

export const recipesAtom = BuilderClient.query("recipes", {});

const compileAtom = BuilderClient.runtime.fn(
  Effect.fnUntraced(function* (spec: Spec) {
    // NOTE: debounce: an atom call interrupts its predecessor
    yield* Effect.sleep("200 millis");
    const client = yield* BuilderClient;
    const generated = yield* client("compile", spec);

    return { spec, generated } as const;
  }),
);

type Freshness = "fresh" | "compiling" | "stale";

export const useBuilderCompile = (form: BuilderForm) => {
  const spec = useSelector(form.store, (state) => state.values);
  const valid = useSelector(form.store, (state) => state.isValid);
  const [result, compile] = useAtom(compileAtom);

  useEffect(() => {
    compile(valid ? spec : Atom.Interrupt);
  }, [compile, spec, valid]);

  const settled = Option.getOrUndefined(AsyncResult.value(result));
  const error = AsyncResult.builder(result)
    .onErrorTag("BuilderCompileError", (e) => e.message)
    .onErrorTag("RpcClientError", () => WORKER_STOPPED_MESSAGE)
    .onDefect(() => WORKER_STOPPED_MESSAGE)
    .orNull();

  const live = useMemo(() => identity(spec), [spec]);
  const shown = useMemo(() => (settled === undefined ? null : identity(settled.spec)), [settled]);

  const freshness: Freshness =
    shown === live ? "fresh" : valid || result.waiting ? "compiling" : "stale";

  return { settled, error, freshness } as const;
};
