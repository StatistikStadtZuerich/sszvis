/**
 * sszvis consumer visual-regression harness.
 *
 * Renders the production charts from `.reference/d3charts-website` twice - once
 * against the sszvis release each page pins, once against this working copy's
 * build - so breaking changes show up as a visible difference rather than a bug
 * report from downstream.
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { Command } from "effect/unstable/cli";
import { crawl } from "./commands/crawl.ts";
import { exportCommand } from "./commands/export.ts";
import { serve } from "./commands/serve.ts";
import { Manifest } from "./services/Manifest.ts";
import { Workspace } from "./services/Workspace.ts";

const root = Command.make("sszvis-regression").pipe(
  Command.withDescription("Compare the reference charts against this working copy of sszvis"),
);

/**
 * Provided through the root command rather than around `Command.run`, so that a
 * failure to build it - no reference checkout, most often - is rendered by the
 * CLI as the instruction it is instead of logged as a stack trace.
 */
const Harness = Manifest.layer.pipe(Layer.provideMerge(Workspace.layer));

root.pipe(
  Command.withSubcommands([serve, crawl, exportCommand]),
  Command.provide(Harness),
  Command.run({ version: "0.0.0" }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);
