import { describe, expect, test } from "vitest";
import { prepareHierarchyData } from "../../src/layout/hierarchy.js";

/** The rows these cases nest: three categories, five subcategories, six leaves. */
type TestDatum = {
  category: string;
  subcategory: string;
  value: number;
  name: string;
};

const data: TestDatum[] = [
  { category: "Technology", subcategory: "Software", value: 100, name: "App A" },
  { category: "Technology", subcategory: "Software", value: 80, name: "App B" },
  { category: "Technology", subcategory: "Hardware", value: 150, name: "Device A" },
  { category: "Finance", subcategory: "Banking", value: 200, name: "Bank A" },
  { category: "Finance", subcategory: "Investment", value: 90, name: "Fund A" },
  { category: "Healthcare", subcategory: "Pharma", value: 120, name: "Drug A" },
];

describe("layout/hierarchy", () => {
  test("should nest the rows one level per layer when the layers are given through the chained API", () => {
    const layoutData = prepareHierarchyData<TestDatum>()
      .layer((d) => d.category)
      .layer((d) => d.subcategory)
      .value((d) => d.value)
      .calculate(data);

    expect(layoutData.children).toBeDefined();
    expect(layoutData.children?.length).toBe(3); // Technology, Finance, Healthcare
    expect(layoutData.value).toBeGreaterThan(0);
    expect(layoutData.depth).toBe(0); // Root node
  });

  test("should handle uneven tree depth with null keys by using parent key as fallback", () => {
    type UnevenDatum = {
      category: string;
      subcategory: string;
      division: string | null;
      team: string | null;
      value: number;
    };

    const unevenData: UnevenDatum[] = [
      // Full depth path
      {
        category: "Technology",
        subcategory: "Hardware",
        division: "Servers",
        team: "Team Alpha",
        value: 100,
      },
      // Missing team (null at deepest level)
      {
        category: "Technology",
        subcategory: "Hardware",
        division: "Servers",
        team: null,
        value: 85,
      },
      // Missing both division and team
      {
        category: "Finance",
        subcategory: "Banking",
        division: null,
        team: null,
        value: 200,
      },
    ];

    const layoutData = prepareHierarchyData<UnevenDatum>()
      .layer((d) => d.category)
      .layer((d) => d.subcategory)
      .layer((d) => d.division)
      .layer((d) => d.team)
      .value((d) => d.value)
      .calculate(unevenData);

    // Collect all leaf nodes and their keys
    const leafNodes: Array<{ key: string; data: UnevenDatum }> = [];
    layoutData.each((node) => {
      if (node.data._tag === "leaf") {
        leafNodes.push({
          key: node.data.key,
          data: node.data.data,
        });
      }
    });

    // All leaf nodes should have non-null keys
    for (const leaf of leafNodes) {
      expect(leaf.key).not.toBeNull();
      expect(leaf.key).toBeDefined();
      expect(typeof leaf.key).toBe("string");
      expect(leaf.key.length).toBeGreaterThan(0);
    }

    // The node with team=null should have key="Servers" (parent's key)
    const serverNullTeamNode = leafNodes.find(
      (n) => n.data.team === null && n.data.division === "Servers",
    );
    expect(serverNullTeamNode).toBeDefined();
    expect(serverNullTeamNode?.key).toBe("Servers");

    // The node with both division=null and team=null should have key="Banking" (grandparent's key)
    const bankingNullDivisionNode = leafNodes.find(
      (n) => n.data.division === null && n.data.subcategory === "Banking",
    );
    expect(bankingNullDivisionNode).toBeDefined();
    expect(bankingNullDivisionNode?.key).toBe("Banking");
  });

  test("should nest the rows the same way when the layers are given through the options object", () => {
    const layoutData = prepareHierarchyData(data, {
      layers: [(d) => d.category, (d) => d.subcategory],
      valueAccessor: (d) => d.value,
    });
    expect(layoutData.children).toBeDefined();
    expect(layoutData.children?.length).toBe(3); // Technology, Finance, Healthcare
    expect(layoutData.value).toBeGreaterThan(0);
    expect(layoutData.depth).toBe(0); // Root node
  });

  test("should produce one child per category when only one layer is given", () => {
    const layoutData = prepareHierarchyData<TestDatum>()
      .layer((d) => d.category)
      .value((d) => d.value)
      .calculate(data);
    expect(layoutData.children).toBeDefined();
    expect(layoutData.children?.length).toBe(3);
  });

  test("should throw naming the missing layers when calculate is called with none", () => {
    expect(() => {
      prepareHierarchyData<TestDatum>()
        .value((d) => d.value)
        .calculate(data);
    }).toThrow("At least one layer must be specified");
  });

  test("should keep a category in the tree when every one of its rows has value zero", () => {
    const layoutData = prepareHierarchyData<TestDatum>()
      .layer((d) => d.category)
      .value((d) => d.value)
      .calculate([...data, { category: "Empty", subcategory: "None", value: 0, name: "Empty A" }]);
    expect(layoutData.children?.length).toBe(4); // Including Empty category
  });
});
