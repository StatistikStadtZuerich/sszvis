import { expect, test } from "vitest";
import type { Component } from "../../src/d3-component.js";
import { type JoinHarness, describesTheMarkJoin } from "./componentConformance.js";

/**
 * What an annotation promises on top of the generic mark join.
 *
 * Both extra slots are optional because the family does not agree on them: five annotations fill
 * their marks from the shared data-area pattern and three draw captions, while rangeFlag,
 * tooltipAnchor and confidenceBar draw neither. An annotation that omits a slot registers no test
 * for it rather than getting a vacuously passing one.
 *
 * Everything here is supplied by the calling file - the component, the selectors, the expected
 * values - so a regression in one annotation fails only that annotation's copy of these tests.
 * Nothing is computed from the component under test, so there is no value a broken component
 * could move on both sides of an assertion at once.
 *
 * `Placement` is the shape a file chooses to read a caption's position back as: circle and
 * rectangle read `x`/`y` attributes, line reads the translate and rotate out of a transform. It
 * is a type parameter rather than a fixed record so neither file has to flatten its own reading
 * into the other's.
 */
export type AnnotationHarness<T, Placement> = JoinHarness<T> & {
  /**
   * Set when the annotation fills its marks from the shared data-area pattern, which is written
   * into the rendered group's own defs. The fill and the pattern are asserted together: a fill
   * pointing at a pattern that was never declared resolves to nothing at all.
   */
  patternFill?: {
    /** The marks whose `fill` should reference the pattern, within the rendered group. */
    marks: (node: Element) => Element[];
    /** The id the fill references and the defs entry should carry, without the `#`. */
    patternId: string;
  };
  /** Set when the annotation draws captions; omitted by the annotations that draw none. */
  captions?: {
    /** The component configured with a caption accessor and no offsets. */
    withCaptions: () => Component;
    /** The same component with per-datum `dx` and `dy` accessors set as well. */
    withOffsets: () => Component;
    /** The component with no caption accessor at all, for the negative case. */
    withoutCaptions: () => Component;
    /** The data all three are configured for, which need not be the join's data. */
    data: T[];
    /** The caption nodes inside the rendered group, in document order. */
    marks: (node: Element) => Element[];
    /** Reads one caption's placement back, in whatever shape this file asserts on. */
    placementOf: (mark: Element) => Placement;
    /**
     * The placement expected for each caption `data` produces, in order. Its length is the
     * expected caption count, which is not always one per datum: annotation/line binds its
     * caption to `[0]`, so three lines still share a single caption.
     */
    expectedPlacements: Placement[];
    /** The `dx` and `dy` each caption should carry under `withOffsets`, in the same order. */
    expectedOffsets: [number, number][];
  };
};

/**
 * The join contract plus the two promises the annotation family adds to it.
 *
 * This exists because the annotations were the least uniformly covered family in the suite: six
 * of them - circle, rectangle, line, rangeFlag, confidenceBar and tooltipAnchor - had no
 * re-render test at all, so a component that appended a second set of marks on every update
 * would have gone unnoticed; every file built a fresh layer per test, which hides exactly that.
 * The pattern-fill assertion was three verbatim copies and the caption triple another three.
 *
 * What stays in each file: geometry, scales, accessors-versus-scalars, keys and transitions.
 */
export function describesTheAnnotation<T, Placement>(
  harness: () => AnnotationHarness<T, Placement>,
): void {
  describesTheMarkJoin(harness);

  const { patternFill, captions } = harness();

  if (patternFill) {
    test("should fill its marks from a data-area pattern it declares in the layer defs", () => {
      const { make, renderInto, full, patternFill: fill } = harness();
      // SAFETY: guarded by the `patternFill` read above, which came off the same harness; the
      // thunk rebuilds the fixtures but not the shape of the spec.
      const spec = fill as NonNullable<typeof fill>;
      const node = renderInto("annotation-pattern", make(), full.data);
      const marks = spec.marks(node);
      expect(marks.length).toBeGreaterThan(0);
      expect(marks.map((mark) => mark.getAttribute("fill"))).toEqual(
        marks.map(() => `url(#${spec.patternId})`),
      );
      expect(node.querySelector(`defs pattern#${spec.patternId}`)).not.toBeNull();
    });
  }

  if (captions) {
    test("should place every caption where its mark reports when a caption accessor is set", () => {
      const { renderInto, captions: spec } = harness();
      // SAFETY: guarded by the `captions` read above, on the same harness shape.
      const { withCaptions, data, marks, placementOf, expectedPlacements } = spec as NonNullable<
        typeof spec
      >;
      const node = renderInto("annotation-captions", withCaptions(), data);
      expect(marks(node).map(placementOf)).toEqual(expectedPlacements);
    });

    test("should draw no captions at all when no caption accessor is set", () => {
      const { renderInto, captions: spec } = harness();
      // SAFETY: guarded by the `captions` read above, on the same harness shape.
      const { withoutCaptions, data, marks } = spec as NonNullable<typeof spec>;
      const node = renderInto("annotation-nocaptions", withoutCaptions(), data);
      expect(marks(node)).toHaveLength(0);
    });

    test("should shift every caption by its own dx and dy when offset accessors are set", () => {
      const { renderInto, captions: spec } = harness();
      // SAFETY: guarded by the `captions` read above, on the same harness shape.
      const { withOffsets, data, marks, expectedOffsets } = spec as NonNullable<typeof spec>;
      const node = renderInto("annotation-offsets", withOffsets(), data);
      expect(
        marks(node).map((mark) => [
          Number(mark.getAttribute("dx")),
          Number(mark.getAttribute("dy")),
        ]),
      ).toEqual(expectedOffsets);
    });
  }
}
