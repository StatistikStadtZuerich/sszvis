import type { LabColor } from "d3";
import { scaleBand, scaleLinear, scaleThreshold } from "d3";
import { afterEach, describe, expect, expectTypeOf, test } from "vitest";
import { annotationRuler } from "../src/annotation/ruler.js";
import { muchDarker, scaleQual12, scaleSeqBlu, slightlyDarker, withAlpha } from "../src/color.js";
import bar, { type BarComponent } from "../src/component/bar.js";
import dot from "../src/component/dot.js";
import { groupedBarsVertical } from "../src/component/groupedBars.js";
import line from "../src/component/line.js";
import nestedStackedBarsVertical from "../src/component/nestedStackedBar.js";
import stackedArea from "../src/component/stackedArea.js";
import {
  stackedBarHorizontal,
  stackedBarHorizontalData,
  stackedBarVertical,
  stackedBarVerticalData,
} from "../src/component/stackedBar.js";
import sunburst from "../src/component/sunburst.js";
import { createSvgLayer } from "../src/createSvgLayer.js";
import handleRuler from "../src/control/handleRuler.js";
import "../src/d3-selectgroup.js";
import legendColorBinned from "../src/legend/binnedColorScale.js";
import legendColorLinear from "../src/legend/linearColorScale.js";
import mapRendererBubble from "../src/map/renderer/bubble.js";
import mapRendererGeoJson from "../src/map/renderer/geojson.js";
import choropleth from "../src/maps/choropleth.js";
import type { ColorValue } from "../src/types.js";

type Datum = { x: number; y: number; category: string };

/**
 * The library's own colour scales return d3 LabColor objects, not strings. These tests pin
 * that a component accepts one where it expects a colour - at the type level, which is what
 * used to be wrong, and on screen, which always worked because d3 stringifies the object.
 */
describe("colour props accept the library's own scales", () => {
  const data: Datum[] = [
    { x: 10, y: 20, category: "a" },
    { x: 60, y: 25, category: "b" },
  ];

  let layerKey = 0;
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    for (const container of containers.splice(0)) container.remove();
  });

  const layer = () => {
    const container = document.createElement("div");
    container.id = `colorvalue-container-${++layerKey}`;
    document.body.append(container);
    containers.push(container);
    return createSvgLayer(`#${container.id}`, undefined, { key: `cv-${layerKey}` });
  };

  test("a LabColor is a ColorValue, and a colour scale produces one", () => {
    expectTypeOf<LabColor>().toMatchTypeOf<ColorValue>();
    expectTypeOf<string>().toMatchTypeOf<ColorValue>();
    expectTypeOf(scaleQual12()("a")).toMatchTypeOf<ColorValue>();
    expectTypeOf(scaleSeqBlu()(0.5)).toMatchTypeOf<ColorValue>();
  });

  test("bar.fill takes an accessor returning a scale's LabColor", () => {
    const colorScale = scaleQual12();

    // The call is the assertion: were the prop typed back down to `string`, this would not
    // compile, and `pnpm --filter sszvis run type-check` covers test/ as well as src/.
    const chart = bar<Datum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width(20)
      .height(30)
      .fill((d: Datum) => colorScale(d.category))
      .stroke(colorScale("a"));
    expectTypeOf(chart).toMatchTypeOf<BarComponent<Datum>>();

    const group = layer().selectGroup("bars").datum(data).call(chart).node() as SVGGElement;
    const fills = [...group.querySelectorAll("rect.sszvis-bar-rect")].map((r) =>
      r.getAttribute("fill"),
    );

    expect(fills).toEqual([String(colorScale("a")), String(colorScale("b"))]);
    expect(fills[0]).toMatch(/^rgb/);
  });

  test("annotationRuler.color takes a scale's LabColor", () => {
    const colorScale = scaleQual12();
    const ruler = annotationRuler<Datum>()
      .top(0)
      .bottom(100)
      .x((d: Datum) => d.x)
      .y((d: Datum) => d.y)
      .label((d: Datum) => d.category)
      .color((d: Datum) => colorScale(d.category));

    const group = layer().selectGroup("ruler").datum(data).call(ruler).node() as SVGGElement;
    const dotFills = [...group.querySelectorAll("circle.sszvis-ruler__dot")].map((c) =>
      c.getAttribute("fill"),
    );

    expect(dotFills).toEqual([String(colorScale("a")), String(colorScale("b"))]);
  });

  test("handleRuler.color takes a constant LabColor", () => {
    const colorScale = scaleQual12();
    const control = handleRuler<Datum>()
      .top(0)
      .bottom(100)
      .x((d: Datum) => d.x)
      .y((d: Datum) => d.y)
      .label((d: Datum) => d.category)
      .color(colorScale("a"));

    const group = layer().selectGroup("handle").datum(data).call(control).node() as SVGGElement;
    const rulerDot = group.querySelector("circle.sszvis-ruler__dot");

    expect(rulerDot?.getAttribute("fill")).toBe(String(colorScale("a")));
  });
});

