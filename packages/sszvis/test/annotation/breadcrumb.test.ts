import { afterEach, assert, beforeEach, describe, expect, test, vi } from "vitest";
import breadcrumb, { createBreadcrumbItems } from "../../src/annotation/breadcrumb.js";
import { createHtmlLayer } from "../../src/createHtmlLayer.js";
import "../../src/d3-selectdiv.js";
import { prepareHierarchyData } from "../../src/layout/hierarchy.js";

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
    test("should return an empty trail when there is no node", () => {
      expect(createBreadcrumbItems(null)).toEqual([]);
    });

    test("should list a node's ancestors root-first without the synthetic root", () => {
      const root = createMockHierarchy();
      const categoryA = root.children?.[0];
      const subA1 = categoryA?.children?.[0];
      assert(categoryA);
      assert(subA1);

      expect(createBreadcrumbItems(subA1)).toEqual([
        { label: "Category A", node: categoryA },
        { label: "Sub A1", node: subA1 },
      ]);
      // One level down, the same rule leaves a single crumb rather than the hierarchy's root.
      expect(createBreadcrumbItems(categoryA)).toEqual([{ label: "Category A", node: categoryA }]);
    });
  });

  describe("breadcrumb component", () => {
    const render = (configure: (b: ReturnType<typeof breadcrumb>) => typeof b) => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      const component = configure(breadcrumb().renderInto(htmlLayer));
      htmlLayer.call(component);
      return { htmlLayer, component };
    };

    const links = () => [
      ...container.querySelectorAll<HTMLAnchorElement>(".sszvis-breadcrumb-item a"),
    ];
    const separators = () => [
      ...container.querySelectorAll<HTMLSpanElement>(".sszvis-breadcrumb-separator"),
    ];

    const twoItems = [
      { label: "Category", node: null },
      { label: "Current", node: null },
    ];

    test("should render its crumbs into a dedicated container", () => {
      render((b) => b.items(twoItems).width(600));

      expect(container.querySelector('[data-d3-selectdiv="breadcrumbs"]')).not.toBeNull();
    });

    test("should prepend the root label to the trail", () => {
      render((b) => b.items([{ label: "Category", node: null }]).rootLabel("Home"));

      expect(links().map((a) => a.textContent)).toEqual(["Home", "Category"]);
    });

    test("should mark the last crumb as current and the rest as clickable links", () => {
      render((b) => b.items(twoItems));

      const rendered = links();
      const last = rendered.at(-1);
      assert(last);
      // The colours are inline styles the component writes itself, so no stylesheet can
      // override them - which is why pinning them here is the contract and not presentation.
      expect(last.style.fontWeight).toBe("bold");
      expect(last.style.color).toBe("rgb(51, 51, 51)"); // #333
      for (const link of rendered.slice(0, -1)) {
        expect(link.style.fontWeight).toBe("normal");
        expect(link.style.color).toBe("rgb(0, 115, 179)"); // #0073B3
        expect(link.style.cursor).toBe("pointer");
      }
      // The trailing separator would dangle after the current crumb, so it is hidden.
      expect(separators().map((s) => s.style.display === "none")).toEqual([
        ...Array.from({ length: rendered.length - 1 }, () => false),
        true,
      ]);
    });

    test("should call the onClick handler with the crumb and its index when a non-last crumb is clicked", () => {
      const onClickMock = vi.fn();
      render((b) => b.items(twoItems).onClick(onClickMock));

      links()[0].click();

      expect(onClickMock).toHaveBeenCalledTimes(1);
      expect(onClickMock).toHaveBeenCalledWith(
        expect.objectContaining({ label: "Root", node: null }),
        0,
      );
    });

    test("should leave the trail inert when the last crumb is clicked", () => {
      const onClickMock = vi.fn();
      render((b) => b.items(twoItems).onClick(onClickMock));

      links().at(-1)?.click();

      expect(onClickMock).not.toHaveBeenCalled();
    });

    test("should print the given separator between crumbs when one is set", () => {
      render((b) => b.items([{ label: "Category", node: null }]).separator(" / "));

      expect(separators()[0].textContent).toBe(" / ");
    });

    test("should take a crumb's text from the label accessor when one is set", () => {
      render((b) =>
        b.items([{ label: "category", node: null }]).label((d) => d.label.toUpperCase()),
      );

      expect(links()[1].textContent).toBe("CATEGORY");
    });

    test("should grow and shrink the trail when the items change", () => {
      const htmlLayer = createHtmlLayer("#chart-container", undefined);
      const breadcrumbNav = breadcrumb()
        .renderInto(htmlLayer)
        .items([{ label: "Level 1", node: null }]);

      const labelsAfter = (items: { label: string; node: null }[]) => {
        breadcrumbNav.items(items);
        htmlLayer.call(breadcrumbNav);
        return links().map((a) => a.textContent);
      };

      htmlLayer.call(breadcrumbNav);
      expect(links().map((a) => a.textContent)).toEqual(["Root", "Level 1"]);
      expect(
        labelsAfter([
          { label: "Level 1", node: null },
          { label: "Level 2", node: null },
        ]),
      ).toEqual(["Root", "Level 1", "Level 2"]);
      // Shrinking has to remove the exited crumb, not just stop updating it.
      expect(labelsAfter([{ label: "Level 1", node: null }])).toEqual(["Root", "Level 1"]);
    });
  });
});
