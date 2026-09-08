import type { Feature, FeatureCollection, Polygon } from "geojson";
import { describe, expect, test, vi } from "vitest";
import { MEMOIZE_CACHE_LIMIT } from "../../src/fn.js";
import type { PointProjection } from "../../src/map/mapUtils.js";
import {
  AGGLOMERATION_2012_KEY,
  GEO_KEY_DEFAULT,
  getGeoJsonCenter,
  pixelsFromGeoDistance,
  prepareMergedGeoData,
  STADT_KREISE_KEY,
  STATISTISCHE_QUARTIERE_KEY,
  STATISTISCHE_ZONEN_KEY,
  SWITZERLAND_KEY,
  swissMapPath,
  swissMapProjection,
  WAHL_KREISE_KEY,
  widthAdaptiveMapPathStroke,
} from "../../src/map/mapUtils.js";

/**
 * A unit square. The ring is wound clockwise because d3-geo interprets rings on the sphere:
 * counter-clockwise would describe the whole globe minus the square.
 */
const square = (id: string, offset = 0): Feature<Polygon> => ({
  type: "Feature",
  id,
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [offset, offset],
        [offset, offset + 1],
        [offset + 1, offset + 1],
        [offset + 1, offset],
        [offset, offset],
      ],
    ],
  },
});

const collection = (...features: Feature<Polygon>[]): FeatureCollection<Polygon> => ({
  type: "FeatureCollection",
  features,
});

