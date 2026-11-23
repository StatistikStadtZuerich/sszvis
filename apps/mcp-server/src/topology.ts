import { Effect, Layer } from "effect";
import { McpServer } from "effect/ai";

import agglomerationZurich from "@sszvis/geodata/dist/topo/agglomeration-zurich.json?raw";
import stadtZurichHist from "@sszvis/geodata/dist/topo/stadt-zurich-hist.json?raw";
import stadtZurich from "@sszvis/geodata/dist/topo/stadt-zurich.json?raw";
import switzerland from "@sszvis/geodata/dist/topo/switzerland.json?raw";

export const topologyUri = (file: string) => `sszvis://topo/${file}`;

const topology = (file: string, json: string) =>
  McpServer.resource({
    uri: topologyUri(file),
    name: `TopoJSON: ${file}`,
    description: `The ${file} TopoJSON bundle from @sszvis/geodata, for the map recipes.`,
    mimeType: "application/json",
    content: Effect.succeed(json),
  });

export const TopologyResources = Layer.mergeAll(
  topology("agglomeration-zurich.json", agglomerationZurich),
  topology("stadt-zurich-hist.json", stadtZurichHist),
  topology("stadt-zurich.json", stadtZurich),
  topology("switzerland.json", switzerland),
);
