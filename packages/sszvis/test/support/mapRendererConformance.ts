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
