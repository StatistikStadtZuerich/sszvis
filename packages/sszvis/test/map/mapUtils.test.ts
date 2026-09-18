import type { Feature, FeatureCollection, Polygon } from "geojson";
import { describe, expect, test, vi } from "vitest";
import { square } from "../support/mapReaders.js";
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

const collection = (...features: Feature<Polygon>[]): FeatureCollection<Polygon> => ({
  type: "FeatureCollection",
  features,
});

describe("map utils", () => {
  describe("map id constants", () => {
    test("should name the six built-in Zurich and Switzerland map ids", () => {
      expect(STADT_KREISE_KEY).toBe("zurichStadtKreise");
      expect(STATISTISCHE_QUARTIERE_KEY).toBe("zurichStatistischeQuartiere");
      expect(STATISTISCHE_ZONEN_KEY).toBe("zurichStatistischeZonen");
      expect(WAHL_KREISE_KEY).toBe("zurichWahlKreise");
      expect(AGGLOMERATION_2012_KEY).toBe("zurichAgglomeration2012");
      expect(SWITZERLAND_KEY).toBe("switzerland");
    });
  });

  describe("swissMapProjection", () => {
    test("should fit the collection into the destination box when a width and height are given", () => {
      const projection = swissMapProjection(100, 100, collection(square("a")), "fit-a");
      const [x, y] = projection([0.5, 0.5]) as [number, number];
      // The centre of the fitted feature lands in the centre of the destination box (Mercator's
      // latitude stretch puts it a fraction of a pixel off vertically).
      expect(x).toBeCloseTo(50, 3);
      expect(y).toBeCloseTo(50, 2);
    });

    test("should return the identical projection when the width, height and cache key all repeat", () => {
      const first = swissMapProjection(200, 150, collection(square("a")), "cache-hit");
      const second = swissMapProjection(200, 150, collection(square("a")), "cache-hit");
      expect(second).toBe(first);
    });

    test("should recompute the projection when any of the width, height or cache key differs", () => {
      const base = swissMapProjection(200, 150, collection(square("a")), "dims");
      expect(swissMapProjection(200, 150, collection(square("a")), "other-key")).not.toBe(base);
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

    test("should fit each collection separately and leave the cache untouched when no cache key is given", () => {
      const before = swissMapProjection.cache.size;
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
      // nothing keyless is remembered, so an unkeyed call cannot grow the cache
      expect(swissMapProjection.cache.size).toBe(before);
    });

    test("should add one publicly reachable cache entry per distinct size when a cache key is given", () => {
      const before = swissMapProjection.cache.size;
      swissMapProjection(321, 123, collection(square("a")), "growth");
      swissMapProjection(322, 123, collection(square("a")), "growth");
      expect(swissMapProjection.cache.size).toBe(before + 2);
      expect(swissMapProjection.cache.has("321,123,growth")).toBe(true);
    });

    test("should keep the cache within the memoize limit when a chart is resized across many widths", () => {
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
    test("should render a feature to an svg path string", () => {
      const path = swissMapPath(100, 100, collection(square("a")), "path-a");
      const d = path(square("a"));
      expect(d).toMatch(/^M/);
      expect(d).toContain("Z");
    });

    test("should reuse the memoized projection when swissMapProjection was called with the same key and size", () => {
      const projection = swissMapProjection(120, 90, collection(square("a")), "shared-projection");
      const path = swissMapPath(120, 90, collection(square("a")), "shared-projection");
      expect(path.projection()).toBe(projection);
    });

    test("should return a fresh path generator on every call, even for a repeated cache key", () => {
      const first = swissMapPath(120, 90, collection(square("a")), "fresh");
      const second = swissMapPath(120, 90, collection(square("a")), "fresh");
      expect(second).not.toBe(first);
    });
  });

  describe("pixelsFromGeoDistance", () => {
    const identity = (point: [number, number]): [number, number] => point;

    test("should convert metres to a proportional degree span under a linear projection", () => {
      // 100 km is about 0.8998 degrees of a roughly 40,008 km circumference - derived from the
      // earth's size rather than from the implementation's own radius constant.
      expect(pixelsFromGeoDistance(identity, [0, 0], 100_000)).toBeCloseTo(0.8998, 4);
      expect(pixelsFromGeoDistance(identity, [8.5, 47.4], 0)).toBe(0);
      const single = pixelsFromGeoDistance(identity, [8.5, 47.4], 1000);
      expect(pixelsFromGeoDistance(identity, [8.5, 47.4], 2000)).toBeCloseTo(single * 2, 10);
    });

    test("should return the mean of the two spans when the projection stretches one axis", () => {
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
          "pixelsFromGeoDistance: the projection clipped away the bounds of the measured square",
        ),
      );
    });

    // NOTE: only the far corner clips here, so the guard has to cover either bound, not just the
    // first one read.
    test("throws when only one of the two corners is clipped away", () => {
      const clipsUpper: PointProjection = ([lon, lat]) => (lon > 0 ? null : [lon, lat]);
      expect(() => pixelsFromGeoDistance(clipsUpper, [0, 0], 100_000)).toThrow(TypeError);
    });

    test("should still return a positive size when the projection flips an axis", () => {
      const flipped = ([lon, lat]: [number, number]): [number, number] => [lon, -lat];
      const plain = pixelsFromGeoDistance(identity, [0, 0], 100_000);
      expect(pixelsFromGeoDistance(flipped, [0, 0], 100_000)).toBeCloseTo(plain, 10);
    });

    test("should measure a larger size further north when a real map projection is used", () => {
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
        10,
      );
    });
  });

  describe("prepareMergedGeoData", () => {
    const geoJson = collection(square("a"), square("b"), square("c"));

    test("should match on geoId when no key name is given", () => {
      expect(GEO_KEY_DEFAULT).toBe("geoId");
      const merged = prepareMergedGeoData([{ geoId: "b", value: 7 }], geoJson);
      expect(merged.map((d) => d.datum?.value)).toEqual([undefined, 7, undefined]);
    });

    test("should return one entry per feature, pairing each feature with the datum that matched it", () => {
      const merged = prepareMergedGeoData(
        [
          { id: "a", value: 1 },
          { id: "c", value: 3 },
        ],
        geoJson,
        "id",
      );
      expect(merged).toHaveLength(3);
      expect(merged[0].geoJson).toBe(geoJson.features[0]);
      expect(merged[0].datum).toEqual({ id: "a", value: 1 });
      expect(merged[2].datum).toEqual({ id: "c", value: 3 });
    });

    test("should leave the datum undefined when a feature and a datum do not find each other", () => {
      const matched = prepareMergedGeoData([{ id: "a", value: 1 }], geoJson, "id");
      expect(matched[1].datum).toBeUndefined();
      expect(matched[2].datum).toBeUndefined();
      // the other direction: a datum whose key names no feature is simply dropped
      const unmatched = prepareMergedGeoData([{ id: "nope", value: 1 }], geoJson, "id");
      expect(unmatched.every((d) => d.datum === undefined)).toBe(true);
    });

    test("should follow the feature order of the geojson when the data is given in another order", () => {
      const merged = prepareMergedGeoData(
        [
          { id: "c", value: 3 },
          { id: "a", value: 1 },
        ],
        geoJson,
        "id",
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
        "id",
      );
      expect(merged[0].datum).toEqual({ id: "a", value: 2 });
    });

    // NOTE: grouping goes through a property access, so a symbol data key stays a symbol property.
    // A GeoJSON id is only ever a string or a number, so such a datum can never be matched - in
    // particular not by a feature id that spells out the symbol's description.
    test("never matches a datum keyed by a symbol", () => {
      const marker = Symbol("a");
      const merged = prepareMergedGeoData(
        [{ id: marker, value: 1 }],
        collection(square("a"), square("Symbol(a)")),
        "id",
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

    test("should match a datum keyed __proto__ to the feature of that id and no other", () => {
      const merged = prepareMergedGeoData(
        [{ id: "__proto__", value: 1 }],
        collection(square("__proto__"), square("value")),
        "id",
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

    test("should report the missing property by name for a missing geojson", () => {
      for (const missing of [undefined, null]) {
        expect(() =>
          // @ts-expect-error - deliberately exercising the missing geoJson path
          prepareMergedGeoData([{ id: "a" }], missing, "id"),
        ).toThrow(/geoJson/);
      }
    });

    test("should still tolerate a missing dataset", () => {
      // SAFETY: the two arguments deliberately fail in opposite directions - no data is a state
      // a chart passes through before its load, so it yields a feature per entry with an
      // undefined datum rather than an error.
      const merged = prepareMergedGeoData(undefined, collection(square("a")), "id");
      expect(merged).toHaveLength(1);
      expect(merged[0].datum).toBeUndefined();
    });

    test("should return an empty array when the geojson has no features", () => {
      expect(prepareMergedGeoData([{ id: "a" }], collection(), "id")).toEqual([]);
    });

    test("should leave a feature named after a prototype member unmatched", () => {
      const merged = prepareMergedGeoData([{ id: "a" }], collection(square("constructor")), "id");
      expect(merged[0].datum).toBeUndefined();
      expect(
        prepareMergedGeoData([{ id: "a" }], collection(square("toString")), "id")[0].datum,
      ).toBeUndefined();
    });

    test("should never match a datum and a feature when either side has no id at all", () => {
      const keyless = collection(square("a"), square("b"));
      for (const feature of keyless.features) {
        feature.id = undefined;
      }
      const noDataKey = prepareMergedGeoData([{ value: 1 }, { value: 2 }], keyless, "geoId");
      expect(noDataKey).toHaveLength(2);
      expect(noDataKey.every((d) => d.datum === undefined)).toBe(true);
      // nor does spelling out "undefined" on the data side reach an id-less feature
      const spelledOut = prepareMergedGeoData([{ id: "undefined", value: 1 }], keyless, "id");
      expect(spelledOut[0].datum).toBeUndefined();
    });

    // NOTE: a falsy key name (including the empty string) falls back to the default rather than
    // being used as given.
    test("falls back to the default key name for an empty key name", () => {
      const merged = prepareMergedGeoData([{ geoId: "a", value: 1 }], geoJson, "");
      expect(merged[0].datum).toEqual({ geoId: "a", value: 1 });
    });
  });

  describe("getGeoJsonCenter", () => {
    test("should return the geographic centroid when no center property is set", () => {
      const feature = square("a");
      const [lon, lat] = getGeoJsonCenter(feature);
      // Spherical, not planar: the centroid of a lat/lon square is only approximately its middle.
      expect(lon).toBeCloseTo(0.5, 3);
      expect(lat).toBeCloseTo(0.5, 3);
    });

    test("should return the authored coordinates when a center property of the form 'lon,lat' is set", () => {
      const feature = square("a");
      feature.properties = { center: "8.54,47.37" };
      expect(getGeoJsonCenter(feature)).toEqual([8.54, 47.37]);
    });

    test("should write nothing back onto the feature it was given", () => {
      const feature = square("a");
      feature.properties = { center: "1,2" };
      getGeoJsonCenter(feature);
      // The library keeps no bookkeeping of its own on the caller's objects.
      expect(Object.keys(feature.properties)).toEqual(["center"]);
    });

    test("should follow the feature when its center property or its geometry changes after the first call", () => {
      const authored = square("a");
      authored.properties = { center: "1,2" };
      expect(getGeoJsonCenter(authored)).toEqual([1, 2]);
      authored.properties.center = "3,4";
      expect(getGeoJsonCenter(authored)).toEqual([3, 4]);

      const computed = square("a");
      expect(getGeoJsonCenter(computed)[0]).toBeCloseTo(0.5, 3);
      computed.geometry = square("a", 50).geometry;
      expect(getGeoJsonCenter(computed)[0]).toBeCloseTo(50.5, 3);
    });

    test.each([
      ["unparseable", "not,coordinates"],
      ["too few components", "8.54"],
      ["too many components", "1,2,3"],
      // parseFloat stops at the first character it cannot read, so a typo would otherwise have
      // been accepted as its numeric prefix and silently moved the anchor.
      ["trailing junk on each component", "8.54oops,47.37oops"],
      // An authored empty string is a malformed centre, not an absent property, so it is reported
      // rather than passed over in silence.
      ["empty", ""],
      ["blank", " , "],
      // The declared string type describes what an author should write; the properties of a loaded
      // map file are unchecked runtime data, and a non-string would otherwise throw from split().
      ["a number", 42],
      ["an object", {}],
      ["a boolean", true],
      ["null", null],
    ])(
      "should warn and fall back to the centroid when the center property is %s",
      (_description, center) => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const feature = square("a");
        feature.properties = {};
        // Written through the index signature: `center` is declared a string, and the point of the
        // table is the value an unchecked map file can actually carry.
        (feature.properties as Record<string, unknown>).center = center;
        const [lon, lat] = getGeoJsonCenter(feature);
        expect(lon).toBeCloseTo(0.5, 3);
        expect(lat).toBeCloseTo(0.5, 3);
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
      },
    );

    test("should name the offending feature in the warning when its center property is unusable", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const feature = square("kreis-7");
      feature.properties = { center: "nope" };
      getGeoJsonCenter(feature);
      expect(warn.mock.calls.flat().join(" ")).toContain("kreis-7");
      warn.mockRestore();
    });

    // `properties: null` is spec-legal GeoJSON. It used to throw, because the centre had nowhere
    // to be cached; with nothing being cached there is nothing to store and it simply works.
    test("should return the centroid when the feature's properties are null", () => {
      const feature = square("a");
      feature.properties = null;
      const [lon, lat] = getGeoJsonCenter(feature);
      expect(lon).toBeCloseTo(0.5, 3);
      expect(lat).toBeCloseTo(0.5, 3);
    });
  });

  describe("widthAdaptiveMapPathStroke", () => {
    test("should scale the stroke with the container width when that width is inside the clamped range", () => {
      expect(widthAdaptiveMapPathStroke(400)).toBe(1);
      expect(widthAdaptiveMapPathStroke(360)).toBeCloseTo(0.9, 10);
    });

    test.each([
      ["a narrow container", 100, 0.8],
      ["a zero width", 0, 0.8],
      ["a negative width", -500, 0.8],
      // Both infinities fall to the minimum, not to opposite ends of the range.
      ["NaN", Number.NaN, 0.8],
      ["positive infinity", Number.POSITIVE_INFINITY, 0.8],
      ["negative infinity", Number.NEGATIVE_INFINITY, 0.8],
      ["a wide container", 1000, 1.1],
      ["an absurdly wide container", 10_000, 1.1],
    ])(
      "should clamp the stroke into the [0.8, 1.1] range when the width is %s",
      (_description, width, expected) => {
        expect(widthAdaptiveMapPathStroke(width)).toBe(expected);
      },
    );
  });
});
