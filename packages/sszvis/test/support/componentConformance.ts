import { describe, expect, test } from "vitest";
import type { Component } from "../../src/d3-component.js";

/** A data set and the marks it is expected to produce, counted by kind. */
export type JoinCase<T> = {
  data: T[];
  /**
   * How many of each kind of mark, keyed by a name of the test file's choosing. Nested components
   * own more than one kind - stackedBar draws a group per stack and a rect per slice - and
   * asserting the whole record at once means a failure names every kind, not just the first.
   */
  marks: Record<string, number>;
};

/**
 * The parts of a component test that the shared join contract needs.
 *
 * Each field is supplied by the component's own test file, so the component stays typed where it
 * is used and nothing here has to know about its props. `renderInto` keeps the layer-key
 * discipline in the test file too: the same key must reach the same layer, which is what makes
 * the re-render case a re-render rather than a second chart.
 */
export type JoinHarness<T> = {
  /** A freshly configured component, wired to the shape of the case data. Called once per test. */
  make: () => Component;
  /**
   * Renders `data` into the layer named `key` with `component`, creating the layer on first use,
   * and returns the group the marks land in. Called twice with one key for the re-render case.
   */
  renderInto: (key: string, component: Component, data: T[]) => Element;
  /** Counts each kind of mark the component owns, within the rendered group. */
  count: (node: Element) => Record<string, number>;
  /** The data a chart normally carries, and the marks it should produce. */
  full: JoinCase<T>;
  /**
   * A strictly smaller data set and its marks, for the exit path.
   *
   * Optional: omit it when the component's exit paths are distinct enough to deserve tests of
   * their own. stackedBar is the case in point - losing a series and losing a stack empty
   * different halves of its nested join, so it keeps both of its own shrink tests instead.
   */
  smaller?: JoinCase<T>;
};

/**
 * The d3 join contract every mark-rendering component shares: the right marks for its data,
 * nothing for no data, an update that rewrites the existing marks instead of appending a second
 * set, and marks that go away when the data does.
 *
 * This was written out once per component before, at slightly different strengths - some files
 * checked the tooltip anchors alongside the marks and some did not, some covered the exit path
 * and some did not. Extracting it means every component gets the strongest version rather than
 * whichever one its file happened to have.
 *
 * What this does NOT cover, and what stays in each component's file: geometry, accessors,
 * transitions, object constancy under an explicit key, and the component's own quirks. Object
 * constancy in particular is invisible here - these assertions count marks, and a join keyed by
 * the wrong thing still produces the right number of them, just not the same ones.
 */
export function describesTheMarkJoin<T>(harness: () => JoinHarness<T>): void {
  describe("the mark join", () => {
    test("should render the marks its data calls for", () => {
      const { make, renderInto, count, full } = harness();
      const node = renderInto("join-full", make(), full.data);
      expect(count(node)).toEqual(full.marks);
    });

    test("should render nothing for an empty data array", () => {
      const { make, renderInto, count, full } = harness();
      const node = renderInto("join-empty", make(), []);
      const empty = Object.fromEntries(Object.keys(full.marks).map((kind) => [kind, 0]));
      expect(count(node)).toEqual(empty);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const { make, renderInto, count, full } = harness();
      // One component instance across both renders, which is how a chart actually updates.
      const component = make();
      renderInto("join-rerender", component, full.data);
      const node = renderInto("join-rerender", component, full.data);
      expect(count(node)).toEqual(full.marks);
    });

    // Registered only when the harness offers a shrink case, so a component that keeps its own
    // exit tests does not also get a silently-passing one here. Reading the harness at
    // registration is safe because it only assembles fixtures - nothing touches the DOM until a
    // test calls renderInto.
    if (harness().smaller) {
      test("should remove the surplus marks when the data shrinks", () => {
        const { make, renderInto, count, full, smaller } = harness();
        const component = make();
        renderInto("join-shrink", component, full.data);
        const node = renderInto("join-shrink", component, smaller?.data ?? []);
        expect(count(node)).toEqual(smaller?.marks);
      });
    }
  });
}
