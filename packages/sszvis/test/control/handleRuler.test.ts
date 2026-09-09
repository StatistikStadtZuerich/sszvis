import { select as d3Select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import handleRuler, { type HandleRulerComponent } from "../../src/control/handleRuler.js";
import "../../src/d3-selectgroup.js";

type Datum = { x: number; y: number; label: string };

describe("control/handleRuler", () => {
  let container: HTMLDivElement;
  let svg: SVGSVGElement;

  const data: Datum[] = [
    { x: 40, y: 60, label: "first" },
    { x: 40, y: 120, label: "second" },
  ];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    svg = d3Select(container)
      .append("svg")
      .attr("width", 400)
      .attr("height", 300)
      .node() as SVGSVGElement;
  });

  afterEach(() => {
    container.remove();
  });

  /** Binds data to a fresh group and renders the ruler into it. */
  const render = (control: HandleRulerComponent<Datum>, bound: Datum[] = data) => {
    const group = d3Select(svg).append("g").datum(bound);
    group.call(control);
    return group.node() as SVGGElement;
  };

  const ruler = () =>
    handleRuler<Datum>()
      .x(40)
      .y((d: Datum) => d.y)
      .top(20)
      .bottom(200)
      .label((d: Datum) => d.label)
      .color("#f00");

  const rule = (node: Element) => node.querySelector("line.sszvis-ruler__rule");
  const handle = (node: Element) => node.querySelector("rect.sszvis-handleRuler__handle");
  const handleMark = (node: Element) => node.querySelector("line.sszvis-handleRuler__handle-mark");
  const dots = (node: Element) => [...node.querySelectorAll("circle.sszvis-ruler__dot")];
  const labels = (node: Element) => [
    ...node.querySelectorAll<SVGTextElement>("text.sszvis-ruler__label"),
  ];
  const outlines = (node: Element) => [
    ...node.querySelectorAll<SVGTextElement>("text.sszvis-ruler__label-outline"),
  ];

  test("should render its parts inside a single group", () => {
    const node = render(ruler());
    const groups = node.querySelectorAll("g.sszvis-handleRuler__group");
    expect(groups.length).toBe(1);
    expect(rule(node)).toBeTruthy();
    expect(handle(node)).toBeTruthy();
    expect(handleMark(node)).toBeTruthy();
  });

  test("should keep one of each part when rendered again", () => {
    const control = ruler();
    const group = d3Select(svg).append("g").datum(data);
    group.call(control);
    group.call(control);
    const node = group.node() as SVGGElement;
    expect(node.querySelectorAll("g.sszvis-handleRuler__group").length).toBe(1);
    expect(node.querySelectorAll("line.sszvis-ruler__rule").length).toBe(1);
    expect(node.querySelectorAll("rect.sszvis-handleRuler__handle").length).toBe(1);
    expect(node.querySelectorAll("line.sszvis-handleRuler__handle-mark").length).toBe(1);
  });

  test("should stay idempotent over repeated renders and keep the handle behind the dots", () => {
    const control = ruler();
    const group = d3Select(svg).append("g").datum(data);
    group.call(control);
    group.call(control);
    group.call(control);
    const node = group.node() as SVGGElement;
    expect(node.querySelectorAll("line.sszvis-ruler__rule").length).toBe(1);
    expect(node.querySelectorAll("rect.sszvis-handleRuler__handle").length).toBe(1);
    expect(node.querySelectorAll("line.sszvis-handleRuler__handle-mark").length).toBe(1);
    expect(node.querySelectorAll("circle.sszvis-ruler__dot").length).toBe(2);
    expect(node.querySelectorAll("text.sszvis-ruler__label").length).toBe(2);
    // the static parts stay behind the dots, which the styling assumes
    const rulerGroup = node.querySelector("g.sszvis-handleRuler__group") as SVGGElement;
    const classes = [...rulerGroup.children].map((c) => c.getAttribute("class"));
    expect(classes.lastIndexOf("sszvis-handleRuler__handle")).toBeLessThan(
      classes.indexOf("sszvis-ruler__dot")
    );
    expect(rule(node)?.getAttribute("x1")).toBe("40.5");
  });

  test("should keep one of each static part when re-rendered with fewer data", () => {
    const control = ruler();
    const group = d3Select(svg).append("g").datum(data);
    group.call(control);
    group.datum([data[0]]);
    group.call(control);
    const node = group.node() as SVGGElement;
    expect(node.querySelectorAll("circle.sszvis-ruler__dot").length).toBe(1);
    expect(node.querySelectorAll("text.sszvis-ruler__label").length).toBe(1);
    expect(node.querySelectorAll("line.sszvis-ruler__rule").length).toBe(1);
  });

  test("should not adopt a rule that belongs to something else in the container", () => {
    const group = d3Select(svg).append("g").datum(data);
    // an annotation ruler's rule, which shares the class but is not inside the handle
    // ruler's own group
    const foreign = group.append("line").attr("class", "sszvis-ruler__rule").attr("x1", "999");
    group.call(ruler());
    const node = group.node() as SVGGElement;
    expect(foreign.attr("x1")).toBe("999");
    const rulerGroup = node.querySelector("g.sszvis-handleRuler__group") as SVGGElement;
    expect(rulerGroup.querySelectorAll("line.sszvis-ruler__rule").length).toBe(1);
    expect(rulerGroup.querySelector("line.sszvis-ruler__rule")?.getAttribute("x1")).toBe("40.5");
  });

  test("should position the rule and handle from an x accessor", () => {
    const node = render(
      handleRuler<Datum>()
        .x((d: Datum) => d.x)
        .y((d: Datum) => d.y)
        .top(20)
        .bottom(200)
    );
    expect(rule(node)?.getAttribute("x1")).toBe("40.5");
    expect(handle(node)?.getAttribute("x")).toBe("35.5");
    expect(handleMark(node)?.getAttribute("x1")).toBe("40.5");
    expect(dots(node).map((d) => d.getAttribute("cx"))).toEqual(["40.5", "40.5"]);
  });

  test("should resolve the ruler group to the first datum when x values differ", () => {
    // There is only one rule, so it has to come from one datum; the first one wins.
    const node = render(
      handleRuler<Datum>()
        .x((d: Datum) => d.x)
        .y((d: Datum) => d.y)
        .top(20)
        .bottom(200),
      [
        { x: 40, y: 60, label: "first" },
        { x: 100, y: 120, label: "second" },
      ]
    );
    expect(rule(node)?.getAttribute("x1")).toBe("40.5");
    expect(handle(node)?.getAttribute("x")).toBe("35.5");
    // the dots still follow their own data
    expect(dots(node).map((d) => d.getAttribute("cx"))).toEqual(["40.5", "100.5"]);
  });

  test("should nudge a label above the top by the same constant as one on the ruler", () => {
    const node = render(ruler(), [{ x: 40, y: 10, label: "high" }]);
    expect(labels(node)[0]?.getAttribute("transform")).toBe("translate(50.5,15.5)");
  });

  test("should nudge a label just below the top threshold by that same constant", () => {
    // The worst case for the old `2 * y` arithmetic, which put this label at 58.5.
    const node = render(ruler(), [{ x: 40, y: 19, label: "nearly" }]);
    expect(labels(node)[0]?.getAttribute("transform")).toBe("translate(50.5,24.5)");
  });

  test("should draw the rule from the top down to 4px above the bottom, on half pixels", () => {
    const node = render(ruler());
    const line = rule(node) as SVGLineElement;
    // x comes from the first datum, snapped to a half pixel for crisp rendering
    expect(line.getAttribute("x1")).toBe("40.5");
    expect(line.getAttribute("x2")).toBe("40.5");
    expect(line.getAttribute("y1")).toBe("20.5");
    // bottom 200, less the 4px the handle design reserves, snapped to a half pixel
    expect(line.getAttribute("y2")).toBe("196.5");
  });

  test("should draw a 10x24 rounded handle sitting on top of the rule", () => {
    const node = render(ruler());
    const rect = handle(node) as SVGRectElement;
    expect(rect.getAttribute("width")).toBe("10");
    expect(rect.getAttribute("height")).toBe("24");
    expect(rect.getAttribute("rx")).toBe("2");
    expect(rect.getAttribute("ry")).toBe("2");
    // centred on the rule: crispX - handleWidth / 2
    expect(rect.getAttribute("x")).toBe("35.5");
    // top 20 less the 24px handle height, snapped to a half pixel: floor(-4) + 0.5
    expect(rect.getAttribute("y")).toBe("-3.5");
  });

  test("should draw the grip mark inside the middle of the handle", () => {
    const node = render(ruler());
    const mark = handleMark(node) as SVGLineElement;
    expect(mark.getAttribute("x1")).toBe("40.5");
    expect(mark.getAttribute("x2")).toBe("40.5");
    // handleTop -4, plus 15% and 85% of the 24px handle height
    expect(mark.getAttribute("y1")).toBe("-0.5");
    expect(mark.getAttribute("y2")).toBe("16.5");
  });

  test("should render one dot per datum, positioned on half pixels", () => {
    const node = render(ruler());
    expect(dots(node).length).toBe(2);
    expect(dots(node).map((d) => d.getAttribute("cx"))).toEqual(["40.5", "40.5"]);
    expect(dots(node).map((d) => d.getAttribute("cy"))).toEqual(["60.5", "120.5"]);
    expect(dots(node).map((d) => d.getAttribute("r"))).toEqual(["3.5", "3.5"]);
  });

  test("should forward d3's index and node group, and its element `this`, to the y accessor", () => {
    // `crispY` is composed with fn.compose, which forwards the whole (d, i, nodes) argument
    // list and the element-bound `this` that d3 supplies. An arrow function that takes only
    // the datum computes the same coordinates for every accessor in this repo, so nothing
    // else in this suite would notice the difference - hence this test.
    const calls: Array<{ datum: Datum; index: number; nodeCount: number; self: unknown }> = [];
    const node = render(
      ruler().y(function (this: unknown, d: Datum, ...rest: unknown[]) {
        calls.push({
          datum: d,
          index: rest[0] as number,
          nodeCount: (rest[1] as ArrayLike<unknown>)?.length,
          self: this,
        });
        return d.y;
      } as never)
    );

    const dotElements = dots(node);
    const fromDots = calls.filter((call) => dotElements.includes(call.self as SVGCircleElement));
    expect(fromDots.map((call) => call.index)).toEqual([0, 1]);
    expect(fromDots.map((call) => call.nodeCount)).toEqual([2, 2]);
    // `this` is the element being positioned, not the enclosing lexical scope
    expect(fromDots.map((call) => call.self)).toEqual(dotElements);
    expect(fromDots.map((call) => call.datum.y)).toEqual([60, 120]);
  });

  test("should fill the dots with the configured color", () => {
    const node = render(ruler().color("#0f0"));
    expect(dots(node).map((d) => d.getAttribute("fill"))).toEqual(["#0f0", "#0f0"]);
  });

  test("should accept a color function evaluated per datum", () => {
    const node = render(ruler().color((d: Datum) => (d.y > 100 ? "#00f" : "#f00")));
    expect(dots(node).map((d) => d.getAttribute("fill"))).toEqual(["#f00", "#00f"]);
  });

  test("should accept constants for x and y", () => {
    const node = render(handleRuler<Datum>().x(80).y(50).top(20).bottom(200));
    expect(rule(node)?.getAttribute("x1")).toBe("80.5");
    expect(dots(node).map((d) => d.getAttribute("cy"))).toEqual(["50.5", "50.5"]);
  });

  test("should default the label to an empty string when none is given", () => {
    const node = render(handleRuler<Datum>().x(40).y(60).top(20).bottom(200));
    expect(labels(node).map((l) => l.innerHTML)).toEqual(["", ""]);
  });

  test("should render a label and a matching outline for each datum", () => {
    const node = render(ruler());
    expect(labels(node).map((l) => l.innerHTML)).toEqual(["first", "second"]);
    expect(outlines(node).map((l) => l.innerHTML)).toEqual(["first", "second"]);
  });

  test("should place labels to the right of the ruler by default", () => {
    const node = render(ruler());
    // x + 10, y + 5 for a label between top and bottom
    expect(labels(node).map((l) => l.getAttribute("transform"))).toEqual([
      "translate(50.5,65.5)",
      "translate(50.5,125.5)",
    ]);
    expect(labels(node).map((l) => l.style.textAnchor)).toEqual(["start", "start"]);
  });

  test("should flip labels to the left when flip is set", () => {
    const node = render(ruler().flip(true));
    expect(labels(node).map((l) => l.getAttribute("transform"))).toEqual([
      "translate(30.5,65.5)",
      "translate(30.5,125.5)",
    ]);
    expect(labels(node).map((l) => l.style.textAnchor)).toEqual(["end", "end"]);
  });

  test("should accept a flip predicate evaluated per datum", () => {
    const node = render(ruler().flip((d: Datum) => d.y > 100));
    expect(labels(node).map((l) => l.style.textAnchor)).toEqual(["start", "end"]);
  });

  test("should nudge a label sitting below the bottom back onto the ruler", () => {
    // dy is 0 rather than 5 once y is past props.bottom
    const node = render(ruler().bottom(100));
    expect(labels(node)[1]?.getAttribute("transform")).toBe("translate(50.5,120.5)");
  });

  test("should render nothing per-datum for an empty data array", () => {
    const node = render(ruler(), []);
    expect(dots(node)).toEqual([]);
    expect(labels(node)).toEqual([]);
    expect(rule(node)).toBeTruthy();
  });

  describe("known quirks", () => {
    test("labels are written as raw HTML", () => {
      // NOTE: labels are set with `.html(…)`, so markup in a label is parsed rather than
      // escaped. That is deliberate and library-wide - sszvis.modularText returns markup
      // and src/annotation/ruler.ts does the same - but it means a label built from
      // untrusted data is an injection point, and callers are responsible for escaping.
      const node = render(ruler().label(() => "<tspan class='injected'>x</tspan>"));
      expect(labels(node)[0]?.querySelector(".injected")).toBeTruthy();
    });

    test("the label baseline is measured against bottom, but the rule stops 4px earlier", () => {
      // NOTE: the rule is drawn to `props.bottom - 4` while the label's dy branch tests
      // against the unadjusted `props.bottom`. A label in that 4px band is treated as
      // being on the ruler even though the rule has already ended.
      const node = render(ruler().bottom(122), [{ x: 40, y: 120, label: "edge" }]);
      expect(rule(node)?.getAttribute("y2")).toBe("118.5");
      // dy is still 5, the "on the ruler" value
      expect(labels(node)[0]?.getAttribute("transform")).toBe("translate(50.5,125.5)");
    });

    test("missing top and bottom produce NaN coordinates rather than an error", () => {
      // NOTE: `top` and `bottom` have no defaults and are not validated, so leaving them
      // out writes NaN into the geometry and the ruler silently disappears. No sszvis
      // component validates its required props, so this is house style rather than a
      // defect specific to this control - but the failure is silent and invisible.
      const node = render(handleRuler<Datum>().x(40).y(60));
      expect(rule(node)?.getAttribute("y1")).toBe("NaN");
      expect(handle(node)?.getAttribute("y")).toBe("NaN");
    });

    test("an unset color leaves the dots without a fill attribute", () => {
      // NOTE: `color` has no default, so the dots fall back to whatever the stylesheet
      // gives them. d3 removes the attribute for an undefined value rather than writing
      // "undefined". src/annotation/ruler.ts defaults the same property to "black", so
      // the two rulers behave differently when it is left out.
      const node = render(handleRuler<Datum>().x(40).y(60).top(20).bottom(200));
      expect(dots(node)[0]?.getAttribute("fill")).toBeNull();
    });

    test("a plain string label works even though only the default is functor-wrapped", () => {
      // NOTE: `label` is declared as a plain prop, so a string is passed straight to
      // d3's `.html()`, which accepts constants. It works, but unlike `x`, `y` and
      // `flip` it is not `fn.functor`-wrapped, so the component never calls it - a
      // future change that did call it would break string labels.
      const node = render(ruler().label("fixed"));
      expect(labels(node).map((l) => l.innerHTML)).toEqual(["fixed", "fixed"]);
    });

    test("labels at the same position are drawn on top of each other", () => {
      // NOTE: unlike src/annotation/ruler.ts, which can de-overlap its labels, this
      // control joins labels by index and applies no overlap reduction, so two data
      // points at the same y produce two labels at exactly the same coordinates.
      const node = render(ruler(), [
        { x: 40, y: 60, label: "a" },
        { x: 40, y: 60, label: "b" },
      ]);
      expect(labels(node).map((l) => l.getAttribute("transform"))).toEqual([
        "translate(50.5,65.5)",
        "translate(50.5,65.5)",
      ]);
    });

    test("labels and outlines are rendered outside the ruler's own group", () => {
      // NOTE: the dots go into `.sszvis-handleRuler__group` but the two label selections
      // are joined on the component's own selection, so a caller who moves or hides that
      // group leaves the labels behind.
      const node = render(ruler());
      const group = node.querySelector("g.sszvis-handleRuler__group") as SVGGElement;
      expect(group.querySelectorAll("text.sszvis-ruler__label").length).toBe(0);
      expect(node.querySelectorAll(":scope > text.sszvis-ruler__label").length).toBe(2);
    });
  });
});
