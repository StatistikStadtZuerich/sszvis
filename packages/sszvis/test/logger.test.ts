import { afterEach, describe, expect, test, vi } from "vitest";
import { error, log, warn } from "../src/logger.js";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should reach the console as a single entry when given a message and its cause", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const cause = new Error("network down");

    error("could not load the data", cause);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("could not load the data", cause);
  });

  test.each<["log" | "warn" | "error", (...args: unknown[]) => void, unknown[]]>([
    ["log", log, ["Circle coordinates: ", 10, 20, 5]],
    ["warn", warn, ["incompatible options", 1, 2]],
    ["error", error, ["could not render", { chart: "bar" }]],
  ])(
    "should forward every argument to console.%s when called through that level",
    (method, logger, args) => {
      const spy = vi.spyOn(console, method).mockImplementation(() => undefined);

      logger(...args);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(...args);
    },
  );

  // NOTE: an argument-less call now reaches the console as an empty entry, where the
  // former per-argument loop emitted nothing at all. Pass-through is the documented shape.
  test("still calls through when given no arguments", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    log();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith();
  });
});
