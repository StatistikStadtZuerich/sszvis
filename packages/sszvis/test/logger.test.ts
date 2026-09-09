import { afterEach, describe, expect, test, vi } from "vitest";
import { error, log, warn } from "../src/logger.js";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("forwards a message and its cause as a single console entry", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const cause = new Error("network down");

    error("could not load the data", cause);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("could not load the data", cause);
  });

  test("forwards every argument of the documented multi-argument call", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    log("Circle coordinates: ", 10, 20, 5);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("Circle coordinates: ", 10, 20, 5);
  });

  test("routes each level to its own console method", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    warn("incompatible options", 1, 2);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith("incompatible options", 1, 2);
  });

  // NOTE: an argument-less call now reaches the console as an empty entry, where the
  // former per-argument loop emitted nothing at all. Pass-through is the documented shape.
  test("still calls through when given no arguments", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    log();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith();
  });
});
