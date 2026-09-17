import type { AxisDomain } from "d3";
import { scaleBand, scaleLinear, scaleTime, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { axisX, axisY } from "../src/axis.js";
import { createSvgLayer } from "../src/createSvgLayer.js";
import "../src/d3-selectgroup.js";

describe("axis", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  /** Renders an axis into a fresh layer and returns the `.sszvis-axis` group it produced. */
  const render = (group: string, axis: unknown) =>
    createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup(group)
      .call(axis as never)
      .select(".sszvis-axis");

  const linear = () => scaleLinear().domain([0, 100]).range([0, 300]);
  const vertical = () => scaleLinear().domain([0, 100]).range([200, 0]);
  const times = () =>
    scaleTime()
      .domain([new Date(2020, 0, 1), new Date(2020, 11, 31)])
      .range([0, 300]);

  const labelsOf = (axisGroup: ReturnType<typeof render>) =>
    axisGroup
      .selectAll("g.tick text")
      .nodes()
      .map((node) => select(node).text());

  describe("axis variants", () => {
    // One table in place of seven near-identical "renders with proper DOM structure" tests.
    // Each of those asserted only that a node existed and that some tick was drawn, which a
    // gutted axis emitting one arbitrary tick would have satisfied. The shared assertions
    // below add the orientation modifier and require the labels to be distinct, so an axis
    // that stopped labelling its ticks, or labelled them all alike, now fails here.
    test.each([
      {
        variant: "axisX",
        group: "xAxis",
        makeAxis: () => axisX().scale(linear()).orient("bottom"),
        modifier: "sszvis-axis--bottom",
        mirrored: false,
      },
      {
        variant: "axisX oriented top",
        group: "xAxis",
        makeAxis: () => axisX().scale(linear()).orient("top"),
        modifier: "sszvis-axis--top",
        mirrored: false,
      },
      {
        variant: "axisX.time",
        group: "xAxis",
        makeAxis: () => axisX.time().scale(times()).orient("bottom"),
        modifier: "sszvis-axis--bottom",
        mirrored: false,
      },
      {
        variant: "axisX.ordinal",
        group: "xAxis",
        makeAxis: () => axisX.ordinal().scale(scaleBand().domain(["a", "b", "c"]).range([0, 300])),
        modifier: "sszvis-axis--bottom",
        mirrored: false,
      },
      {
        variant: "axisX.pyramid",
        group: "xAxis",
        makeAxis: () => axisX.pyramid().scale(linear()).orient("bottom"),
        modifier: "sszvis-axis--bottom",
        // A pyramid axis labels both halves with absolute values, so repeated labels are
        // the point of the variant rather than a defect.
        mirrored: true,
      },
      {
        variant: "axisY",
        group: "yAxis",
        makeAxis: () => axisY().scale(vertical()).orient("left"),
        modifier: "sszvis-axis--vertical",
        mirrored: false,
      },
      {
        variant: "axisY oriented right",
        group: "yAxis",
        makeAxis: () => axisY().scale(vertical()).orient("right"),
        modifier: "sszvis-axis--vertical",
        mirrored: false,
      },
      {
        variant: "axisY.time",
        group: "yAxis",
        makeAxis: () =>
          axisY
            .time()
            .scale(
              scaleTime()
                .domain([new Date(2020, 0, 1), new Date(2020, 11, 31)])
                .range([200, 0]),
            )
            .orient("left"),
        modifier: "sszvis-axis--vertical",
        mirrored: false,
      },
      {
        variant: "axisY.ordinal",
        group: "yAxis",
        makeAxis: () =>
          axisY
            .ordinal()
            .scale(scaleBand().domain(["a", "b", "c"]).range([200, 0]))
            .orient("left"),
        modifier: "sszvis-axis--vertical",
        mirrored: false,
      },
    ])(
      "should draw labelled ticks carrying the $modifier class when rendering $variant",
      ({ group, makeAxis, modifier, mirrored }) => {
        const axisGroup = render(group, makeAxis());

        expect(axisGroup.classed("sszvis-axis")).toBe(true);
        expect(axisGroup.classed(modifier)).toBe(true);

        const ticks = axisGroup.selectAll("g.tick").nodes();
        expect(ticks.length).toBeGreaterThan(0);
        for (const tick of ticks) {
          expect(select(tick).select("line").node()).not.toBeNull();
        }

        // Blanks are allowed because a y axis suppresses its zero label unless showZeroY
        // is set, which the showZeroY tests below cover directly.
        const labels = labelsOf(axisGroup).filter((text) => text !== "");
        expect(labels.length).toBeGreaterThan(1);
        if (!mirrored) expect(new Set(labels).size).toBe(labels.length);
      },
    );

    test("should mark a top-oriented axis as top and not as bottom", () => {
      // The modifiers are mutually exclusive, which the table above cannot state because it
      // only ever checks the modifier a variant is expected to carry.
      const axisGroup = render("xAxis", axisX().scale(linear()).orient("top"));
      expect(axisGroup.classed("sszvis-axis--top")).toBe(true);
      expect(axisGroup.classed("sszvis-axis--bottom")).toBe(false);
    });

    test("should label a pyramid axis with absolute values, so the mirrored half reads positive", () => {
      const axisGroup = render("xAxis", axisX.pyramid().scale(linear()).orient("bottom"));
      expect(labelsOf(axisGroup).some((text) => !text.includes("-"))).toBe(true);
    });
  });

  describe("ticks", () => {
    test("should render exactly the given tick values when tickValues is set", () => {
      const values = [0, 25, 50, 75, 100];
      const axisGroup = render(
        "xAxis",
        axisX().scale(linear()).tickValues(values).orient("bottom"),
      );
      expect(axisGroup.selectAll("g.tick").nodes()).toHaveLength(values.length);
    });

    test("should suppress the zero label when showZeroY is false", () => {
      const axisGroup = render(
        "yAxis",
        axisY()
          .scale(scaleLinear().domain([-50, 50]).range([200, 0]))
          .orient("left")
          .showZeroY(false),
      );
      expect(labelsOf(axisGroup).filter((text) => text === "0")).toHaveLength(0);
    });

    test("should keep the zero label when showZeroY is true", () => {
      const axisGroup = render(
        "yAxis",
        axisY()
          .scale(scaleLinear().domain([-50, 50]).range([200, 0]))
          .orient("left")
          .showZeroY(true),
      );
      expect(labelsOf(axisGroup).filter((text) => text === "0").length).toBeGreaterThan(0);
    });
  });

  describe("customization", () => {
    test("should draw a long tick rule on the interior ticks but not at the domain ends when tickLength is set", () => {
      const axisGroup = render("xAxis", axisX().scale(linear()).orient("bottom").tickLength(20));
      // Tightened from "at least one long tick exists", which said nothing about which ticks
      // get a rule. The two ticks at the ends of the domain are deliberately skipped, so the
      // axis line itself is not doubled up.
      const withRule = axisGroup
        .selectAll("g.tick")
        .nodes()
        .filter((tick) => select(tick).select("line.sszvis-axis__longtick").node() !== null)
        .map((tick) => select(tick).select("text").text());

      expect(withRule).toEqual(labelsOf(axisGroup).slice(1, -1));
      expect(withRule.length).toBeGreaterThan(0);
    });

    test("should rotate every label when slant is vertical", () => {
      const axisGroup = render("xAxis", axisX().scale(linear()).orient("bottom").slant("vertical"));
      const texts = axisGroup.selectAll("g.tick text").nodes();
      const rotated = texts.filter((node) =>
        select(node).attr("transform")?.includes("rotate(-90)"),
      );
      expect(rotated).toHaveLength(texts.length);
    });

    test("should format every label when a custom tickFormat is given", () => {
      const axisGroup = render(
        "xAxis",
        axisX()
          .scale(linear())
          .orient("bottom")
          .tickFormat((d) => `${d}%`),
      );
      const labels = labelsOf(axisGroup);
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.every((text) => text.endsWith("%"))).toBe(true);
    });

    test.each([
      [
        "a string",
        "" as unknown as (d: AxisDomain) => string,
        /axis: tickFormat must be a function .*, got string/,
      ],
      // null is d3's reset idiom, so the message names it rather than reporting "object".
      ["null", null as unknown as (d: AxisDomain) => string, /got null/],
    ])("should name the offending type when tickFormat is given %s", (_label, format, message) => {
      const xAxis = axisX().scale(linear()).orient("bottom").tickFormat(format);
      expect(() =>
        createSvgLayer("#chart-container", undefined, { key: "test-layer" })
          .selectGroup("xAxis")
          .call(xAxis),
      ).toThrow(message);
    });

    test("should write an empty label where tickFormat returns nothing", () => {
      const axisGroup = render(
        "xAxis",
        axisX()
          .scale(linear())
          .orient("bottom")
          .tickFormat(() => null),
      );
      const labels = labelsOf(axisGroup);
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.every((text) => text === "")).toBe(true);
    });

    test("should mark only the matching tick active when highlightTick selects one value", () => {
      const axisGroup = render(
        "xAxis",
        axisX()
          .scale(linear())
          .orient("bottom")
          .highlightTick((d) => d === 50),
      );
      // Tightened from "at least one active": the predicate matches a single value, so more
      // than one active label would be wrong and the old assertion could not tell.
      const active = axisGroup.selectAll("g.tick text.active").nodes();
      expect(active).toHaveLength(1);
      expect(select(active[0]).text()).toBe("50");
    });

    test("should hide no labels when hideLabelThreshold is 0", () => {
      const axisGroup = render(
        "xAxis",
        axisX()
          .scale(linear())
          .orient("bottom")
          .highlightTick((d) => d === 50)
          .hideLabelThreshold(0),
      );
      expect(axisGroup.selectAll("g.tick text.active").nodes().length).toBeGreaterThan(0);
      expect(axisGroup.selectAll("g.tick text.hidden").nodes()).toHaveLength(0);
    });

    test("should offset the axis group vertically when yOffset is set", () => {
      const axisGroup = render("xAxis", axisX().scale(linear()).orient("bottom").yOffset(10));
      expect(axisGroup.attr("transform")).toContain("translate(0,10)");
    });
  });

  describe("axis title", () => {
    test.each([
      ["a string", "X Axis Title", "X Axis Title"],
      ["a function, which is called rather than stringified", () => "Jahr", "Jahr"],
    ])("should render the title when it is given as %s", (_label, title, expected) => {
      const axisGroup = render(
        "xAxis",
        axisX()
          .scale(linear())
          .orient("bottom")
          .title(title as string),
      );
      expect(axisGroup.select(".sszvis-axis__title").text()).toBe(expected);
    });

    test("should rotate the title when titleVertical is set", () => {
      const axisGroup = render(
        "yAxis",
        axisY().scale(vertical()).orient("left").title("Vertical Title").titleVertical(true),
      );
      expect(axisGroup.select(".sszvis-axis__title").attr("transform")).toContain("rotate(-90)");
    });
  });

  describe("ordinal tick selection", () => {
    test("should render the single value when a one-element domain is asked for one tick", () => {
      const axisGroup = render(
        "xAxis",
        axisX
          .ordinal()
          .scale(scaleBand().domain(["2020"]).range([0, 100]))
          .ticks(1),
      );
      expect(axisGroup.selectAll("g.tick").nodes()).toHaveLength(1);
    });

    test("should keep the first and last value when a multi-element domain is thinned", () => {
      const axisGroup = render(
        "xAxis",
        axisX
          .ordinal()
          .scale(scaleBand().domain(["2020", "2021", "2022", "2023"]).range([0, 400]))
          .ticks(2),
      );
      const labels = labelsOf(axisGroup);
      expect(labels[0]).toBe("2020");
      expect(labels.at(-1)).toBe("2023");
    });

    test("should render one tick per category when more ticks are requested than the domain holds", () => {
      const axisGroup = render(
        "xAxis",
        axisX
          .ordinal()
          .scale(scaleBand().domain(["2020", "2021", "2022"]).range([0, 300]))
          .ticks(10),
      );
      expect(labelsOf(axisGroup)).toEqual(["2020", "2021", "2022"]);
    });

    test("should skip a last domain value that is genuinely undefined", () => {
      // NOTE: a domain hole is not expressible through scaleBand's own types, but it is
      // exactly the case the undefined guard in setOrdinalTicks was written for.
      const domain = ["2020", "2021", undefined] as unknown as string[];
      const xAxis = axisX
        .ordinal()
        .scale(scaleBand().domain(domain).range([0, 300]))
        .ticks(2);
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      const labels = axisGroup
        .selectAll("g.tick text")
        .nodes()
        .map((n) => (n as SVGTextElement).textContent);
      expect(labels).not.toContain("undefined");
    });
  });
});