describe("map utils", () => {
  describe("map id constants", () => {
    test("names the six built-in Zurich and Switzerland map ids", () => {
      expect(STADT_KREISE_KEY).toBe("zurichStadtKreise");
      expect(STATISTISCHE_QUARTIERE_KEY).toBe("zurichStatistischeQuartiere");
      expect(STATISTISCHE_ZONEN_KEY).toBe("zurichStatistischeZonen");
      expect(WAHL_KREISE_KEY).toBe("zurichWahlKreise");
      expect(AGGLOMERATION_2012_KEY).toBe("zurichAgglomeration2012");
      expect(SWITZERLAND_KEY).toBe("switzerland");
    });
  });

  describe("swissMapProjection", () => {
    test("returns a projection fitted to the given width and height", () => {
      const projection = swissMapProjection(100, 100, collection(square("a")), "fit-a");
      const [x, y] = projection([0.5, 0.5]) as [number, number];
      // The centre of the fitted feature lands in the centre of the destination box (Mercator's
      // latitude stretch puts it a fraction of a pixel off vertically).
      expect(x).toBeCloseTo(50, 3);
      expect(y).toBeCloseTo(50, 2);
    });

    test("caches by width, height and cache key, returning the identical projection", () => {
      const first = swissMapProjection(200, 150, collection(square("a")), "cache-hit");
      const second = swissMapProjection(200, 150, collection(square("a")), "cache-hit");
      expect(second).toBe(first);
    });

    test("recomputes when the cache key changes", () => {
      const first = swissMapProjection(200, 150, collection(square("a")), "key-one");
      const second = swissMapProjection(200, 150, collection(square("a")), "key-two");
      expect(second).not.toBe(first);
    });

    test("recomputes when the width or height changes", () => {
      const base = swissMapProjection(200, 150, collection(square("a")), "dims");
      expect(swissMapProjection(300, 150, collection(square("a")), "dims")).not.toBe(base);
      expect(swissMapProjection(200, 250, collection(square("a")), "dims")).not.toBe(base);
    });

    // NOTE: the feature collection is deliberately not part of the cache key - the JSDoc makes
    // varying the key the caller's responsibility. The consequence is that a reused key returns a
    // projection fitted to the wrong collection.
    test("ignores the feature collection when the cache key matches", () => {
      const near = swissMapProjection(100, 100, collection(square("a")), "shared-key");
      const far = swissMapProjection(100, 100, collection(square("b", 50)), "shared-key");
      expect(far).toBe(near);
      // The second collection is not fitted at all: its centre misses the destination box entirely.
      const [x, y] = far([50.5, 50.5]) as [number, number];
      expect(x).toBeGreaterThan(100);
      expect(y).toBeLessThan(0);
    });

    test("bypasses the cache when no cache key is given, fitting each collection", () => {
      const first = swissMapProjection(400, 400, collection(square("a")));
      const second = swissMapProjection(400, 400, collection(square("b", 50)));
      expect(second).not.toBe(first);
      // Each is fitted to its own collection, so both centres land inside the destination box -
      // where sharing a cached projection would have thrown the far collection right out of it.
      for (const [projection, centre] of [
        [first, [0.5, 0.5]],
        [second, [50.5, 50.5]],
      ] as const) {
        const [x, y] = projection(centre as [number, number]) as [number, number];
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(400);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(400);
      }
    });

    test("keeps the cache untouched for an unkeyed call", () => {
      const before = swissMapProjection.cache.size;
      swissMapProjection(444, 444, collection(square("a")));
      expect(swissMapProjection.cache.size).toBe(before);
    });

    test("caches each distinct projection in a publicly reachable cache", () => {
      const before = swissMapProjection.cache.size;
      swissMapProjection(321, 123, collection(square("a")), "growth");
      swissMapProjection(322, 123, collection(square("a")), "growth");
      expect(swissMapProjection.cache.size).toBe(before + 2);
      expect(swissMapProjection.cache.has("321,123,growth")).toBe(true);
    });

    test("does not grow past the memoize cache limit as a chart is resized", () => {
      swissMapProjection.cache.clear();
      // One distinct width per resize tick, as a drag across a few hundred pixels produces.
      for (let width = 200; width < 500; width++) {
        swissMapProjection(width, 400, collection(square("a")), "resize");
      }
      expect(swissMapProjection.cache.size).toBeLessThanOrEqual(MEMOIZE_CACHE_LIMIT);
      // The size the chart settled at is still cached, so the projection is not refitted.
      const settled = swissMapProjection(499, 400, collection(square("a")), "resize");
      expect(swissMapProjection(499, 400, collection(square("a")), "resize")).toBe(settled);
    });
  });

  describe("swissMapPath", () => {
    test("returns a path generator that renders a feature to an svg path string", () => {
      const path = swissMapPath(100, 100, collection(square("a")), "path-a");
      const d = path(square("a"));
      expect(d).toMatch(/^M/);
      expect(d).toContain("Z");
    });

    test("shares the memoized projection with swissMapProjection", () => {
      const projection = swissMapProjection(120, 90, collection(square("a")), "shared-projection");
      const path = swissMapPath(120, 90, collection(square("a")), "shared-projection");
      expect(path.projection()).toBe(projection);
    });

    test("returns a fresh path generator on each call", () => {
      const first = swissMapPath(120, 90, collection(square("a")), "fresh");
      const second = swissMapPath(120, 90, collection(square("a")), "fresh");
      expect(second).not.toBe(first);
    });
  });

  describe("pixelsFromGeoDistance", () => {
    const identity = (point: [number, number]): [number, number] => point;
    // Circumference used by the implementation, from its own approximate earth radius.
    const CIRCUMFERENCE = Math.PI * 2 * 6_367_475;

    test("converts a metre distance to the projected degree span", () => {
      const result = pixelsFromGeoDistance(identity, [0, 0], 100_000);
      expect(result).toBeCloseTo((100_000 / CIRCUMFERENCE) * 360, 10);
    });

    test("returns zero for a zero distance", () => {
      expect(pixelsFromGeoDistance(identity, [8.5, 47.4], 0)).toBe(0);
    });

    test("scales linearly with the metre distance under a linear projection", () => {
      const single = pixelsFromGeoDistance(identity, [8.5, 47.4], 1000);
      const double = pixelsFromGeoDistance(identity, [8.5, 47.4], 2000);
      expect(double).toBeCloseTo(single * 2, 10);
    });

    test("averages the x and y spans, so anisotropic projections are smoothed", () => {
      // Stretch x by 10 and leave y alone: the result is the mean of the two spans.
      const stretched = ([lon, lat]: [number, number]): [number, number] => [lon * 10, lat];
      const plain = pixelsFromGeoDistance(identity, [0, 0], 100_000);
      expect(pixelsFromGeoDistance(stretched, [0, 0], 100_000)).toBeCloseTo(plain * 5.5, 10);
    });

    // NOTE: a projection that clips a corner away returns null. The JavaScript indexed that null
    // and produced a bare "Cannot read properties of null"; this raises a descriptive TypeError
    // from the same point instead, which is the one deliberate error-message change in the port.
    test("throws a descriptive TypeError when the projection clips the measured square away", () => {
      const clipping: PointProjection = () => null;
      expect(() => pixelsFromGeoDistance(clipping, [0, 0], 100_000)).toThrow(
        new TypeError(
          "pixelsFromGeoDistance: the projection clipped away the bounds of the measured square"
        )
      );
    });

    // NOTE: only the far corner clips here, so the guard has to cover either bound, not just the
    // first one read.
    test("throws when only one of the two corners is clipped away", () => {
      const clipsUpper: PointProjection = ([lon, lat]) => (lon > 0 ? null : [lon, lat]);
      expect(() => pixelsFromGeoDistance(clipsUpper, [0, 0], 100_000)).toThrow(TypeError);
    });

    test("takes the absolute span, so a flipped axis still yields a positive size", () => {
      const flipped = ([lon, lat]: [number, number]): [number, number] => [lon, -lat];
      const plain = pixelsFromGeoDistance(identity, [0, 0], 100_000);
      expect(pixelsFromGeoDistance(flipped, [0, 0], 100_000)).toBeCloseTo(plain, 10);
    });

    test("is unaffected by the centre point under a linear projection", () => {
      const equator = pixelsFromGeoDistance(identity, [0, 0], 50_000);
      const pole = pixelsFromGeoDistance(identity, [0, 89], 50_000);
      expect(pole).toBeCloseTo(equator, 10);
    });

    test("varies with the centre point under a real map projection", () => {
      const projection = swissMapProjection(500, 500, collection(square("a")), "geo-distance");
      const equator = pixelsFromGeoDistance(projection, [0, 0], 50_000);
      const north = pixelsFromGeoDistance(projection, [0, 60], 50_000);
      // Mercator stretches distances towards the poles.
      expect(north).toBeGreaterThan(equator);
    });

    // NOTE: negative distances are not guarded, but the absolute spans make the result positive,
    // so a sign error in a caller silently produces a plausible-looking size.
    test("returns a positive size for a negative distance", () => {
      expect(pixelsFromGeoDistance(identity, [0, 0], -100_000)).toBeCloseTo(
        pixelsFromGeoDistance(identity, [0, 0], 100_000),
        10
      );
    });
  });

  describe("prepareMergedGeoData", () => {
    const geoJson = collection(square("a"), square("b"), square("c"));

    test("defaults the key name to geoId", () => {
      expect(GEO_KEY_DEFAULT).toBe("geoId");
      const merged = prepareMergedGeoData([{ geoId: "b", value: 7 }], geoJson);
      expect(merged.map((d) => d.datum?.value)).toEqual([undefined, 7, undefined]);
    });

    test("returns one entry per feature, pairing the feature with its datum", () => {
      const merged = prepareMergedGeoData(
        [
          { id: "a", value: 1 },
          { id: "c", value: 3 },
        ],
        geoJson,
        "id"
      );
      expect(merged).toHaveLength(3);
      expect(merged[0].geoJson).toBe(geoJson.features[0]);
      expect(merged[0].datum).toEqual({ id: "a", value: 1 });
      expect(merged[2].datum).toEqual({ id: "c", value: 3 });
    });

    test("leaves datum undefined for features with no matching data", () => {
      const merged = prepareMergedGeoData([{ id: "a", value: 1 }], geoJson, "id");
      expect(merged[1].datum).toBeUndefined();
      expect(merged[2].datum).toBeUndefined();
    });

    test("preserves the feature order of the geojson, not the order of the data", () => {
      const merged = prepareMergedGeoData(
        [
          { id: "c", value: 3 },
          { id: "a", value: 1 },
        ],
        geoJson,
        "id"
      );
      expect(merged.map((d) => d.geoJson.id)).toEqual(["a", "b", "c"]);
    });

    // NOTE: grouping is a plain reduce into an object, so the last datum for a key wins silently.
    test("keeps the last datum when several data share a key", () => {
      const merged = prepareMergedGeoData(
        [
          { id: "a", value: 1 },
          { id: "a", value: 2 },
        ],
        geoJson,
        "id"
      );
      expect(merged[0].datum).toEqual({ id: "a", value: 2 });
    });

    test("ignores data whose key matches no feature", () => {
      const merged = prepareMergedGeoData([{ id: "nope", value: 1 }], geoJson, "id");
      expect(merged.every((d) => d.datum === undefined)).toBe(true);
    });

    // NOTE: grouping goes through a property access, so a symbol data key stays a symbol property.
    // A GeoJSON id is only ever a string or a number, so such a datum can never be matched - in
    // particular not by a feature id that spells out the symbol's description.
    test("never matches a datum keyed by a symbol", () => {
      const marker = Symbol("a");
      const merged = prepareMergedGeoData(
        [{ id: marker, value: 1 }],
        collection(square("a"), square("Symbol(a)")),
        "id"
      );
      expect(merged.every((d) => d.datum === undefined)).toBe(true);
    });

    // NOTE: two symbols with the same description are distinct property keys, so neither can stand
    // in for the other.
    test("keeps two symbols with the same description distinct", () => {
      const merged = prepareMergedGeoData([{ id: Symbol("a"), value: 1 }], geoJson, "id");
      expect(merged.every((d) => d.datum === undefined)).toBe(true);
    });

    // NOTE: a non-array dataset is quietly treated as empty rather than raising.
    test("treats a non-array dataset as no data at all", () => {
      const merged = prepareMergedGeoData(undefined, geoJson, "id");
      expect(merged).toHaveLength(3);
      expect(merged.every((d) => d.datum === undefined)).toBe(true);
    });

    test("keys a datum named __proto__ like any other, leaving other features unmatched", () => {
      const merged = prepareMergedGeoData(
        [{ id: "__proto__", value: 1 }],
        collection(square("__proto__"), square("value")),
        "id"
      );
      expect(merged[0].datum).toEqual({ id: "__proto__", value: 1 });
      expect(merged[1].datum).toBeUndefined();
    });

    // NOTE: ids are matched through object property lookup, so keys are stringified - a numeric
    // data key matches a string feature id without any explicit coercion in the source.
    test("matches a numeric data key against a string feature id", () => {
      const merged = prepareMergedGeoData([{ id: 1, value: 1 }], collection(square("1")), "id");
      expect(merged[0].datum).toEqual({ id: 1, value: 1 });
    });

    // BUG: the dataset argument is carefully guarded with Array.isArray, but geoJson is not
    // guarded at all - the asymmetry means a missing map throws where missing data does not.
    test("throws for a missing geojson, unlike a missing dataset", () => {
      expect(() =>
        // @ts-expect-error - deliberately exercising the unguarded geoJson path
        prepareMergedGeoData([{ id: "a" }], undefined, "id")
      ).toThrow();
    });

    test("returns an empty array for a geojson with no features", () => {
      expect(prepareMergedGeoData([{ id: "a" }], collection(), "id")).toEqual([]);
    });

    test("leaves a feature named after a prototype member unmatched", () => {
      const merged = prepareMergedGeoData([{ id: "a" }], collection(square("constructor")), "id");
      expect(merged[0].datum).toBeUndefined();
      expect(
        prepareMergedGeoData([{ id: "a" }], collection(square("toString")), "id")[0].datum
      ).toBeUndefined();
    });

    test("never matches data whose key property is missing", () => {
      const keyless = collection(square("a"), square("b"));
      for (const feature of keyless.features) {
        feature.id = undefined;
      }
      const merged = prepareMergedGeoData([{ value: 1 }, { value: 2 }], keyless, "geoId");
      expect(merged).toHaveLength(2);
      expect(merged.every((d) => d.datum === undefined)).toBe(true);
    });

    test("never matches a feature with no id against a datum keyed 'undefined'", () => {
      const keyless = collection(square("a"));
      keyless.features[0].id = undefined;
      const merged = prepareMergedGeoData([{ id: "undefined", value: 1 }], keyless, "id");
      expect(merged[0].datum).toBeUndefined();
    });

    // NOTE: a falsy key name (including the empty string) falls back to the default rather than
    // being used as given.
    test("falls back to the default key name for an empty key name", () => {
      const merged = prepareMergedGeoData([{ geoId: "a", value: 1 }], geoJson, "");
      expect(merged[0].datum).toEqual({ geoId: "a", value: 1 });
    });
  });

  describe("getGeoJsonCenter", () => {
    test("computes the geographic centroid when no center property is set", () => {
      const feature = square("a");
      const [lon, lat] = getGeoJsonCenter(feature);
      // Spherical, not planar: the centroid of a lat/lon square is only approximately its middle.
      expect(lon).toBeCloseTo(0.5, 3);
      expect(lat).toBeCloseTo(0.5, 3);
    });

    test("parses a center property of the form 'lon,lat'", () => {
      const feature = square("a");
      feature.properties = { center: "8.54,47.37" };
      expect(getGeoJsonCenter(feature)).toEqual([8.54, 47.37]);
    });

    // NOTE: the result is cached onto the feature's own properties - this function mutates its
    // argument.
    test("caches the result on the feature's properties", () => {
      const feature = square("a");
      const center = getGeoJsonCenter(feature);
      expect(feature.properties?.cachedCenter).toBe(center);
      expect(getGeoJsonCenter(feature)).toBe(center);
    });

    // NOTE: the cache is never invalidated, which follows directly from the caching the JSDoc
    // advertises. Features are treated as immutable map data, so changing `center` after the first
    // read has no effect for the lifetime of the feature object.
    test("ignores a center property changed after the first call", () => {
      const feature = square("a");
      feature.properties = { center: "1,2" };
      expect(getGeoJsonCenter(feature)).toEqual([1, 2]);
      feature.properties.center = "3,4";
      expect(getGeoJsonCenter(feature)).toEqual([1, 2]);
    });

    test("warns and falls back to the centroid for an unparseable center property", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const feature = square("a");
      feature.properties = { center: "not,coordinates" };
      const [lon, lat] = getGeoJsonCenter(feature);
      expect(lon).toBeCloseTo(0.5, 3);
      expect(lat).toBeCloseTo(0.5, 3);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("warns and falls back for a center with too few or too many components", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      for (const center of ["8.54", "1,2,3"]) {
        const feature = square("a");
        feature.properties = { center };
        const [lon, lat] = getGeoJsonCenter(feature);
        expect(lon).toBeCloseTo(0.5, 3);
        expect(lat).toBeCloseTo(0.5, 3);
      }
      expect(warn).toHaveBeenCalledTimes(2);
      warn.mockRestore();
    });

    // parseFloat stops at the first character it cannot read, so a typo would have been accepted
    // as its numeric prefix and silently moved the anchor.
    test("warns and falls back for a center whose components have trailing junk", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const feature = square("a");
      feature.properties = { center: "8.54oops,47.37oops" };
      const [lon, lat] = getGeoJsonCenter(feature);
      expect(lon).toBeCloseTo(0.5, 3);
      expect(lat).toBeCloseTo(0.5, 3);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    // An authored empty string is a malformed centre, not an absent property, so it is reported
    // rather than passed over in silence.
    test("warns and falls back for an empty or blank center property", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      for (const center of ["", " , "]) {
        const feature = square("a");
        feature.properties = { center };
        const [lon, lat] = getGeoJsonCenter(feature);
        expect(lon).toBeCloseTo(0.5, 3);
        expect(lat).toBeCloseTo(0.5, 3);
      }
      expect(warn).toHaveBeenCalledTimes(2);
      warn.mockRestore();
    });

    // The declared string type describes what an author should write; the properties of a loaded
    // map file are unchecked runtime data, and a non-string would otherwise throw from split().
    test("warns and falls back for a center that is not a string, null included", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      for (const center of [42, {}, true, null]) {
        const feature = square("a");
        feature.properties = {};
        // Written through the index signature: `center` is declared a string, and the point of the
        // test is the value an unchecked map file can actually carry.
        (feature.properties as Record<string, unknown>).center = center;
        const [lon, lat] = getGeoJsonCenter(feature);
        expect(lon).toBeCloseTo(0.5, 3);
        expect(lat).toBeCloseTo(0.5, 3);
      }
      expect(warn).toHaveBeenCalledTimes(4);
      warn.mockRestore();
    });

    test("names the offending feature in the warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const feature = square("kreis-7");
      feature.properties = { center: "nope" };
      getGeoJsonCenter(feature);
      expect(warn.mock.calls.flat().join(" ")).toContain("kreis-7");
      warn.mockRestore();
    });

    // BUG: `properties: null` is spec-legal GeoJSON, but the centre has nowhere to be cached, so a
    // valid feature crashes the render. The JavaScript dereferenced it unguarded and produced a
    // bare "Cannot read properties of null (reading 'cachedCenter')"; the port raises the same
    // class with a message that names the cause.
    test("throws a descriptive TypeError for a feature with null properties", () => {
      const feature = square("a");
      feature.properties = null;
      expect(() => getGeoJsonCenter(feature)).toThrow(
        new TypeError("getGeoJsonCenter: the feature has no properties object to cache onto")
      );
    });
  });

  describe("widthAdaptiveMapPathStroke", () => {
    test("scales the stroke with the container width", () => {
      expect(widthAdaptiveMapPathStroke(400)).toBe(1);
      expect(widthAdaptiveMapPathStroke(360)).toBeCloseTo(0.9, 10);
    });

    test("clamps to a minimum of 0.8 for narrow containers", () => {
      expect(widthAdaptiveMapPathStroke(0)).toBe(0.8);
      expect(widthAdaptiveMapPathStroke(100)).toBe(0.8);
    });

    test("clamps to a maximum of 1.1 for wide containers", () => {
      expect(widthAdaptiveMapPathStroke(1000)).toBe(1.1);
      expect(widthAdaptiveMapPathStroke(10_000)).toBe(1.1);
    });

    test("clamps a negative width to the minimum", () => {
      expect(widthAdaptiveMapPathStroke(-500)).toBe(0.8);
    });

    test("clamps a non-finite width to the minimum", () => {
      expect(widthAdaptiveMapPathStroke(Number.NaN)).toBe(0.8);
      expect(widthAdaptiveMapPathStroke(Number.POSITIVE_INFINITY)).toBe(0.8);
      expect(widthAdaptiveMapPathStroke(Number.NEGATIVE_INFINITY)).toBe(0.8);
    });
  });
});
