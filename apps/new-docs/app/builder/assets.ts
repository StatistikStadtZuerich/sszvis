/**
 * Where this app serves the files a chart loads besides its data. Only the app knows
 * its own routes, so a recipe names a file and this turns it into a URL.
 */
import type { Asset } from "./domain/spec";

/**
 * `@sszvis/geodata`'s TopoJSON bundles, served under the same URL the examples load them
 * from. Under the site base, so the builder finds them on GitHub Pages' `/sszvis/` too.
 */
export const TOPO_BASE = `${import.meta.env.BASE_URL}preview/_static/topo/`;

export const assetUrl = (asset: Asset): string => `${TOPO_BASE}${asset.file}`;