/**
 * The second pass over the colour props: the components whose fill/stroke still declared a
 * plain `string`, so `.fill((d) => colorScale(key(d)))` - the idiomatic call against the
 * library's own palette - was a type error. Each call below is itself the assertion: were a
 * prop typed back down to `string`, the file would stop compiling, and
 * `pnpm --filter sszvis run type-check` covers test/ as well as src/.
 */
describe("the colour props widened in the second pass", () => {
  type Row = { region: string; category: string; value: number };

  const rows: Row[] = [
    { region: "A", category: "X", value: 10 },
    { region: "A", category: "Y", value: 20 },
    { region: "B", category: "X", value: 15 },
    { region: "B", category: "Y", value: 25 },
  ];

  let layerKey = 0;
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    for (const container of containers.splice(0)) container.remove();
  });

  const layer = () => {
    const container = document.createElement("div");
    container.id = `colorvalue2-container-${++layerKey}`;
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.append(container);
    containers.push(container);
    return createSvgLayer(`#${container.id}`, undefined, { key: `cv2-${layerKey}` });
  };

  test("the colour helpers take a scale's LabColor and keep producing colours", () => {
    const colorScale = scaleQual12();
    const base = colorScale("a");

    expectTypeOf(slightlyDarker(base)).toMatchTypeOf<ColorValue>();
    expectTypeOf(muchDarker(base)).toMatchTypeOf<ColorValue>();
    expectTypeOf(withAlpha(base, 0.5)).toEqualTypeOf<string>();

    // The string overload still works, and both spellings agree: the object stringifies to
    // exactly the colour the string form is given.
    expect(String(slightlyDarker(base))).toBe(String(slightlyDarker(String(base))));
    expect(withAlpha(base, 0.5)).toBe(withAlpha(String(base), 0.5));
    expect(withAlpha(base, 0.5)).toMatch(/^rgba\(/);
  });

  test("groupedBarsVertical.fill takes an accessor returning a scale's LabColor", () => {
    const colorScale = scaleQual12();
    const groupScale = scaleBand<string>().domain(["A", "B"]).range([0, 400]);
    const yScale = scaleLinear().domain([0, 50]).range([300, 0]);

    const chart = groupedBarsVertical<Row>()
      .groupScale((d) => groupScale(d.region) ?? 0)
      .groupSize(2)
      .groupWidth(groupScale.bandwidth())
      .groupSpace(0.05)
      .y((d) => yScale(d.value))
      .height((d) => 300 - yScale(d.value))
      .defined(() => true)
      .fill((d) => colorScale(d.category))
      .stroke(colorScale("X"))
      .transition(false);

    // groupedBars takes an array of groups, each group an array of its bars.
    const groups: Row[][] = [rows.slice(0, 2), rows.slice(2)];
    const group = layer().selectGroup("grouped").datum(groups).call(chart).node() as SVGGElement;
    const fills = [...group.querySelectorAll("rect.sszvis-bar-rect")].map((r) =>
      r.getAttribute("fill"),
    );

    expect(fills.length).toBe(4);
    expect(fills[0]).toBe(String(colorScale("X")));
    expect(fills[0]).toMatch(/^rgb/);
  });

  test("stackedBarVertical.fill takes an accessor returning a scale's LabColor", () => {
    const colorScale = scaleQual12();
    const xScale = scaleBand<string>().domain(["A", "B"]).range([0, 400]).paddingInner(0.2);
    const yScale = scaleLinear().domain([0, 50]).range([300, 0]);

    const chart = stackedBarVertical<Row>()
      .xScale((region: string) => xScale(region))
      .width(xScale.bandwidth())
      .yScale(yScale)
      .fill((slice) => colorScale(slice.series))
      .stroke(colorScale("X"))
      .transition(false);

    const data = stackedBarVerticalData<Row, string>(
      (d) => d.region,
      (d) => d.category,
      (d) => d.value,
    )(rows);

    const group = layer().selectGroup("stacked").datum(data).call(chart).node() as SVGGElement;
    const fills = [...group.querySelectorAll("rect.sszvis-bar-rect")].map((r) =>
      r.getAttribute("fill"),
    );

    expect(fills.length).toBe(4);
    expect(new Set(fills)).toEqual(new Set([String(colorScale("X")), String(colorScale("Y"))]));
  });

  test("stackedBarHorizontal.fill takes an accessor returning a scale's LabColor", () => {
    const colorScale = scaleQual12();
    const xScale = scaleLinear().domain([0, 50]).range([0, 400]);
    const yScale = scaleBand<string>().domain(["A", "B"]).range([0, 300]).paddingInner(0.2);

    const chart = stackedBarHorizontal<Row>()
      .xScale(xScale)
      .yScale((region: string) => yScale(region))
      .height(yScale.bandwidth())
      .fill((slice) => colorScale(slice.series))
      .transition(false);

    const data = stackedBarHorizontalData<Row, string>(
      (d) => d.region,
      (d) => d.category,
      (d) => d.value,
    )(rows);

    const group = layer().selectGroup("stacked-h").datum(data).call(chart).node() as SVGGElement;
    const fills = [...group.querySelectorAll("rect.sszvis-bar-rect")].map((r) =>
      r.getAttribute("fill"),
    );

    expect(fills.length).toBe(4);
    expect(fills.every((fill) => fill?.startsWith("rgb"))).toBe(true);
  });

  test("nestedStackedBarsVertical.fill takes an accessor returning a scale's LabColor", () => {
    const colorScale = scaleQual12();
    const xScale = scaleBand<string>().domain(["A", "B"]).range([0, 400]);
    const yScale = scaleLinear().domain([0, 50]).range([300, 0]);

    // The setter is the assertion; nothing is rendered, because the nested component needs a
    // prepared nest that the stackedBar cases above already cover the colouring of.
    const chart = nestedStackedBarsVertical<Row>()
      .xScale(xScale)
      .yScale(yScale)
      .fill((slice) => colorScale(slice.series))
      .stroke(colorScale("X"));

    expect(typeof chart.fill()).toBe("function");
  });

  test("line.stroke takes an accessor returning a scale's LabColor", () => {
    const colorScale = scaleQual12();
    type Series = { key: string; points: { x: number; y: number }[] };
    const series: Series[] = [
      {
        key: "X",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      },
      {
        key: "Y",
        points: [
          { x: 0, y: 5 },
          { x: 10, y: 15 },
        ],
      },
    ];

    const chart = line<{ x: number; y: number }, Series>()
      .x((p) => p.x)
      .y((p) => p.y)
      .valuesAccessor((s: Series) => s.points)
      .key((s: Series) => s.key)
      .stroke((s: Series) => colorScale(s.key))
      .transition(false);

    const group = layer().selectGroup("lines").datum(series).call(chart).node() as SVGGElement;
    const strokes = [...group.querySelectorAll("path.sszvis-line")].map(
      (p) => (p as SVGPathElement).style.stroke,
    );

    expect(strokes.length).toBe(2);
    expect(strokes[0]).toMatch(/^rgb/);
  });

  test("dot.fill and dot.stroke take a scale's LabColor", () => {
    const colorScale = scaleQual12();
    const chart = dot<Row>()
      .x((d) => d.value)
      .y((d) => d.value)
      .radius(4)
      .fill((d) => colorScale(d.category))
      .stroke(colorScale("X"))
      .transition(false);

    const group = layer().selectGroup("dots").datum(rows).call(chart).node() as SVGGElement;
    const fills = [...group.querySelectorAll("circle.sszvis-circle")].map((c) =>
      c.getAttribute("fill"),
    );

    expect(fills.length).toBe(4);
    expect(fills[0]).toBe(String(colorScale("X")));
  });

  test("stackedArea.fill and .stroke take a scale's LabColor", () => {
    const colorScale = scaleQual12();
    type Point = { x: number; y0: number; y1: number };
    // The default layer shape: a layer IS its array of points, which the identity
    // valuesAccessor the component defaults to already yields.
    const layers: Point[][] = [
      [
        { x: 0, y0: 0, y1: 10 },
        { x: 10, y0: 0, y1: 20 },
      ],
    ];

    const chart = stackedArea<Point, Point[]>()
      .x((p) => p.x)
      .y0((p) => p.y0)
      .y1((p) => p.y1)
      .key((_l: Point[], i: number) => i)
      .fill(colorScale("X"))
      .stroke(colorScale("Y"))
      .transition(false);

    const group = layer().selectGroup("areas").datum(layers).call(chart).node() as SVGGElement;
    const paths = [...group.querySelectorAll("path")];

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].getAttribute("fill")).toBe(String(colorScale("X")));
    expect(paths[0].getAttribute("stroke")).toBe(String(colorScale("Y")));
  });

  test("sunburst.fill and .stroke take a scale's LabColor", () => {
    const colorScale = scaleQual12();
    const chart = sunburst()
      .fill((key: string) => colorScale(key))
      .stroke(colorScale("X"));

    expect(typeof chart.fill()).toBe("function");
  });

  test("the binned and linear colour legends take a scale returning LabColor", () => {
    const seq = scaleSeqBlu().domain([0, 100]);
    const binned = scaleThreshold<number, ReturnType<typeof seq>>()
      .domain([25, 50, 75])
      .range([seq(0), seq(33), seq(66), seq(100)]);

    const binnedLegend = legendColorBinned()
      .scale(binned)
      .displayValues([25, 50, 75])
      .endpoints([0, 100])
      .width(200);
    const linearLegend = legendColorLinear().scale(seq).width(200);

    const binnedGroup = layer()
      .selectGroup("legend-binned")
      .call(binnedLegend)
      .node() as SVGGElement;
    const linearGroup = layer()
      .selectGroup("legend-linear")
      .call(linearLegend)
      .node() as SVGGElement;

    expect(
      [...binnedGroup.querySelectorAll("rect.sszvis-legend__crispmark")].every((r) =>
        r.getAttribute("fill")?.startsWith("rgb"),
      ),
    ).toBe(true);
    expect(
      [...linearGroup.querySelectorAll("rect.sszvis-legend__mark")].every((r) =>
        r.getAttribute("fill")?.startsWith("rgb"),
      ),
    ).toBe(true);
  });

  test("the map renderers' colour props take a scale's LabColor", () => {
    const colorScale = scaleQual12();

    // Type-level only: these renderers need real topography to draw. The setters are what
    // regressed, and a narrowed prop would fail to compile here.
    const geoJson = mapRendererGeoJson<Row & Record<string, unknown>>()
      .fill((d) => colorScale(d.category))
      .stroke(colorScale("X"));
    const bubble = mapRendererBubble<Row>()
      .fill((d) => colorScale(d.category))
      .strokeColor(colorScale("X"));
    const map = choropleth<Row>()
      .fill((d) => colorScale(d?.category ?? "X"))
      .borderColor(colorScale("X"))
      .highlightStroke(colorScale("Y"))
      .lakePathColor(colorScale("X"));

    expect(typeof geoJson.fill()).toBe("function");
    expect(typeof bubble.fill()).toBe("function");
    expect(typeof map.fill()).toBe("function");
  });

  test("the geojson renderer's event handler is generic over its datum", () => {
    // Before this change the handler was `(datum: unknown) => void`, so a typed handler had
    // to narrow by hand. It now matches ChoroplethEventHandler<T> and BubbleEventHandler<T>.
    const seen: (string | undefined)[] = [];
    const component = mapRendererGeoJson<Row & Record<string, unknown>>().on("over", (datum) => {
      expectTypeOf(datum).toMatchTypeOf<(Row & Record<string, unknown>) | undefined>();
      seen.push(datum?.category);
    });

    expect(typeof component.on("over")).toBe("function");
  });
});
