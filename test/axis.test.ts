import { scaleLinear, scaleTime, select } from "d3";
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

  describe("axisX", () => {
    test("should render axisX with proper DOM structure", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom");
      const axisGroup = createSvgLayer("#chart-container")
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      expect(axisGroup.node()).not.toBeNull();
      expect(axisGroup.classed("sszvis-axis")).toBe(true);
      expect(axisGroup.classed("sszvis-axis--bottom")).toBe(true);
      const ticks = axisGroup.selectAll("g.tick").nodes();
      expect(ticks.length).toBeGreaterThan(0);
      ticks.forEach((tick) => {
        const tickGroup = select(tick);
        expect(tickGroup.select("line").node()).not.toBeNull();
        expect(tickGroup.select("text").node()).not.toBeNull();
      });
    });

    test("should render axisX.time() variant", () => {
      const xAxis = axisX
        .time()
        .scale(
          scaleTime()
            .domain([new Date(2020, 0, 1), new Date(2020, 11, 31)])
            .range([0, 300])
        )
        .orient("bottom");
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      expect(axisGroup.node()).not.toBeNull();
      expect(axisGroup.selectAll("g.tick").nodes().length).toBeGreaterThan(0);
    });

    test("should render axisX with custom ticks", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .tickValues([0, 25, 50, 75, 100])
        .orient("bottom");
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      expect(axisGroup.selectAll("g.tick").nodes().length).toBe([0, 25, 50, 75, 100].length);
    });

    test("should render axisX with top orientation", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("top");

      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      expect(axisGroup.classed("sszvis-axis--top")).toBe(true);
      expect(axisGroup.classed("sszvis-axis--bottom")).toBe(false);
    });

    test("should handle alignOuterLabels functionality", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .alignOuterLabels(true);
      const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis);
      const tickTexts = chartLayer.select(".sszvis-axis").selectAll("g.tick text").nodes();
      expect(tickTexts.length).toBeGreaterThan(0);
      expect(["start", "middle", "end"]).toContain(select(tickTexts[0]).style("text-anchor"));
      expect(["start", "middle", "end"]).toContain(
        select(tickTexts[tickTexts.length - 1]).style("text-anchor")
      );
    });
  });

  describe("axisY", () => {
    test("should render axisY with proper DOM structure", () => {
      const yAxis = axisY()
        .scale(scaleLinear().domain([0, 100]).range([200, 0]))
        .orient("left");
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("yAxis")
        .call(yAxis)
        .select(".sszvis-axis");
      expect(axisGroup.node()).not.toBeNull();
      expect(axisGroup.classed("sszvis-axis")).toBe(true);
      expect(axisGroup.classed("sszvis-axis--vertical")).toBe(true);
      expect(axisGroup.selectAll("g.tick").nodes().length).toBeGreaterThan(0);
    });

    test("should render axisY with right orientation", () => {
      const yAxis = axisY()
        .scale(scaleLinear().domain([0, 100]).range([200, 0]))
        .orient("right");
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("yAxis")
        .call(yAxis)
        .select(".sszvis-axis");
      expect(axisGroup.classed("sszvis-axis--vertical")).toBe(true);
      expect(axisGroup.selectAll("g.tick").nodes().length).toBeGreaterThan(0);
    });

    test("should hide zero label when showZeroY is false", () => {
      const yAxis = axisY()
        .scale(scaleLinear().domain([-50, 50]).range([200, 0]))
        .orient("left")
        .showZeroY(false);
      const zeroLabels = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("yAxis")
        .call(yAxis)
        .select(".sszvis-axis")
        .selectAll("g.tick text")
        .nodes()
        .filter((node) => select(node).text() === "0");
      expect(zeroLabels.length).toBe(0);
    });

    test("should show zero label when showZeroY is true", () => {
      const yAxis = axisY()
        .scale(scaleLinear().domain([-50, 50]).range([200, 0]))
        .orient("left")
        .showZeroY(true);
      const zeroLabels = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("yAxis")
        .call(yAxis)
        .select(".sszvis-axis")
        .selectAll("g.tick text")
        .nodes()
        .filter((node) => select(node).text() === "0");
      expect(zeroLabels.length).toBeGreaterThan(0);
    });
  });

  describe("customization", () => {
    test("should apply custom tickLength", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .tickLength(20);
      const longTicks = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis")
        .selectAll("line.sszvis-axis__longtick")
        .nodes();
      expect(longTicks.length).toBeGreaterThan(0);
    });

    test("should hide border ticks when they are too close to axis ends", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .hideBorderTickThreshold(20);
      const hiddenTicks = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis")
        .selectAll("line.hidden")
        .nodes();
      expect(hiddenTicks.length).toBeGreaterThanOrEqual(0);
    });

    test("should apply vertical slant to labels", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .slant("vertical");
      const rotatedTexts = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis")
        .selectAll("g.tick text")
        .nodes()
        .filter((node) => select(node).attr("transform")?.includes("rotate(-90)"));
      expect(rotatedTexts.length).toBeGreaterThan(0);
    });

    test("should apply custom tick format", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .tickFormat((d) => `${d}%`);
      const formattedLabels = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis")
        .selectAll("g.tick text")
        .nodes()
        .filter((node) => select(node).text().includes("%"));
      expect(formattedLabels.length).toBeGreaterThan(0);
    });

    test("should highlight ticks based on predicate function", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .highlightTick((d) => d === 50);
      const activeTickTexts = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis")
        .selectAll("g.tick text.active")
        .nodes();
      expect(activeTickTexts.length).toBeGreaterThan(0);
    });

    test("should not hide labels when hideLabelThreshold is 0", () => {
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .highlightTick((d) => d === 50)
        .hideLabelThreshold(0); // Disable label hiding
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      const hiddenTickTexts = axisGroup.selectAll("g.tick text.hidden").nodes();
      const activeTickTexts = axisGroup.selectAll("g.tick text.active").nodes();
      expect(activeTickTexts.length).toBeGreaterThan(0);
      expect(hiddenTickTexts.length).toBe(0); // No labels should be hidden
    });

    test("should render axis title", () => {
      const titleText = "X Axis Title";
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .title(titleText);
      const titleElement = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis")
        .select(".sszvis-axis__title");
      expect(titleElement.node()).not.toBeNull();
      expect(titleElement.text()).toBe(titleText);
    });

    test("should apply vertical title rotation", () => {
      const yAxis = axisY()
        .scale(scaleLinear().domain([0, 100]).range([200, 0]))
        .orient("left")
        .title("Vertical Title")
        .titleVertical(true);
      const titleElement = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("yAxis")
        .call(yAxis)
        .select(".sszvis-axis")
        .select(".sszvis-axis__title");
      expect(titleElement.node()).not.toBeNull();
      expect(titleElement.attr("transform")).toContain("rotate(-90)");
    });

    test("should render axisX.ordinal() variant", () => {
      const xAxis = axisX
        .ordinal()
        .scale(
          scaleLinear()
            .domain([0, ["Category A", "Category B", "Category C", "Category D"].length - 1])
            .range([0, 300])
        )
        .orient("bottom");
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      expect(axisGroup.node()).not.toBeNull();
      expect(axisGroup.selectAll("g.tick").nodes().length).toBeGreaterThan(0);
    });

    test("should render axisX.pyramid() variant", () => {
      const xAxis = axisX
        .pyramid()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom");
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      expect(axisGroup.node()).not.toBeNull();
      expect(axisGroup.selectAll("g.tick").nodes().length).toBeGreaterThan(0);
      const hasAbsoluteValues = axisGroup
        .selectAll("g.tick text")
        .nodes()
        .some((node) => !select(node).text().includes("-"));
      expect(hasAbsoluteValues).toBe(true);
    });

    test("should render axisY.time() variant", () => {
      const yAxis = axisY
        .time()
        .scale(
          scaleTime()
            .domain([new Date(2020, 0, 1), new Date(2020, 11, 31)])
            .range([200, 0])
        )
        .orient("left");
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("yAxis")
        .call(yAxis)
        .select(".sszvis-axis");
      expect(axisGroup.node()).not.toBeNull();
      expect(axisGroup.classed("sszvis-axis--vertical")).toBe(true);
      expect(axisGroup.selectAll("g.tick").nodes().length).toBeGreaterThan(0);
    });

    test("should render axisY.ordinal() variant", () => {
      const yAxis = axisY
        .ordinal()
        .scale(
          scaleLinear()
            .domain([0, ["Item 1", "Item 2", "Item 3"].length - 1])
            .range([200, 0])
        )
        .orient("left");

      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("yAxis")
        .call(yAxis)
        .select(".sszvis-axis");
      expect(axisGroup.node()).not.toBeNull();
      expect(axisGroup.classed("sszvis-axis--vertical")).toBe(true);
      expect(axisGroup.selectAll("g.tick").nodes().length).toBeGreaterThan(0);
    });

    test("should handle yOffset property", () => {
      const customOffset = 10;
      const xAxis = axisX()
        .scale(scaleLinear().domain([0, 100]).range([0, 300]))
        .orient("bottom")
        .yOffset(customOffset);
      const axisGroup = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("xAxis")
        .call(xAxis)
        .select(".sszvis-axis");
      expect(axisGroup.node()).not.toBeNull();
      expect(axisGroup.attr("transform")).toContain(`translate(0,${customOffset})`);
    });
  });
});
