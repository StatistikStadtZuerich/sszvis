/**
 * Where this app serves the files a chart loads besides its data. Only the app knows
 * its own routes, so a recipe names a file and this turns it into a URL.
 */
import type { Asset } from "./domain/spec";

/** `@sszvis/geodata`'s TopoJSON bundles, served under the same URL the examples load them from. */
export const TOPO_BASE = "/preview/_static/topo/";

export const assetUrl = (asset: Asset): string => `${TOPO_BASE}${asset.file}`;
