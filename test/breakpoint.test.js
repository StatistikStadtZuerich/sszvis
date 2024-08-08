import { responsiveProps } from "../src/responsiveProps.js";
import { expect, test, describe } from "vitest";

describe("queryProps", () => {
  const queryProps = responsiveProps()
    .breakpoints([
      { name: "small", width: 10 },
      { name: "medium", width: 20 },
    ])
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

function mkDimensions(width) {
  return { width, screenWidth: 400, screenHeight: 300 };
}
