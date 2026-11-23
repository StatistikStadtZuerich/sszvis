/* Recipes name asset files; only the app knows the routes that serve them. */
import type { Asset } from "@sszvis/chart-builder/spec";

/** The URL the examples load `@sszvis/geodata`'s TopoJSON bundles from. */
export const TOPO_BASE = `${import.meta.env.BASE_URL}preview/_static/topo/`;

export const assetUrl = (asset: Asset): string => `${TOPO_BASE}${asset.file}`;
