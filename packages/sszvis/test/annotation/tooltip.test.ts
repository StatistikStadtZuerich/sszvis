import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import fitTooltip from "../../src/annotation/fitTooltip.js";
import tooltip from "../../src/annotation/tooltip.js";
import tooltipAnchor from "../../src/annotation/tooltipAnchor.js";
import { createHtmlLayer } from "../../src/createHtmlLayer.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

type TestDatum = {
  id: string;
  name: string;
  value: number;
  category: string;
};

/** What the tooltip hands its own accessors: the datum plus its measured anchor position. */
type Positioned = { datum: TestDatum; x: number; y: number };

const ORIENTATIONS = ["top", "right", "bottom", "left"] as const;

describe("annotation/tooltip", () => {
  let container: HTMLDivElement;
  let svgContainer: HTMLDivElement;
  let tooltipContainer: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "tooltip-test-container";
    container.style.width = "800px";
    container.style.height = "600px";
    container.style.position = "relative";
    document.body.appendChild(container);

    svgContainer = document.createElement("div");
    svgContainer.id = "svg-container";
    svgContainer.style.width = "400px";
    svgContainer.style.height = "300px";
    container.appendChild(svgContainer);

    tooltipContainer = document.createElement("div");
    tooltipContainer.id = "tooltip-container";
    tooltipContainer.style.width = "800px";
    tooltipContainer.style.height = "600px";
    tooltipContainer.style.position = "absolute";
    tooltipContainer.style.top = "0";
    tooltipContainer.style.left = "0";
    tooltipContainer.style.pointerEvents = "none";
    container.appendChild(tooltipContainer);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  const testData: TestDatum[] = [
    { id: "item1", name: "First Item", value: 100, category: "A" },
    { id: "item2", name: "Second Item", value: 250, category: "B" },
    { id: "item3", name: "Third Item", value: 75, category: "A" },
  ];

  /** Anchors the data in the svg layer and returns the html layer the tooltips render into. */
  const anchored = (
    data: TestDatum[],
    position: (d: TestDatum) => [number, number] = () => [200, 200],
    group = "anchors",
  ) => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");
    svgLayer.selectGroup(group).datum(data).call(tooltipAnchor<TestDatum>().position(position));
    return { tooltipLayer, svgLayer };
  };

  const tooltips = (tooltipLayer: ReturnType<typeof createHtmlLayer>) =>
    tooltipLayer
      .selectAll(".sszvis-tooltip")
      .nodes()
      .map((node) => select(node));

  test("should render the header, body and background of a tooltip for each visible anchor", () => {
    const { tooltipLayer, svgLayer } = anchored(testData, (d) => [d.value + 50, 150]);

    svgLayer.selectAll("[data-tooltip-anchor]").call(
      tooltip<TestDatum>()
        .renderInto(tooltipLayer)
        .visible(() => true)
        .header((d) => d.name)
        .body((d) => `Value: ${d.value}`)
        .orientation("bottom"),
    );

    const rendered = tooltips(tooltipLayer);
    expect(rendered).toHaveLength(testData.length);
    expect(
      rendered.map((t) => ({
        header: t.select(".sszvis-tooltip__header").html(),
        body: t.select(".sszvis-tooltip__body").html(),
        hasBackground: t.select(".sszvis-tooltip__background").node() !== null,
      })),
    ).toEqual(
      testData.map((d) => ({
        header: d.name,
        body: `Value: ${d.value}`,
        hasBackground: true,
      })),
    );
  });

  test.for([
    { predicate: "always true", visible: () => true, expected: 3 },
    { predicate: "always false", visible: () => false, expected: 0 },
    { predicate: "value over 100", visible: (d: TestDatum) => d.value > 100, expected: 1 },
  ])(
    "should render a tooltip only for the anchors the visible predicate accepts when it is $predicate",
    ({ visible, expected }) => {
      const { tooltipLayer, svgLayer } = anchored(testData, (d) => [d.value + 50, 150]);

      svgLayer.selectAll("[data-tooltip-anchor]").call(
        tooltip<TestDatum>()
          .renderInto(tooltipLayer)
          .visible(visible)
          .header((d) => d.name)
          .body((d) => `Value: ${d.value}`),
      );

      expect(tooltips(tooltipLayer)).toHaveLength(expected);
    },
  );

  test.for(ORIENTATIONS)(
    "should pad only the side the tip points from when the orientation is %s",
    (orient) => {
      const { tooltipLayer, svgLayer } = anchored([testData[0]], undefined, `anchors-${orient}`);

      svgLayer.selectAll("[data-tooltip-anchor]").call(
        tooltip<TestDatum>()
          .renderInto(tooltipLayer)
          .visible(() => true)
          .header((d) => d.name)
          .body(() => `Orientation: ${orient}`)
          .orientation(orient),
      );

      const [tip] = tooltips(tooltipLayer);
      // Padding on every side would satisfy a "contains px" check; only the tip's own side
      // may carry it, or the tip is drawn over the content.
      expect(ORIENTATIONS.map((side) => tip.style(`padding-${side}`))).toEqual(
        ORIENTATIONS.map((side) => (side === orient ? "6px" : "0px")),
      );
    },
  );

  test("should render the body as a table when the body accessor returns rows", () => {
    const { tooltipLayer, svgLayer } = anchored([testData[0]]);

    svgLayer.selectAll("[data-tooltip-anchor]").call(
      tooltip<TestDatum>()
        .renderInto(tooltipLayer)
        .visible(() => true)
        .header((d) => d.name)
        .body((d) => [
          ["Property", "Value"],
          ["ID", d.id],
          ["Category", d.category],
          ["Value", String(d.value)],
        ]),
    );

    const table = tooltipLayer.select(".sszvis-tooltip__body table");
    expect(table.node()).not.toBeNull();
    expect(table.classed("sszvis-tooltip__body__table")).toBe(true);
    expect(table.selectAll("tr").nodes()).toHaveLength(4); // header + 3 data rows
  });

  test.for([
    {
      content: "only a header",
      header: "Name" as string | undefined,
      body: undefined,
      small: true,
    },
    { content: "only a body", header: undefined, body: "Value", small: true },
    { content: "both", header: "Name", body: "Value", small: false },
  ])("should mark the tooltip small when it has $content", ({ header, body, small }) => {
    const { tooltipLayer, svgLayer } = anchored([testData[0]]);

    let component = tooltip<TestDatum>()
      .renderInto(tooltipLayer)
      .visible(() => true);
    if (header !== undefined) component = component.header(header);
    if (body !== undefined) component = component.body(body);
    svgLayer.selectAll("[data-tooltip-anchor]").call(component);

    // The rule is an XOR: the "both" case is the one an `||` regression would break.
    expect(tooltips(tooltipLayer)[0].classed("sszvis-tooltip--small")).toBe(small);
  });

  test("should shift the tooltip away from its anchor by dy when the orientation is bottom", () => {
    const topFor = (dy: number) => {
      const { tooltipLayer, svgLayer } = anchored([testData[0]], undefined, `anchors-${dy}`);
      svgLayer.selectAll("[data-tooltip-anchor]").call(
        tooltip<TestDatum>()
          .renderInto(tooltipLayer)
          .visible(() => true)
          .header((d) => d.name)
          .body((d) => `Value: ${d.value}`)
          .dy(dy)
          .orientation("bottom"),
      );
      return Number.parseFloat(tooltips(tooltipLayer)[0].style("top"));
    };

    // A "bottom" tooltip sits above its anchor, so a larger dy pushes it further up.
    expect(topFor(0) - topFor(30)).toBeCloseTo(30, 5);
  });

  test("should apply the configured opacity to the tooltip element", () => {
    const { tooltipLayer, svgLayer } = anchored([testData[0]]);

    svgLayer.selectAll("[data-tooltip-anchor]").call(
      tooltip<TestDatum>()
        .renderInto(tooltipLayer)
        .visible(() => true)
        .header((d) => d.name)
        .opacity(0.5),
    );

    expect(tooltips(tooltipLayer)[0].style("opacity")).toBe("0.5");
  });

  test("should orient each tooltip from its own anchor when orientation is an accessor", () => {
    const { tooltipLayer, svgLayer } = anchored(testData, (d) => [d.value > 100 ? 350 : 50, 150]);

    svgLayer.selectAll("[data-tooltip-anchor]").call(
      tooltip<TestDatum>()
        .renderInto(tooltipLayer)
        .visible(() => true)
        .header((d) => d.name)
        .body((d) => d.category)
        // The accessor is handed the measured position, not the bare datum.
        .orientation((d: Positioned) => (d.x > 300 ? "left" : "right")),
    );

    // Anchors on opposite sides must end up padded on opposite sides; counting tooltips
    // would pass with the accessor's result thrown away.
    expect(
      tooltips(tooltipLayer).map((t) => [t.style("padding-left"), t.style("padding-right")]),
    ).toEqual([
      ["0px", "6px"],
      ["6px", "0px"],
      ["0px", "6px"],
    ]);
  });

  test("should render no tooltips when there are no anchors", () => {
    const { tooltipLayer, svgLayer } = anchored([]);

    svgLayer.selectAll("[data-tooltip-anchor]").call(
      tooltip<TestDatum>()
        .renderInto(tooltipLayer)
        .visible(() => true)
        .header((d) => d.name),
    );

    expect(tooltips(tooltipLayer)).toHaveLength(0);
  });

  test("should read fixed content when scalars are passed instead of accessors", () => {
    const { tooltipLayer, svgLayer } = anchored([testData[0]]);

    svgLayer
      .selectAll("[data-tooltip-anchor]")
      .call(
        tooltip<TestDatum>()
          .renderInto(tooltipLayer)
          .visible(true)
          .header("Fixed Header")
          .body("Fixed Body Content")
          .orientation("top"),
      );

    expect(tooltipLayer.select(".sszvis-tooltip__header").html()).toBe("Fixed Header");
    expect(tooltipLayer.select(".sszvis-tooltip__body").html()).toBe("Fixed Body Content");
  });

  test("should shadow the background either through a filter or the fallback class, never both", () => {
    const { tooltipLayer, svgLayer } = anchored([testData[0]]);

    svgLayer.selectAll("[data-tooltip-anchor]").call(
      tooltip<TestDatum>()
        .renderInto(tooltipLayer)
        .visible(() => true)
        .header((d) => d.name)
        .body((d) => `Value: ${d.value}`),
    );

    const background = tooltipLayer.select(".sszvis-tooltip__background");
    expect(background.node()).not.toBeNull();
    // Which branch runs depends on the environment's SVG filter support, but the two are
    // exclusive: asserting "one or the other" alone could not fail.
    const used = [
      Boolean(background.select("path").attr("filter")),
      background.classed("sszvis-tooltip__background--fallback"),
    ].filter(Boolean);
    expect(used).toHaveLength(1);
  });

  describe("fitTooltip", () => {
    // `lo`/`hi` are a quarter and three quarters of the width, each capped 100px from its edge.
    test.for([
      { width: 400, fallback: "bottom", x: 200, where: "in the middle", expected: "bottom" },
      { width: 400, fallback: "bottom", x: 350, where: "near the right edge", expected: "right" },
      { width: 400, fallback: "bottom", x: 50, where: "near the left edge", expected: "left" },
      { width: 150, fallback: "top", x: 30, where: "near the left edge", expected: "left" },
      { width: 150, fallback: "top", x: 75, where: "in the middle", expected: "top" },
      { width: 150, fallback: "top", x: 120, where: "near the right edge", expected: "right" },
      { width: 800, fallback: "top", x: 80, where: "near the left edge", expected: "left" },
      { width: 800, fallback: "top", x: 400, where: "in the middle", expected: "top" },
      { width: 800, fallback: "top", x: 720, where: "near the right edge", expected: "right" },
    ] as const)(
      "should point the tip $expected when the anchor is $where of a $width wide chart",
      ({ width, fallback, x, expected }) => {
        const fitted = fitTooltip(fallback, { innerWidth: width });
        expect(fitted({ datum: {}, x, y: 100 })).toBe(expected);
      },
    );
  });
});
