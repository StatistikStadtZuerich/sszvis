import { describe, expect, test } from "vitest";
import { responsiveProps } from "../src/responsiveProps";

describe("queryProps", () => {
  const queryProps = responsiveProps()
    .breakpoints([{ name: "small", width: 10 } as any, { name: "medium", width: 20 } as any])
    .prop("example", {
      small: "A",
      medium: "B",
      _: "C",
    });

  test.each([
    [0, "A"],
    [10, "A"],
    [11, "B"],
    [20, "B"],
    [21, "C"],
  ])("%s -> %s", (width, output) => {
    expect(queryProps(mkDimensions(width)).example).toBe(output);
  });
});

// -----------------------------------------------------------------------------

function mkDimensions(width: number) {
  return { width, screenWidth: 400, screenHeight: 300 };
}
