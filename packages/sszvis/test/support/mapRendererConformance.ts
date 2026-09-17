import { expect, test } from "vitest";

/**
 * Contracts the map renderers share, extracted only where the copies genuinely agreed.
 *
 * Each helper takes a thunk so the renderer is built and rendered inside the test, after the
 * test file's own beforeEach has put a container in the document. Each registers a single test
 * rather than a describe block, so it slots into whichever block of the calling file already
 * owns that subject.
 *
 * Deliberately NOT extracted: "relies on the stylesheet for fill and pointer-events". mesh and
 * highlight assert the same three things, but the lake overlay checks two different node kinds
 * and omits the inline-fill assertion because it does set a colour inline. A shared version
 * would either flatten that difference or grow a flag for it, and three copies is not enough
 * duplication to be worth either.
 */

/**
 * That the renderer paints synchronously and animates nothing.
 *
 * `subject` returns the one node whose transition state matters - the border path, the
 * highlight path, the <img>, the lake shape, the <canvas>.
 *
 * This reads d3's private `__transition`, which is the coupling the audit flagged. It stays
 * because the absence of a transition has no positive observable form: a value that is already
 * final on the render tick is exactly what a transition's first frame can look like, so
 * asserting the value proves nothing about whether something was scheduled. The positive
 * direction - that a transition carries the library's duration and easing - is asserted through
 * rendered attributes over time in the component suites, and through transition.test.ts for the
 * factories themselves. Five files probed this field before; now one does.
 */
export function describesNoScheduledTransition(subject: () => Element): void {
  test("should schedule no transition at all", () => {
    // SAFETY: `__transition` is d3's own private bookkeeping, absent from lib.dom's Element.
    // Widening the type only lets us read it; the assertion below is what checks it is unset.
    const node = subject() as Element & { __transition?: unknown };
    expect(node.__transition).toBeUndefined();
  });
}

/**
 * That the renderer draws only its own geometry: no tooltip anchors, no event targets, and no
 * missing-value pattern in the document's defs.
 *
 * `subject` returns the group the renderer rendered into; the pattern is looked for on the
 * owning <svg>, since defs live outside the group.
 */
export function describesNoDecorations(subject: () => Element): void {
  test("should add no tooltip anchors, event targets or missing-value pattern", () => {
    const node = subject();
    // SAFETY: every caller renders into a group inside an <svg>, so the document holds one by
    // the time this runs; the two assertions below would fail loudly on null rather than pass.
    const root = node.ownerDocument.querySelector("svg") as SVGSVGElement;
    expect(node.querySelectorAll("[data-tooltip-anchor]")).toHaveLength(0);
    expect(node.querySelectorAll("[data-event-target]")).toHaveLength(0);
    expect(root.querySelectorAll("#missing-pattern")).toHaveLength(0);
  });
}

/**
 * That the path data comes from the mapPath generator rather than being built by the renderer.
 *
 * `subject` returns the rendered marks together with the `d` each one should carry, computed by
 * the caller from the same generator instance it rendered with. The expectation is supplied
 * rather than derived here because the files disagree, correctly, about how much to pin: geojson
 * and base check every feature, mesh checks its single combined border, and highlight checks the
 * one feature its highlight matched. Passing the array through keeps each of those intact.
 */
export function describesMapPathGeometry(
  subject: () => { marks: Element[]; expected: (string | null)[] },
): void {
  test("should take the path data from the mapPath generator", () => {
    const { marks, expected } = subject();
    expect(marks.map((mark) => mark.getAttribute("d"))).toEqual(expected);
  });
}

/**
 * That a renderer's `key` decides which elements a second `.call()` on the same group takes over.
 *
 * mesh, the lake overlay, highlight and raster all implement the same `:scope > ...` selector plus
 * `data-<name>-key` filter. Only the element identity is shared here, through two adapters: a
 * `render` that draws one instance into a fresh group, with `key` left off to mean "the default
 * key" and `variant` a colour the caller can tell apart afterwards, and a `marks` that returns the
 * elements whose identity the key governs together with a `variantOf` reading back which render
 * produced one.
 *
 * What the renderers do *not* share stays in their own files, because folding it in would have
 * meant asserting less than each file asserts today: the lake overlay also owns a pattern,
 * gradient and mask per scope (issue #258), raster proves isolation by reading back painted
 * pixels rather than a style, and highlight's same-key case is written around issue #216.
 */
export function describesKeyScopedElements<Variant, Drawn>(options: {
  /** Draws one instance into a group, returning the group's node. */
  render: (run: { group: string; key?: string; variant: Variant }) => Element;
  /** The elements whose identity the key governs, in document order. */
  marks: (node: Element) => Element[];
  /**
   * Reads back which render drew a mark, so two instances can be told apart. Its type is the
   * caller's: mesh reads a stroke colour back as a string, the lake overlay a fill.
   */
  variantOf: (mark: Element) => Drawn;
  /** Two distinguishable values for whichever property `render` applies. */
  variants: [Variant, Variant];
}): void {
  const { render, marks, variantOf, variants } = options;
  const [one, other] = variants;

  test("should draw a separate element per key when two instances render into one group", () => {
    const group = "key-scoping-distinct";
    const first = marks(render({ group, key: "one", variant: one }))[0];
    const after = marks(render({ group, key: "two", variant: other }));
    expect(after).toHaveLength(2);
    expect(after[0]).toBe(first);
    expect(variantOf(after[0])).not.toEqual(variantOf(after[1]));
  });

  test("should repaint only its own key's element when one of two keys re-renders", () => {
    const group = "key-scoping-rerender";
    render({ group, key: "one", variant: one });
    const before = marks(render({ group, key: "two", variant: other }));
    const after = marks(render({ group, key: "one", variant: other }));
    // The same two elements, still in place: a re-render reuses its key's element rather than
    // appending a third or rebinding the other key's.
    expect(after).toEqual(before);
    expect(variantOf(after[0])).toEqual(variantOf(after[1]));
  });

  test("should reuse the one element when two instances fall back to the default key", () => {
    const group = "key-scoping-default";
    const first = marks(render({ group, variant: one }))[0];
    const drawnVariant = variantOf(first);
    const after = marks(render({ group, variant: other }));
    expect(after).toHaveLength(1);
    expect(after[0]).toBe(first);
    // The second instance took the first one's element over, so the later value is what shows.
    expect(variantOf(after[0])).not.toEqual(drawnVariant);
  });
}
