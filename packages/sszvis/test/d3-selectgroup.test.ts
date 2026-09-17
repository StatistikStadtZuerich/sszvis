import { select } from "d3";
import { describe, expect, test } from "vitest";
import { describesKeyedChild } from "./support/layerConformance.js";
import "../src/d3-selectgroup.js"; // Import to add prototype method

/**
 * As in d3-selectdiv.test.ts, the "adds selectGroup to the d3 prototype" opener is gone:
 * every test below calls the method and so fails with a TypeError if it is missing, and the
 * five tests both plugins stated identically come from support/layerConformance.ts,
 * registered here against selectGroup.
 */
describe("selectGroup", () => {
  const svgContainer = () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    return svg;
  };

  describesKeyedChild({
    attribute: "data-d3-selectgroup",
    tagName: "g",
    makeParent: svgContainer,
    attach: (selection, key) => {
      selection.selectGroup(key);
    },
  });

  test("should return a real d3 selection, so marks can be appended straight into the group", () => {
    const svg = svgContainer();
    select(svg).selectGroup("main").append("circle").attr("r", 5);
    const group = svg.querySelector('[data-d3-selectgroup="main"]');
    expect(group?.querySelector("circle")?.getAttribute("r")).toBe("5");
  });
});
