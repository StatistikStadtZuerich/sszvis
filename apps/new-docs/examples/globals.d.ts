/**
 * Examples are written the way a consumer writes them: a plain script that
 * reads `d3`, `sszvis` and `config` off the window, with no imports. These
 * declarations exist only so `tsc` can still check that code against the
 * library's real types — they emit nothing and are not part of the example.
 */
declare const sszvis: typeof import("sszvis");

/**
 * d3 ships no types of its own, so `@types/d3` is what makes this resolve.
 * Consumers writing TypeScript need it too; it cannot be declared as an sszvis
 * peer dependency, so the README is where that requirement is documented.
 */
declare const d3: typeof import("d3");

/** Injected by the example page, from the example's `example.json`. */
declare const config: {
  readonly data: string;
  readonly id: string;
  readonly fallback: string;
};

/**
 * A geometry inside a TopoJSON topology: a layer under `objects`, or one of the
 * two neighbours a `mesh` filter is asked about. The examples never read into
 * one, they only hand it back to `topojson`, so the type carries no structure.
 */
type TopoGeometry = { readonly type: string };

/** The topology the map examples fetch, as far as they read it: its layers by name. */
type Topology = { readonly objects: Readonly<Record<string, TopoGeometry>> };

/**
 * The map examples read `topojson` off the window too. `vite-plugin-examples`
 * adds the topojson-client script to any example whose code mentions it, so the
 * global exists exactly where it is used.
 *
 * Only `feature` and `mesh` are declared, because they are all the examples call,
 * and they are typed against d3's geo types rather than `@types/topojson-client`
 * so this needs no dependency of its own: those are the types sszvis' own map
 * components accept, which is the whole point of the declaration.
 */
declare const topojson: {
  /** The feature collection of one layer of the topology. */
  feature(topology: Topology, object: TopoGeometry): import("d3").ExtendedFeatureCollection;
  /**
   * The mesh of the shared boundaries. Pass a filter to keep only some arcs -
   * `(a, b) => a !== b` is the usual way to drop the outer boundary.
   */
  mesh(
    topology: Topology,
    object?: TopoGeometry,
    filter?: (a: TopoGeometry, b: TopoGeometry) => boolean,
  ): import("d3").GeoPermissibleObjects;
};
