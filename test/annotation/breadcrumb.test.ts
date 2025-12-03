import { afterEach, assert, beforeEach, describe, expect, test, vi } from "vitest";
import breadcrumb, { createBreadcrumbItems } from "../../src/annotation/breadcrumb";
import { createHtmlLayer } from "../../src/createHtmlLayer";
import "../../src/d3-selectdiv";
import { prepareHierarchyData } from "../../src/layout/hierarchy";

describe("annotation/breadcrumb", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "800px";
    container.style.height = "600px";
    container.style.position = "relative";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  // Helper to create mock hierarchy data using the actual prepareHierarchyData
  function createMockHierarchy() {
    const data = [
      { category: "Category A", subcategory: "Sub A1", value: 100 },
      { category: "Category A", subcategory: "Sub A2", value: 150 },
      { category: "Category B", subcategory: "Sub B1", value: 200 },
    ];

    return prepareHierarchyData<(typeof data)[0]>()
      .layer((d) => d.category)
      .layer((d) => d.subcategory)
      .value((d) => d.value)
      .calculate(data);
  }

  describe("createBreadcrumbItems helper", () => {
    test("should return empty array for null node", () => {
      const items = createBreadcrumbItems(null);
      expect(items).toEqual([]);
    });

    test("should create breadcrumb items from hierarchy node", () => {
      const root = createMockHierarchy();
      const categoryA = root.children?.[0];
      const subA1 = categoryA?.children?.[0];
      assert(subA1);
      const items = createBreadcrumbItems(subA1);
      expect(items.length).toBe(2);
      expect(items[0].label).toBe("Category A");
      expect(items[0].node).toBe(categoryA);
      expect(items[1].label).toBe("Sub A1");
      expect(items[1].node).toBe(subA1);
    });

    test("should handle single-level depth", () => {
      const categoryA = createMockHierarchy().children?.[0];
      assert(categoryA);
      const items = createBreadcrumbItems(categoryA);
      expect(items.length).toBe(1);
      expect(items[0].label).toBe("Category A");
      expect(items[0].node).toBe(categoryA);
    });
  });

  describe("breadcrumb component", () => {
    test("should render breadcrumb container with proper structure", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([
            { label: "Category", node: null },
            { label: "Subcategory", node: null },
          ])
          .width(600)
      );
      const breadcrumbContainer = container.querySelector('[data-d3-selectdiv="breadcrumbs"]');
      expect(breadcrumbContainer).not.toBeNull();
      expect(breadcrumbContainer?.getAttribute("style")).toContain("display: flex");
    });

    test("should always render root label as first item", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([{ label: "Category", node: null }])
          .rootLabel("Home")
      );
      const breadcrumbItems = container.querySelectorAll(".sszvis-breadcrumb-item");
      expect(breadcrumbItems.length).toBe(2); // Root + Category
      const firstLink = breadcrumbItems[0].querySelector("a");
      expect(firstLink?.textContent).toBe("Home");
    });

    test("should render correct number of breadcrumb items", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([
            { label: "Level 1", node: null },
            { label: "Level 2", node: null },
            { label: "Level 3", node: null },
          ])
      );
      const breadcrumbItems = container.querySelectorAll(".sszvis-breadcrumb-item");
      expect(breadcrumbItems.length).toBe(4); // Root + 3 items
    });

    test("should apply bold styling to last item", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([
            { label: "Category", node: null },
            { label: "Current", node: null },
          ])
      );
      const links = container.querySelectorAll<HTMLAnchorElement>(".sszvis-breadcrumb-item a");
      const lastLink = links[links.length - 1];
      expect(lastLink.style.fontWeight).toBe("bold");
      expect(lastLink.style.color).toBe("rgb(51, 51, 51)"); // #333
    });

    test("should apply link styling to non-last items", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([
            { label: "Category", node: null },
            { label: "Current", node: null },
          ])
      );
      const links = container.querySelectorAll<HTMLAnchorElement>(".sszvis-breadcrumb-item a");
      const firstLink = links[0];
      expect(firstLink.style.fontWeight).toBe("normal");
      expect(firstLink.style.color).toBe("rgb(0, 115, 179)"); // #0073B3
      expect(firstLink.style.cursor).toBe("pointer");
    });

    test("should hide separator on last item", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([
            { label: "Category", node: null },
            { label: "Current", node: null },
          ])
      );
      const separators = container.querySelectorAll<HTMLSpanElement>(
        ".sszvis-breadcrumb-separator"
      );
      const lastSeparator = separators[separators.length - 1];
      expect(lastSeparator.style.display).toBe("none");
    });

    test("should show separators on non-last items", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([
            { label: "Category", node: null },
            { label: "Current", node: null },
          ])
      );
      const separators = container.querySelectorAll<HTMLSpanElement>(
        ".sszvis-breadcrumb-separator"
      );
      expect(separators[0].style.display).not.toBe("none");
    });

    test("should call onClick handler when clicking non-last item", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      const onClickMock = vi.fn();
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([
            { label: "Category", node: null },
            { label: "Current", node: null },
          ])
          .onClick(onClickMock)
      );

      const links = container.querySelectorAll<HTMLAnchorElement>(".sszvis-breadcrumb-item a");

      links[0].click();

      expect(onClickMock).toHaveBeenCalledTimes(1);
      expect(onClickMock).toHaveBeenCalledWith(
        expect.objectContaining({ label: "Root", node: null }),
        0
      );
    });

    test("should not call onClick handler when clicking last item", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      const onClickMock = vi.fn();
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([
            { label: "Category", node: null },
            { label: "Current", node: null },
          ])
          .onClick(onClickMock)
      );
      const links = container.querySelectorAll<HTMLAnchorElement>(".sszvis-breadcrumb-item a");
      links[links.length - 1].click();
      expect(onClickMock).not.toHaveBeenCalled();
    });

    test("should use custom separator", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([{ label: "Category", node: null }])
          .separator(" / ")
      );
      expect(container.querySelectorAll(".sszvis-breadcrumb-separator")[0].textContent).toBe(" / ");
    });

    test("should use custom label accessor", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      htmlLayer.call(
        breadcrumb()
          .renderInto(htmlLayer)
          .items([{ label: "category", node: null }])
          .label((d) => d.label.toUpperCase())
      );
      expect(container.querySelectorAll(".sszvis-breadcrumb-item a")[1].textContent).toBe(
        "CATEGORY"
      );
    });

    test("should update correctly when items change", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      // First render
      const breadcrumbNav = breadcrumb()
        .renderInto(htmlLayer)
        .items([{ label: "Level 1", node: null }]);
      htmlLayer.call(breadcrumbNav);
      let breadcrumbItems = container.querySelectorAll(".sszvis-breadcrumb-item");
      expect(breadcrumbItems.length).toBe(2); // Root + Level 1
      // Update with more items
      breadcrumbNav.items([
        { label: "Level 1", node: null },
        { label: "Level 2", node: null },
      ]);
      htmlLayer.call(breadcrumbNav);
      breadcrumbItems = container.querySelectorAll(".sszvis-breadcrumb-item");
      expect(breadcrumbItems.length).toBe(3); // Root + Level 1 + Level 2
    });
  });
});
