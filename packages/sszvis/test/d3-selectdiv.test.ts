import { select } from "d3";
import { describe, expect, test } from "vitest";
import { describesKeyedChild } from "./support/layerConformance.js";
import "../src/d3-selectdiv.js"; // Import to add prototype method

/**
 * The "adds selectDiv to the d3 prototype" test that used to open this file is gone: every
 * test below calls `select(...).selectDiv(...)` and so fails with a TypeError if the
 * prototype method is missing, which makes each of them a strictly stronger version of it.
 *
 * The five tests selectDiv and selectGroup stated identically now come from
 * support/layerConformance.ts, registered once here against selectDiv and once there against
 * selectGroup, so a regression in either module still fails only its own file.
 */
describe("selectDiv", () => {
  const container = () => {
    const div = document.createElement("div");
    document.body.append(div);
    return div;
  };

  describesKeyedChild({
    attribute: "data-d3-selectdiv",
    tagName: "DIV",
    makeParent: container,
    attach: (selection, key) => {
      selection.selectDiv(key);
    },
  });

  test("should position the div absolutely, so it overlays rather than displaces the chart", () => {
    const parent = container();
    select(parent).selectDiv("positioned");
    const div = parent.querySelector('[data-d3-selectdiv="positioned"]');
    expect((div as HTMLDivElement).style.position).toBe("absolute");
  });
});
