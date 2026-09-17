import { scaleOrdinal, select } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { bounds } from "../../src/bounds.js";
import { getAccessibleTextColor } from "../../src/color.js";
import pack, { type PackLayout } from "../../src/component/pack.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import type { LayerSelection } from "../../src/types.js";
import "../../src/d3-selectgroup.js";
import { type NodeDatum, prepareHierarchyData } from "../../src/layout/hierarchy.js";

// Test data structures
type TestDatum = {
  category: string;
  subcategory: string;
  value: number;
  name: string;
};

describe("component/pack", () => {
  let container: HTMLDivElement;
  let svg: LayerSelection<SVGGElement, number>;
  let data: TestDatum[];
  let cScale: (key: string) => string;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);

    svg = createSvgLayer(
      container,
      bounds({
        width: 400,
        height: 300,
        top: 20,
        right: 20,
        bottom: 30,
        left: 40,
      }),
    );

    // Sample hierarchical data
    data = [
      {
        category: "Technology",
        subcategory: "Software",
        value: 100,
        name: "App A",
      },
      {
        category: "Technology",
        subcategory: "Software",
        value: 80,
        name: "App B",
      },
      {
        category: "Technology",
        subcategory: "Hardware",
        value: 150,
        name: "Device A",
      },
      {
        category: "Finance",
        subcategory: "Banking",
        value: 200,
        name: "Bank A",
      },
      {
        category: "Finance",
        subcategory: "Investment",
        value: 90,
        name: "Fund A",
      },
      {
        category: "Healthcare",
        subcategory: "Pharma",
        value: 120,
        name: "Drug A",
      },
    ];

    cScale = scaleOrdinal<string, string>()
      .domain(["Technology", "Finance", "Healthcare"])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    vi.restoreAllMocks();
  });

  /** The hierarchy the pack is normally given: rows grouped by category, then subcategory. */
  const nested = (rows: TestDatum[] = data) =>
    prepareHierarchyData<TestDatum>()
      .layer((d) => d.category)
      .layer((d) => d.subcategory)
      .value((d) => d.value)
      .calculate(rows);

  /** The same rows grouped by category only, for the cases that want a two-level tree. */
  const flat = (rows: TestDatum[] = data) =>
    prepareHierarchyData<TestDatum>()
      .layer((d) => d.category)
      .value((d) => d.value)
      .calculate(rows);

  /**
   * Renders a pack of the given hierarchy at a fixed size with transitions off, so every
   * assertion reads the settled geometry on the same tick. `configure` adds whatever the
   * test under way needs on top.
   */
  const renderPack = (
    hierarchy: ReturnType<typeof nested>,
    configure: (c: ReturnType<typeof pack<TestDatum>>) => ReturnType<typeof pack<TestDatum>> = (
      c,
    ) => c,
  ) => {
    svg
      .datum(hierarchy)
      .call(
        configure(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false),
        ),
      );
    return svg;
  };

  const circleNodes = () => [
    ...svg.selectAll<SVGCircleElement, unknown>(".sszvis-pack-circle").nodes(),
  ];
  const labelNodes = () => [
    ...svg.selectAll<SVGTextElement, unknown>(".sszvis-pack-label").nodes(),
  ];
  const anchorNodes = () => [
    ...svg.selectAll<SVGRectElement, unknown>("[data-tooltip-anchor]").nodes(),
  ];

  describe("pack component", () => {
    test("should report the documented defaults when nothing has been configured", () => {
      const packComponent = pack<TestDatum>();
      expect(packComponent.containerWidth()).toBe(800);
      expect(packComponent.containerHeight()).toBe(600);
      expect(packComponent.transition()).toBe(true);
      expect(packComponent.showLabels()).toBe(false);
      expect(packComponent.minRadius()).toBe(20);
      expect(packComponent.circleStroke()).toBe("#ffffff");
      expect(packComponent.circleStrokeWidth()).toBe(1);
    });

    test("should paint the same stroke whether colorScale is a constant or an accessor", () => {
      // colorScale is wrapped in fn.functor on set, so a colour and an accessor returning
      // that colour agree - the rule every other colour property in the library follows.
      const hierarchy = () =>
        prepareHierarchyData<TestDatum>()
          .layer((d) => d.category)
          .value((d) => d.value)
          .calculate(data);
      const strokes = (scale: string | ((key: string) => string)) => {
        svg
          .datum(hierarchy())
          .call(
            pack<TestDatum>()
              .colorScale(scale)
              .containerWidth(360)
              .containerHeight(250)
              .transition(false),
          );
        return svg
          .selectAll<SVGCircleElement, unknown>(".sszvis-pack-circle")
          .nodes()
          .map((circle) => circle.getAttribute("stroke"));
      };
      const constant = strokes("#ff0000");
      expect(constant.length).toBeGreaterThan(0);
      expect(new Set(constant)).toEqual(new Set(["#ff0000"]));
      expect(strokes(() => "#ff0000")).toEqual(constant);
    });

    test("should fill every leaf with the colour of its own top-level category", () => {
      // Each expected fill is derived from the source row's category rather than from the
      // component's own colorKeyOf, so this fails when the scale is applied to the wrong
      // node even though every fill is still a legitimate palette colour. The test this
      // replaces asserted only that the first circle's fill was "none" or somewhere in the
      // palette, and the whole file passed with one category's colour painted over all of
      // them.
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data),
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false),
        );

      const painted = svg
        .selectAll<SVGCircleElement, { data: NodeDatum<TestDatum> }>(".sszvis-pack-circle")
        .nodes()
        .map((circle) => ({
          datum: select<SVGCircleElement, { data: NodeDatum<TestDatum> }>(circle).datum().data,
          fill: circle.getAttribute("fill"),
        }));

      const leaves = painted.filter((c) => c.datum._tag === "leaf");
      expect(leaves.length).toBeGreaterThan(1);
      for (const leaf of leaves) {
        const row = (leaf.datum as Extract<NodeDatum<TestDatum>, { _tag: "leaf" }>).data;
        expect(leaf.fill).toBe(cScale(row.category));
      }

      // More than one category is on screen, so a scale collapsed onto a single key fails
      // here as well as in the per-leaf assertion above.
      expect(new Set(leaves.map((c) => c.fill)).size).toBeGreaterThan(1);

      // Branch nodes are painted white rather than left unfilled, so they stay clickable.
      for (const branch of painted.filter((c) => c.datum._tag === "branch")) {
        expect(branch.fill).toBe("white");
      }
    });

    test("should draw a label per labelled circle when showLabels is on and none when it is off", () => {
      renderPack(nested(), (c) => c.showLabels(true));
      expect(labelNodes().length).toBeGreaterThan(0);

      renderPack(flat(), (c) => c.showLabels(false));
      expect(labelNodes()).toEqual([]);
    });

    test("should take every label's text from the label accessor when one is given", () => {
      renderPack(flat(), (c) =>
        c.showLabels(true).label((d) => `Label: ${d.data && "key" in d.data ? d.data.key : ""}`),
      );
      const labels = labelNodes();
      // Asserted before the loop, so an empty render fails here rather than passing an
      // assertion that never runs.
      expect(labels.length).toBeGreaterThan(0);
      for (const label of labels) expect(label.textContent).toMatch(/^Label: /);
    });

    test("should draw no circle below minRadius when minRadius is set", () => {
      renderPack(
        nested([
          { category: "A", subcategory: "A1", value: 0.1, name: "Tiny" },
          { category: "B", subcategory: "B1", value: 100, name: "Normal" },
        ]),
        (c) => c.minRadius(5),
      );
      const circles = circleNodes();
      expect(circles.length).toBeGreaterThan(0);
      for (const circle of circles) {
        expect(parseFloat(circle.getAttribute("r") || "0")).toBeGreaterThanOrEqual(5);
      }
    });

    test("should draw nothing at all, without throwing, when the data is empty", () => {
      expect(() => renderPack(flat([]))).not.toThrow();
      expect(circleNodes()).toEqual([]);
      expect(anchorNodes()).toEqual([]);
    });

    test("should paint branch nodes white with a thicker stroke than the leaves they contain", () => {
      renderPack(nested());
      let branchCount = 0;
      let leafCount = 0;
      svg
        .selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle")
        .nodes()
        .forEach((circle) => {
          const fill = circle.getAttribute("fill");
          const strokeWidth = circle.getAttribute("stroke-width");

          if (fill === "white") {
            branchCount++;
            expect(strokeWidth).toBe("2"); // Branch nodes have thicker stroke
          } else {
            leafCount++;
            // Leaf nodes can have stroke-width of 1 or 2 depending on hierarchy
            expect(["1", "2"].includes(strokeWidth || "")).toBe(true);
          }
        });
      expect(branchCount).toBeGreaterThan(0);
      expect(leafCount).toBeGreaterThan(0);
    });

    test("should keep every circle inside the container when one is configured", () => {
      renderPack(flat());
      const circles = circleNodes();
      expect(circles.length).toBeGreaterThan(0);
      for (const circle of circles) {
        const cx = parseFloat(circle.getAttribute("cx") || "0");
        const cy = parseFloat(circle.getAttribute("cy") || "0");
        const r = parseFloat(circle.getAttribute("r") || "0");
        expect(cx - r).toBeGreaterThanOrEqual(0);
        expect(cy - r).toBeGreaterThanOrEqual(0);
        expect(cx + r).toBeLessThanOrEqual(360);
        expect(cy + r).toBeLessThanOrEqual(250);
      }
    });

    test("should re-render without throwing when the caller does not re-bind the group", () => {
      // The render binds the flattened nodes to the group for the tooltip anchors and then
      // restores the hierarchy, so the group's datum is still a root the next time round. A
      // caller holding its own group selection can re-render without re-binding; leaving the
      // array there made the pack layout throw on the second call - see #303.
      const packComponent = pack<TestDatum>()
        .colorScale(cScale)
        .containerWidth(360)
        .containerHeight(250)
        .transition(false);

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data),
        )
        .call(packComponent);
      const first = svg.selectAll(".sszvis-pack-circle").size();

      expect(() => {
        svg.call(packComponent);
      }).not.toThrow();
      expect(svg.selectAll(".sszvis-pack-circle").size()).toBe(first);
    });
  });

  describe("onClick functionality", () => {
    test("should call onClick handler when circle is clicked", () => {
      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data),
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false),
        );

      // NOTE: selectAll, not select - d3's select propagates the group's datum onto
      // the child it picks, which would overwrite the drawn node's datum with the
      // array the group is bound to for the tooltip anchors.
      const circle = svg.selectAll<SVGCircleElement, unknown>(".sszvis-pack-circle").nodes()[0];
      expect(circle).toBeDefined();

      circle.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    test("should hand the handler the click event and the clicked node's laid-out data", () => {
      const clickHandler = vi.fn();
      renderPack(nested(), (c) => c.onClick(clickHandler));

      circleNodes()[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledWith(
        expect.any(MouseEvent),
        expect.objectContaining({
          data: expect.any(Object),
          x: expect.any(Number),
          y: expect.any(Number),
          r: expect.any(Number),
          value: expect.any(Number),
        }),
      );
    });

    test("should show a pointer cursor on every circle when onClick is provided and none when it is not", () => {
      const cursors = () =>
        circleNodes().map((circle) => circle.style.cursor || circle.getAttribute("cursor"));

      renderPack(nested(), (c) => c.onClick(vi.fn()));
      expect(cursors().length).toBeGreaterThan(0);
      for (const cursor of cursors()) expect(cursor).toBe("pointer");

      renderPack(nested());
      expect(cursors().length).toBeGreaterThan(0);
      for (const cursor of cursors()) expect(cursor).not.toBe("pointer");
    });

    test("should report the clicked node's own place in the tree whether it is a leaf or a branch", () => {
      const clickHandler = vi.fn();
      renderPack(nested(), (c) => c.onClick(clickHandler));

      // Leaves carry a category colour; branches are painted white.
      const leafCircle = circleNodes().find((circle) => circle.getAttribute("fill") !== "white");
      const branchCircle = circleNodes().find((circle) => circle.getAttribute("fill") === "white");
      expect(leafCircle).toBeDefined();
      expect(branchCircle).toBeDefined();

      leafCircle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const [, leafNode] = clickHandler.mock.calls[0];
      expect(!leafNode.children || leafNode.children.length === 0).toBe(true);

      branchCircle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const [, branchNode] = clickHandler.mock.calls[1];
      expect(Array.isArray(branchNode.children)).toBe(true);
      expect(branchNode.children.length).toBeGreaterThan(0);
    });

    test("should still draw and report clicks when the tree is deep or uneven", () => {
      type DeepDatum = {
        category: string;
        subcategory: string;
        division: string;
        team: string;
        value: number;
      };

      const deepData: DeepDatum[] = [
        {
          category: "Technology",
          subcategory: "Software",
          division: "Frontend",
          team: "Team A",
          value: 100,
        },
        {
          category: "Technology",
          subcategory: "Software",
          division: "Backend",
          team: "Team B",
          value: 80,
        },
        {
          category: "Finance",
          subcategory: "Banking",
          division: "Retail",
          team: "Team C",
          value: 150,
        },
      ];

      type UnevenDatum = {
        category: string;
        subcategory: string;
        division: string | null;
        value: number;
      };

      const unevenData: UnevenDatum[] = [
        { category: "Technology", subcategory: "Software", division: "Frontend", value: 100 },
        // Missing division, so this branch is one level shorter than its siblings.
        { category: "Technology", subcategory: "Hardware", division: null, value: 80 },
        { category: "Finance", subcategory: "Banking", division: "Retail", value: 150 },
      ];

      const clickHandler = vi.fn();

      // Four levels deep, every branch the same length.
      svg
        .datum(
          prepareHierarchyData<DeepDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .layer((d) => d.division)
            .layer((d) => d.team)
            .value((d) => d.value)
            .calculate(deepData),
        )
        .call(
          pack<DeepDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false),
        );

      expect(circleNodes().length).toBeGreaterThan(0);
      circleNodes()[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(clickHandler).toHaveBeenCalledTimes(1);
      expect(clickHandler.mock.calls[0][1].data).toBeDefined();

      // The same again with a branch that runs out of layers early.
      svg
        .datum(
          prepareHierarchyData<UnevenDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .layer((d) => d.division)
            .value((d) => d.value)
            .calculate(unevenData),
        )
        .call(
          pack<UnevenDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false),
        );

      const uneven = circleNodes();
      expect(uneven.length).toBeGreaterThan(0);
      uneven[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      uneven[uneven.length - 1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(clickHandler).toHaveBeenCalledTimes(3);
      expect(clickHandler.mock.calls[2][1].data).toBeDefined();
    });
  });

  describe("tooltip anchors", () => {
    const anchorData = () =>
      anchorNodes().map((el) => select<SVGRectElement, PackLayout<TestDatum>>(el).datum());
    const keyOf = (d: PackLayout<TestDatum>) => ("key" in d.data ? d.data.key : undefined);
    const withAnchors = (rows: TestDatum[] = data) =>
      renderPack(nested(rows), (c) => c.minRadius(5));

    test("should render one anchor per drawn circle, in the same order and at its centre", () => {
      withAnchors();
      const circles = circleNodes();
      expect(circles.length).toBeGreaterThan(0);
      expect(anchorNodes().length).toBe(circles.length);

      const circleData = circles.map((el) =>
        select<SVGCircleElement, PackLayout<TestDatum>>(el).datum(),
      );
      expect(anchorData().map(keyOf)).toEqual(circleData.map(keyOf));

      // Same order is not enough on its own - each anchor also has to sit on the circle it
      // is paired with, which is what a tooltip reads.
      for (const el of anchorNodes()) {
        const d = select<SVGRectElement, PackLayout<TestDatum>>(el).datum();
        expect(el.getAttribute("transform")).toBe(`translate(${d.x},${d.y})`);
      }
    });

    test("should give no anchor to a node the minRadius filter excludes", () => {
      // The tiny node's circle is below minRadius and is never drawn, so it must not
      // gain an anchor either - a tooltip bound to the anchors would otherwise point at
      // a node the reader cannot see.
      withAnchors([
        { category: "A", subcategory: "A1", value: 0.1, name: "Tiny" },
        { category: "B", subcategory: "B1", value: 100, name: "Normal" },
      ]);
      expect(anchorNodes().length).toBe(circleNodes().length);
      expect(anchorData().map(keyOf)).not.toContain("A1");
    });

    test("should give no anchor to the invisible root, which has no circle either", () => {
      withAnchors();
      expect(anchorNodes().length).toBeGreaterThan(0);
      for (const d of anchorData()) {
        expect(d.data._tag).not.toBe("root");
        expect(keyOf(d)).toBeDefined();
      }
    });

    test("should re-render the anchors in place rather than appending duplicates", () => {
      withAnchors();
      const first = anchorNodes().length;
      expect(first).toBeGreaterThan(0);
      withAnchors();
      expect(anchorNodes().length).toBe(first);
    });
  });

  describe("label contrast", () => {
    test("should compute every label's colour from the fill on its own circle", () => {
      // The fill and the contrast source are one expression, so they cannot drift apart:
      // whatever a node's circle is painted, its label is legible against that. There is
      // no failing case at master - branch nodes are never labelled - so this pins the
      // invariant against a future change to how branches are painted or labelled.
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data),
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(true)
            .transition(false),
        );

      const circleFill = new Map<PackLayout<TestDatum>, string | null>(
        svg
          .selectAll<SVGCircleElement, unknown>(".sszvis-pack-circle")
          .nodes()
          .map((el) => [
            select<SVGCircleElement, PackLayout<TestDatum>>(el).datum(),
            el.getAttribute("fill"),
          ]),
      );

      const labels = svg.selectAll<SVGTextElement, unknown>(".sszvis-pack-label").nodes();
      expect(labels.length).toBeGreaterThan(0);

      for (const el of labels) {
        const d = select<SVGTextElement, PackLayout<TestDatum>>(el).datum();
        const fill = circleFill.get(d);
        expect(fill).toBeDefined();
        expect(el.getAttribute("fill")).toBe(getAccessibleTextColor(fill ?? null));
      }
    });
  });
});
