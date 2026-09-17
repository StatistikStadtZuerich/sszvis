import { select } from "d3";
import { describe, expect, test } from "vitest";
import "../src/d3-selectdiv.js"; // Import to add prototype method

/**
 * The "adds selectDiv to the d3 prototype" test that used to open this file is gone: every
 * test below calls `select(...).selectDiv(...)` and so fails with a TypeError if the
 * prototype method is missing, which makes each of them a strictly stronger version of it.
 */
describe("selectDiv", () => {
  const container = () => {
    const div = document.createElement("div");
    document.body.append(div);
    return div;
  };

  const child = (parent: Element, key: string) =>
    parent.querySelector(`[data-d3-selectdiv="${key}"]`);

  test("should create a div keyed by the data-d3-selectdiv attribute other code selects on", () => {
    const parent = container();
    select(parent).selectDiv("test-key");
    expect(child(parent, "test-key")?.tagName).toBe("DIV");
  });

  test("should position the div absolutely, so it overlays rather than displaces the chart", () => {
    const parent = container();
    select(parent).selectDiv("positioned");
    expect((child(parent, "positioned") as HTMLDivElement).style.position).toBe("absolute");
  });

  test("should return the existing div rather than append a second when the key repeats", () => {
    // The behaviour the module exists for: a re-render must not accumulate layers.
    const parent = container();
    const selection = select(parent);
    selection.selectDiv("same-key");
    const first = child(parent, "same-key");
    selection.selectDiv("same-key");

    expect(child(parent, "same-key")).toBe(first);
    expect(parent.querySelectorAll('[data-d3-selectdiv="same-key"]')).toHaveLength(1);
  });

  test("should create a separate div for each distinct key", () => {
    const parent = container();
    const selection = select(parent);
    selection.selectDiv("key1");
    selection.selectDiv("key2");

    expect(child(parent, "key1")).toBeTruthy();
    expect(child(parent, "key2")).toBeTruthy();
    expect(child(parent, "key1")).not.toBe(child(parent, "key2"));
  });

  test("should bind the parent's datum to the div, which the components render from", () => {
    const parent = container();
    const testData = { value: 42 };
    select(parent).datum(testData).selectDiv("data-test");

    expect(select(child(parent, "data-test")).datum()).toEqual(testData);
  });

  test("should create one div per parent when the selection holds several", () => {
    const first = container();
    const second = container();
    first.className = "container";
    second.className = "container";

    select(document.body).selectAll(".container").data([1, 2]).selectDiv("multi-test");

    // Each parent gets exactly one, carrying that parent's own datum.
    for (const [parent, datum] of [
      [first, 1],
      [second, 2],
    ] as const) {
      expect(parent.querySelectorAll('[data-d3-selectdiv="multi-test"]')).toHaveLength(1);
      expect(select(child(parent, "multi-test")).datum()).toBe(datum);
    }
  });
});
