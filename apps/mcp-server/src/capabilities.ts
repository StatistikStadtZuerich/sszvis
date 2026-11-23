import { Layer } from "effect";

import { ChartApp } from "./chartApp.ts";
import { ChartTools } from "./chartTools.ts";
import { TopologyResources } from "./topology.ts";

export const Capabilities = Layer.mergeAll(ChartTools, ChartApp, TopologyResources);
