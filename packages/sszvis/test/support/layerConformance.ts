import { select, type Selection } from "d3";
import { expect, test } from "vitest";

/**
 * Contracts shared by the two ways sszvis puts a keyed child into a container: the d3 selection
 * plugins (`selectDiv`, `selectGroup`) and the two layer factories (`createSvgLayer`,
 * `createHtmlLayer`). In each pair the copies agreed line for line, differing only in the tag, the
 * marker attribute and the container element.
 *
 * Each helper registers individual tests, not a describe block, so it slots into whichever block
 * of the calling file already owns that subject. Each takes adapters that call the module under
 * test, so the suite is *parameterised, not merged*: every caller registers its own copy of every
 * test, and those copies only ever touch the one module their adapters close over. A regression in
 * `src/d3-selectdiv.ts` fails the copies registered from d3-selectdiv.test.ts and leaves
 * d3-selectgroup.test.ts green - which is exactly what two hand-written suites gave us.
 *
 * Deliberately NOT extracted: the behaviours that are genuinely one module's own. `selectDiv`
 * positions its div absolutely and `selectGroup` must return a selection marks can be appended
 * into; `createSvgLayer` owns sizing, the aria naming and the padding transform, and
 * `createHtmlLayer` owns positioning over the svg's padding box. Those stay in their own files.
 */

/**
 * Any selection. The four type parameters are left open because these helpers never read a
 * selection - they build it and hand it straight to the caller's adapter, which supplies the real
 * types. Naming the parameters instead makes d3's `merge` and `select` signatures fight the
 * variance at every call site without describing anything more.
 */
// oxlint-disable-next-line typescript/no-explicit-any
type AnySelection = Selection<any, any, any, any>;

/**
 * That a d3 selection plugin creates one keyed child per parent and re-selects it afterwards.
 *
 * `attach` applies the plugin method under test to a selection - `(s, key) => { s.selectDiv(key) }`
 * - and is the only thing that decides which module these tests exercise. `tagName` is the tag the
 * plugin appends, as `Element.tagName` reports it (uppercase for HTML, lowercase for SVG), and
 * `attribute` the marker attribute other code selects the child on.
 */
export function describesKeyedChild(options: {
  attribute: string;
  tagName: string;
  makeParent: () => Element;
  attach: (selection: AnySelection, key: string) => void;
}): void {
  const { attribute, tagName, makeParent, attach } = options;
  const child = (parent: Element, key: string) => parent.querySelector(`[${attribute}="${key}"]`);
  const children = (parent: Element, key: string) =>
    parent.querySelectorAll(`[${attribute}="${key}"]`);

  test(`should create a ${tagName} keyed by the ${attribute} attribute other code selects on`, () => {
    const parent = makeParent();
    attach(select(parent), "test-key");
    expect(child(parent, "test-key")?.tagName).toBe(tagName);
  });

  test("should return the existing child rather than append a second when the key repeats", () => {
    // The behaviour the module exists for: a re-render must not accumulate layers.
    const parent = makeParent();
    const selection = select(parent);
    attach(selection, "same-key");
    const first = child(parent, "same-key");
    attach(selection, "same-key");

    expect(child(parent, "same-key")).toBe(first);
    expect(children(parent, "same-key")).toHaveLength(1);
  });

  test("should create a separate child for each distinct key", () => {
    const parent = makeParent();
    const selection = select(parent);
    attach(selection, "key1");
    attach(selection, "key2");

    expect(child(parent, "key1")).toBeTruthy();
    expect(child(parent, "key2")).toBeTruthy();
    expect(child(parent, "key1")).not.toBe(child(parent, "key2"));
  });

  test("should bind the parent's datum to the child, which the components render from", () => {
    const parent = makeParent();
    const testData = { value: 42 };
    attach(select(parent).datum(testData), "data-test");

    expect(select(child(parent, "data-test")).datum()).toEqual(testData);
  });

  test("should create one child per parent when the selection holds several", () => {
    const first = makeParent();
    const second = makeParent();
    first.setAttribute("class", "conformance-parent");
    second.setAttribute("class", "conformance-parent");

    attach(select(document.body).selectAll(".conformance-parent").data([1, 2]), "multi-test");

    // Each parent gets exactly one, carrying that parent's own datum.
    for (const [parent, datum] of [
      [first, 1],
      [second, 2],
    ] as const) {
      expect(children(parent, "multi-test")).toHaveLength(1);
      expect(select(child(parent, "multi-test")).datum()).toBe(datum);
    }
  });
}

/** The three forms a layer factory accepts as its container argument. */
type LayerContainer = Element | AnySelection | string;

/**
 * That a layer factory accepts all three container forms and keys its layers.
 *
 * `create` calls the factory under test with a container and an optional key, and is the only
 * thing that decides which module these tests exercise. `layers` counts the layers the factory
 * drew into a container, which each file reads back its own way - an `svg` tag for one, the
 * `data-sszvis-html-layer` marker for the other. `containerId` is the id `makeContainer` puts on
 * the container, so the selector form has something to find.
 */
export function describesLayerContainer(options: {
  containerId: string;
  makeContainer: (id?: string) => Element;
  create: (container: LayerContainer, key?: string) => void;
  layers: (parent: Element) => ArrayLike<Element>;
}): void {
  const { containerId, makeContainer, create, layers } = options;

  test.each([
    ["a DOM element", (parent: Element) => parent],
    ["a d3 selection", (parent: Element) => select(parent)],
    ["a CSS selector", () => `#${containerId}`],
  ])("should create the layer in the container when given %s", (_label, toArgument) => {
    const parent = makeContainer(containerId);
    create(toArgument(parent));
    expect(layers(parent)).toHaveLength(1);
  });

  test("should reuse the existing layer rather than add a second when the key repeats", () => {
    const parent = makeContainer();
    create(parent, "same");
    create(parent, "same");
    expect(layers(parent)).toHaveLength(1);
  });

  test("should create a separate layer for each distinct key", () => {
    const parent = makeContainer();
    create(parent, "layer1");
    create(parent, "layer2");
    expect(layers(parent)).toHaveLength(2);
  });
}
