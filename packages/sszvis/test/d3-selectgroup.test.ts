import { select } from "d3";
import { describe, expect, test } from "vitest";
import "../src/d3-selectgroup.js"; // Import to add prototype method

/**
 * As in d3-selectdiv.test.ts, the "adds selectGroup to the d3 prototype" opener is gone:
 * every test below calls the method and so fails with a TypeError if it is missing.
 */
describe("selectGroup", () => {
  const svgContainer = () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    return svg;
  };

  const child = (parent: Element, key: string) =>
    parent.querySelector(`[data-d3-selectgroup="${key}"]`);

  test("should create a g keyed by the data-d3-selectgroup attribute other code selects on", () => {
    const svg = svgContainer();
    select(svg).selectGroup("test-group");
    expect(child(svg, "test-group")?.tagName).toBe("g");
  });

  test("should return the existing group rather than append a second when the key repeats", () => {
    const svg = svgContainer();
    const selection = select(svg);
    selection.selectGroup("same-group");
    const first = child(svg, "same-group");
    selection.selectGroup("same-group");

    expect(child(svg, "same-group")).toBe(first);
    expect(svg.querySelectorAll('[data-d3-selectgroup="same-group"]')).toHaveLength(1);
  });

  test("should create a separate group for each distinct key", () => {
    const svg = svgContainer();
    const selection = select(svg);
    selection.selectGroup("group1");
    selection.selectGroup("group2");

    expect(child(svg, "group1")).toBeTruthy();
    expect(child(svg, "group2")).toBeTruthy();
    expect(child(svg, "group1")).not.toBe(child(svg, "group2"));
  });

  test("should bind the parent's datum to the group, which the components render from", () => {
    const svg = svgContainer();
    const testData = { name: "test-group" };
    select(svg).datum(testData).selectGroup("data-group");

    expect(select(child(svg, "data-group")).datum()).toEqual(testData);
  });

  test("should create one group per parent when the selection holds several", () => {
    const first = svgContainer();
    const second = svgContainer();
    first.setAttribute("class", "chart");
    second.setAttribute("class", "chart");

    select(document.body).selectAll(".chart").data([1, 2]).selectGroup("chart-group");

    for (const [parent, datum] of [
      [first, 1],
      [second, 2],
    ] as const) {
      expect(parent.querySelectorAll('[data-d3-selectgroup="chart-group"]')).toHaveLength(1);
      expect(select(child(parent, "chart-group")).datum()).toBe(datum);
    }
  });

  test("should return a real d3 selection, so marks can be appended straight into the group", () => {
    const svg = svgContainer();
    select(svg).selectGroup("main").append("circle").attr("r", 5);
    expect(child(svg, "main")?.querySelector("circle")?.getAttribute("r")).toBe("5");
  });
});
