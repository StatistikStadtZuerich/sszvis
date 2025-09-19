import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import circle from "../../src/annotation/circle";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

type TestDatum = {
  x: number;
  y: number;
  r: number;
  caption?: string;
};

type ComplexTestDatum = {
  position: { x: number; y: number };
  radius: number;
  label: string;
  offset: { dx: number; dy: number };
};

describe("annotation/circle", () => {
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

  const testData: TestDatum[] = [
    { x: 100, y: 150, r: 30 },
    { x: 200, y: 100, r: 25 },
    { x: 300, y: 200, r: 40 },
  ];

  const testDataWithCaptions: TestDatum[] = [
    { x: 100, y: 150, r: 30, caption: "Area A" },
    { x: 200, y: 100, r: 25, caption: "Area B" },
  ];

  test("should render circle annotation with proper DOM structure", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum(testData)
      .call(circleComponent);
    const circles = chartLayer.selectAll("circle.sszvis-dataareacircle").nodes();
    expect(circles.length).toBe(3);
    circles.forEach((circle) => {
      expect(select(circle).classed("sszvis-dataareacircle")).toBe(true);
    });
    expect(chartLayer.select("defs").node()).not.toBeNull();
    expect(chartLayer.select("pattern#data-area-pattern").node()).not.toBeNull();
  });

  test("should position circles correctly using accessor functions", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum(testData)
      .call(circleComponent);
    const circles = chartLayer.selectAll("circle.sszvis-dataareacircle").nodes();
    const firstCircle = select(circles[0]);
    expect(Number(firstCircle.attr("cx"))).toBe(100);
    expect(Number(firstCircle.attr("cy"))).toBe(150);
    expect(Number(firstCircle.attr("r"))).toBe(30);
    const secondCircle = select(circles[1]);
    expect(Number(secondCircle.attr("cx"))).toBe(200);
    expect(Number(secondCircle.attr("cy"))).toBe(100);
    expect(Number(secondCircle.attr("r"))).toBe(25);
    const thirdCircle = select(circles[2]);
    expect(Number(thirdCircle.attr("cx"))).toBe(300);
    expect(Number(thirdCircle.attr("cy"))).toBe(200);
    expect(Number(thirdCircle.attr("r"))).toBe(40);
  });

  test("should apply data area pattern fill to circles", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum(testData)
      .call(circleComponent);
    chartLayer
      .selectAll("circle.sszvis-dataareacircle")
      .nodes()
      .forEach((circle) => {
        expect(select(circle).attr("fill")).toBe("url(#data-area-pattern)");
      });
  });

  test("should render captions when caption accessor is provided", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r)
      .caption((d) => d.caption || "");
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum(testDataWithCaptions)
      .call(circleComponent);
    const captions = chartLayer.selectAll("text.sszvis-dataareacircle__caption").nodes();
    expect(captions.length).toBe(2);
    const firstCaption = select(captions[0]);
    expect(Number(firstCaption.attr("x"))).toBe(100);
    expect(Number(firstCaption.attr("y"))).toBe(150);
    expect(firstCaption.text()).toBe("Area A");
    const secondCaption = select(captions[1]);
    expect(Number(secondCaption.attr("x"))).toBe(200);
    expect(Number(secondCaption.attr("y"))).toBe(100);
    expect(secondCaption.text()).toBe("Area B");
    captions.forEach((caption) => {
      expect(select(caption).classed("sszvis-dataareacircle__caption")).toBe(true);
    });
  });

  test("should not render captions when caption accessor is not provided", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum(testDataWithCaptions)
      .call(circleComponent);
    expect(chartLayer.selectAll("text.sszvis-dataareacircle__caption").nodes().length).toBe(0);
  });

  test("should offset captions using dx and dy properties", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r)
      .caption((d) => d.caption || "")
      .dx(() => 15)
      .dy(() => -10);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum(testDataWithCaptions)
      .call(circleComponent);
    chartLayer
      .selectAll("text.sszvis-dataareacircle__caption")
      .nodes()
      .forEach((caption) => {
        const captionSelection = select(caption);
        expect(Number(captionSelection.attr("dx"))).toBe(15);
        expect(Number(captionSelection.attr("dy"))).toBe(-10);
      });
  });

  test("should work with constant values instead of accessor functions", () => {
    const circleComponent = circle().x(150).y(125).r(35).caption("Fixed Circle");
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum([{}])
      .call(circleComponent);

    const circles = chartLayer.selectAll("circle.sszvis-dataareacircle").nodes();
    expect(circles.length).toBe(1);
    const circleElement = select(circles[0]);
    expect(Number(circleElement.attr("cx"))).toBe(150);
    expect(Number(circleElement.attr("cy"))).toBe(125);
    expect(Number(circleElement.attr("r"))).toBe(35);
    const captions = chartLayer.selectAll("text.sszvis-dataareacircle__caption").nodes();
    expect(captions.length).toBe(1);
    expect(select(captions[0]).text()).toBe("Fixed Circle");
  });

  test("should work with complex data structures and custom accessor functions", () => {
    const complexTestData: ComplexTestDatum[] = [
      {
        position: { x: 80, y: 120 },
        radius: 20,
        label: "Complex Area 1",
        offset: { dx: 10, dy: 5 },
      },
      {
        position: { x: 180, y: 80 },
        radius: 35,
        label: "Complex Area 2",
        offset: { dx: -15, dy: 8 },
      },
    ];
    const circleComponent = circle<ComplexTestDatum>()
      .x((d) => d.position.x)
      .y((d) => d.position.y)
      .r((d) => d.radius)
      .caption((d) => d.label)
      .dx((d) => d.offset.dx)
      .dy((d) => d.offset.dy);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum(complexTestData)
      .call(circleComponent);
    const circles = chartLayer.selectAll("circle.sszvis-dataareacircle").nodes();
    expect(circles.length).toBe(2);
    const firstCircle = select(circles[0]);
    expect(Number(firstCircle.attr("cx"))).toBe(80);
    expect(Number(firstCircle.attr("cy"))).toBe(120);
    expect(Number(firstCircle.attr("r"))).toBe(20);
    const captions = chartLayer.selectAll("text.sszvis-dataareacircle__caption").nodes();
    expect(captions.length).toBe(2);
    const firstCaption = select(captions[0]);
    expect(Number(firstCaption.attr("x"))).toBe(80);
    expect(Number(firstCaption.attr("y"))).toBe(120);
    expect(Number(firstCaption.attr("dx"))).toBe(10);
    expect(Number(firstCaption.attr("dy"))).toBe(5);
    expect(firstCaption.text()).toBe("Complex Area 1");
    const secondCaption = select(captions[1]);
    expect(Number(secondCaption.attr("dx"))).toBe(-15);
    expect(Number(secondCaption.attr("dy"))).toBe(8);
    expect(secondCaption.text()).toBe("Complex Area 2");
  });

  test("should handle empty data array", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("circles")
      .datum([])
      .call(circleComponent);
    expect(chartLayer.selectAll("circle.sszvis-dataareacircle").nodes().length).toBe(0);
    expect(chartLayer.selectAll("text.sszvis-dataareacircle__caption").nodes().length).toBe(0);
  });

  test("should handle data updates correctly", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r);
    const chartLayer = createSvgLayer("#chart-container", undefined, {
      key: "test-layer",
    }).selectGroup("circles");
    chartLayer.datum(testData.slice(0, 2)).call(circleComponent);
    let circles = chartLayer.selectAll("circle.sszvis-dataareacircle").nodes();
    expect(circles.length).toBe(2);
    // Update with 3 circles
    chartLayer.datum(testData).call(circleComponent);
    circles = chartLayer.selectAll("circle.sszvis-dataareacircle").nodes();
    expect(circles.length).toBe(3);
    // Update with 1 circle
    chartLayer.datum(testData.slice(0, 1)).call(circleComponent);
    circles = chartLayer.selectAll("circle.sszvis-dataareacircle").nodes();
    expect(circles.length).toBe(1);
  });
});
