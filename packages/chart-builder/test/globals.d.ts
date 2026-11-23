/** The globals a generated chart's page provides, so tsc can check the import-free script. */
declare const sszvis: typeof import("sszvis");

declare const d3: typeof import("d3");

declare const config: {
  readonly data: string;
  readonly id: string;
  readonly fallback: string;
  readonly topology?: string;
};

/** Opaque: charts only hand it back to `topojson`. */
type TopoGeometry = { readonly type: string };

type Topology = { readonly objects: Readonly<Record<string, TopoGeometry>> };

/**
 * Only the calls charts make, typed against d3's geo types (what sszvis' map components
 * accept) rather than `@types/topojson-client`, to avoid the dependency.
 */
declare const topojson: {
  feature(topology: Topology, object: TopoGeometry): import("d3").ExtendedFeatureCollection;
  mesh(
    topology: Topology,
    object?: TopoGeometry,
    filter?: (a: TopoGeometry, b: TopoGeometry) => boolean,
  ): import("d3").GeoPermissibleObjects;
};
