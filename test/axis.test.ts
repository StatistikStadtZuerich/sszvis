import { describe, expect, test } from "vitest";
import { axisX, axisY } from "../src/axis";

describe("axis", () => {
  test("smoke test for axis X", () => {
    const axisInstance = axisX();
    expect(axisInstance.orient()).toBe("bottom");
    expect(axisInstance.alignOuterLabels()).toBe(false);
    expect(axisInstance.hideBorderTickThreshold()).toBe(8);
    expect(axisInstance.vertical()).toBe(false);
  });

  test("smoke test for axis Y", () => {
    const axisInstance = axisY();
    expect(axisInstance.orient()).toBe("bottom");
    expect(axisInstance.alignOuterLabels()).toBe(false);
    expect(axisInstance.hideBorderTickThreshold()).toBe(8);
    expect(axisInstance.vertical()).toBe(true);
  });
});
