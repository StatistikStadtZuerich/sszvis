/**
 * Stacked area bounds
 *
 * @module sszvis/component/stackedAreaBounds
 *
 * The missing-value predicate shared by stackedArea and stackedAreaMultiples, which draw the
 * same shape from the same [y0, y1] bounds and so answer this question the same way. It lived
 * in both files as a byte-identical copy, with a comment in each pointing at the other; every
 * change to it has had to be made twice.
 */

/**
 * Whether a bound counts as missing, and so breaks the shape at that point.
 *
 * A value is missing when it is null-ish or when it has no finite numeric form.
 *
 * The null-ish half goes beyond the isNaN guard this default was always meant to be -
 * isNaN(null) is false, so a null would coerce to 0 and be plotted at the top of the chart -
 * and beyond src/component/line.ts, whose guard is documented as letting null through. A null
 * measurement is missing data, not a zero, and there is no way to say "plot this at zero" with
 * null that saying 0 does not say better.
 *
 * Finiteness rather than NaN-ness, because Infinity is a number as far as isNaN is concerned
 * but not a coordinate SVG can parse: it reached the `d` attribute, where the browser drops
 * that segment and every one after it, so the shape was truncated at the bad bound rather than
 * broken across it. A scale over a zero-width domain returns exactly that.
 */
export const isMissingBound = (value: unknown): boolean =>
  value == null || !Number.isFinite(Number(value));
