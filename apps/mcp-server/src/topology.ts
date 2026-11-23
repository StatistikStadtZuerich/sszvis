import { Effect, Layer } from "effect";
import { McpServer } from "effect/ai";

import agglomerationZurich from "@sszvis/geodata/dist/topo/agglomeration-zurich.json?raw";
import stadtZurichHist from "@sszvis/geodata/dist/topo/stadt-zurich-hist.json?raw";
import stadtZurich from "@sszvis/geodata/dist/topo/stadt-zurich.json?raw";
import switzerland from "@sszvis/geodata/dist/topo/switzerland.json?raw";

/** The `@sszvis/geodata` bundles, keyed by file name: what a recipe's `Asset.file` holds. */
export const TOPOLOGIES = {
  "agglomeration-zurich.json": agglomerationZurich,
  "stadt-zurich-hist.json": stadtZurichHist,
  "stadt-zurich.json": stadtZurich,
  "switzerland.json": switzerland,
} as const satisfies Readonly<Record<string, string>>;

export type TopologyFile = keyof typeof TOPOLOGIES;

export const topologyFiles = Object.keys(TOPOLOGIES) as TopologyFile[];

export const topologyUri = (file: string) => `sszvis://topo/${file}`;

const topology = (file: TopologyFile) =>
  McpServer.resource({
    uri: topologyUri(file),
    name: `TopoJSON: ${file}`,
    description: `The ${file} TopoJSON bundle from @sszvis/geodata, for the map recipes.`,
    mimeType: "application/json",
    content: Effect.succeed(TOPOLOGIES[file]),
  });

/*
 * For a client that reads them. The chart app does not: a host may refuse an app's
 * resources/read outside its own widget ("cannot read resource outside its widget scope"),
 * so it asks read_topology instead.
 */
export const TopologyResources = Layer.mergeAll(
  topology("agglomeration-zurich.json"),
  topology("stadt-zurich-hist.json"),
  topology("stadt-zurich.json"),
  topology("switzerland.json"),
);
