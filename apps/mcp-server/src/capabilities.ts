/**
 * @module @sszvis/mcp-server/capabilities
 *
 * Everything the server registers, apart from the transport, so tests can serve it
 * in memory.
 */
import { Layer } from "effect";

import { ChartApp } from "./chartApp.ts";
import { ChartTools } from "./chartTools.ts";
import { TopologyResources } from "./topology.ts";

export const Capabilities = Layer.mergeAll(ChartTools, ChartApp, TopologyResources);
