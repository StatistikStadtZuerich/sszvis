import { describe, expect, test } from "vitest";
import type { Component } from "../../src/d3-component.js";

/**
 * The parts of a component test that the shared join contract needs.
 *
 * Each field is supplied by the component's own test file, so the component stays typed where it
 * is used and nothing here has to know about its props. `renderInto` keeps the layer-key
 * discipline in the test file too: the same key must reach the same layer, which is what makes
 * the re-render case a re-render rather than a second chart.
 */
export type JoinHarness<T> = {
  /** A freshly configured component, wired to the shape of `data`. Called once per test. */
  make: () => Component;
  /**
   * Renders `data` into the layer named `key` with `component`, creating the layer on first use,
   * and returns the group the marks land in. Called twice with one key for the re-render case.
   */
  renderInto: (key: string, component: Component, data: T[]) => Element;
  /** At least two data, so "one mark per datum" and the shrink case both say something. */
  data: T[];
  /** The marks the component owns, within the rendered group. */
  marks: (node: Element) => Element[];
  /**
   * How many tooltip anchors the component emitted, for the components that emit one per mark.
   * A count rather than the nodes, because the files that own this contract read the anchors'
   * transforms rather than the elements. Omit for a component that emits none.
   */
  anchorCount?: (node: Element) => number;
};

/**
 * The d3 join contract every mark-rendering component shares: one mark per datum, nothing for no
 * data, an update that rewrites the existing marks instead of appending a second set, and marks
 * that go away when the data does.
 *
 * This was written out once per component before, at slightly different strengths - some files
 * checked the anchors alongside the marks and some did not, some covered the shrink case and some
 * did not. Extracting it means every component gets the strongest version rather than whichever
 * one its file happened to have.
 *
 * What this does NOT cover, and what stays in each component's file: geometry, accessors,
 * transitions, object constancy under an explicit key, and the component's own quirks. Object
 * constancy in particular is invisible here - these assertions count marks, and a join keyed by
 * the wrong thing still produces one mark per datum.
 */
export function describesTheMarkJoin<T>(harness: () => JoinHarness<T>): void {
  describe("the mark join", () => {
    test("should render one mark per datum", () => {
      const { make, renderInto, data, marks, anchorCount } = harness();
      const node = renderInto("join-one-per-datum", make(), data);
      expect(marks(node).length).toBe(data.length);
      if (anchorCount) expect(anchorCount(node)).toBe(data.length);
    });

    test("should render nothing for an empty data array", () => {
      const { make, renderInto, marks, anchorCount } = harness();
      const node = renderInto("join-empty", make(), []);
      expect(marks(node).length).toBe(0);
      if (anchorCount) expect(anchorCount(node)).toBe(0);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const { make, renderInto, data, marks, anchorCount } = harness();
      // One component instance across both renders, which is how a chart actually updates.
      const component = make();
      renderInto("join-rerender", component, data);
      const node = renderInto("join-rerender", component, data);
      expect(marks(node).length).toBe(data.length);
      if (anchorCount) expect(anchorCount(node)).toBe(data.length);
    });

    test("should remove the surplus marks when the data shrinks", () => {
      const { make, renderInto, data, marks, anchorCount } = harness();
      const component = make();
      renderInto("join-shrink", component, data);
      const node = renderInto("join-shrink", component, data.slice(0, 1));
      expect(marks(node).length).toBe(1);
      if (anchorCount) expect(anchorCount(node)).toBe(1);
    });
  });
}
