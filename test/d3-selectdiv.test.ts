import { select } from "d3";
import { describe, expect, test } from "vitest";
import "../src/d3-selectdiv"; // Import to add prototype method

describe("selectDiv", () => {
  test("should add selectDiv method to d3 selection prototype", () => {
    const div = document.createElement("div");
    document.body.append(div);
    expect(typeof select(div).selectDiv).toBe("function");
  });

  test("should create div with data-d3-selectdiv attribute", () => {
    const container = document.createElement("div");
    document.body.append(container);
    select(container).selectDiv("test-key");
    expect(container?.querySelector('[data-d3-selectdiv="test-key"]')?.tagName).toBe("DIV");
  });

  test("should set position absolute style", () => {
    const container = document.createElement("div");
    document.body.append(container);
    select(container).selectDiv("positioned");
    expect(
      (container.querySelector('[data-d3-selectdiv="positioned"]') as HTMLDivElement).style.position
    ).toBe("absolute");
  });

  test("should be idempotent - not recreate existing div", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const selection = select(container);
    selection.selectDiv("same-key");
    const element1 = container.querySelector('[data-d3-selectdiv="same-key"]');
    selection.selectDiv("same-key");
    const element2 = container.querySelector('[data-d3-selectdiv="same-key"]');
    expect(element1).toBe(element2);
    expect(container.querySelectorAll('[data-d3-selectdiv="same-key"]')).toHaveLength(1);
  });

  test("should create different divs for different keys", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const selection = select(container);
    selection.selectDiv("key1");
    selection.selectDiv("key2");
    const div1 = container.querySelector('[data-d3-selectdiv="key1"]');
    const div2 = container.querySelector('[data-d3-selectdiv="key2"]');
    expect(div1).toBeTruthy();
    expect(div2).toBeTruthy();
    expect(div1).not.toBe(div2);
  });

  test("should bind data to created div", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const testData = { value: 42 };
    select(container).datum(testData).selectDiv("data-test");
    const divSelection = select(container.querySelector('[data-d3-selectdiv="data-test"]'));
    const boundData = divSelection.datum();
    expect(boundData).toEqual(testData);
  });

  test("should work with selection containing multiple elements", () => {
    const container1 = document.createElement("div");
    const container2 = document.createElement("div");
    container1.className = "container";
    container2.className = "container";
    document.body.append(container1, container2);
    select(document.body).selectAll(".container").data([1, 2]).selectDiv("multi-test");
    expect(container1.querySelector('[data-d3-selectdiv="multi-test"]')).toBeTruthy();
    expect(container2.querySelector('[data-d3-selectdiv="multi-test"]')).toBeTruthy();
  });
});
