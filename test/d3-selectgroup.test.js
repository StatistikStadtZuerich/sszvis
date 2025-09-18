import "../src/d3-selectgroup.js"; // Import to add prototype method
import { expect, test, describe } from "vitest";
import { select } from "d3";

describe("selectGroup", () => {
  test("should add selectGroup method to d3 selection prototype", () => {
    // Create SVG context for groups
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    expect(typeof select(svg).selectGroup).toBe("function");
  });

  test("should create g element with data-d3-selectgroup attribute", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    select(svg).selectGroup("test-group");
    expect(svg.querySelector('[data-d3-selectgroup="test-group"]').tagName).toBe("g");
  });

  test("should be idempotent - not recreate existing group", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    const selection = select(svg);
    selection.selectGroup("same-group");
    const element1 = svg.querySelector('[data-d3-selectgroup="same-group"]');
    selection.selectGroup("same-group");
    const element2 = svg.querySelector('[data-d3-selectgroup="same-group"]');
    expect(element1).toBe(element2);
    expect(svg.querySelectorAll('[data-d3-selectgroup="same-group"]')).toHaveLength(1);
  });

  test("should create different groups for different keys", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    const selection = select(svg);
    selection.selectGroup("group1");
    selection.selectGroup("group2");
    const group1 = svg.querySelector('[data-d3-selectgroup="group1"]');
    const group2 = svg.querySelector('[data-d3-selectgroup="group2"]');
    expect(group1).toBeTruthy();
    expect(group2).toBeTruthy();
    expect(group1).not.toBe(group2);
  });

  test("should bind data to created group", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    const testData = { name: "test-group" };
    select(svg).datum(testData).selectGroup("data-group");
    const groupSelection = select(svg.querySelector('[data-d3-selectgroup="data-group"]'));
    const boundData = groupSelection.datum();
    expect(boundData).toEqual(testData);
  });

  test("should work in SVG context with multiple parent elements", () => {
    const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svg2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg1.setAttribute("class", "chart");
    svg2.setAttribute("class", "chart");
    document.body.append(svg1, svg2);
    select(document.body).selectAll(".chart").data([1, 2]).selectGroup("chart-group");
    expect(svg1.querySelector('[data-d3-selectgroup="chart-group"]')).toBeTruthy();
    expect(svg2.querySelector('[data-d3-selectgroup="chart-group"]')).toBeTruthy();
  });

  test("should allow chaining with other SVG operations", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    select(svg).selectGroup("main").append("circle").attr("r", 5);
    const circle = svg.querySelector('[data-d3-selectgroup="main"]').querySelector("circle");
    expect(circle.getAttribute("r")).toBe("5");
  });
});
