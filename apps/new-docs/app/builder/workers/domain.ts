import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

import { Source } from "../../lib/source";
import { BuilderCompileError } from "../domain/emit";
import { RecipeSummary, Spec } from "../domain/spec";

export const Generated = Schema.Struct({
  ts: Source,
  js: Source,
  html: Source,
  csv: Source,
});

export type Generated = typeof Generated.Type;

export class BuilderRpc extends RpcGroup.make(
  Rpc.make("compile", {
    payload: Spec,
    success: Generated,
    error: BuilderCompileError,
  }),
  Rpc.make("recipes", {
    payload: {},
    success: Schema.Array(RecipeSummary),
    // No `error`: the handler answers from a module-scope constant and cannot fail.
  }),
) {}
