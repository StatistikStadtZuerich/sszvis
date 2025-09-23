import { partition, select } from "d3";
import { describe, expect, it } from "vitest";
import sunburst from "../src/component/sunburst.js";
import { prepareHierarchyData } from "../src/layout/hierarchy.js";

describe("sunburst component", () => {
  // Test data
  const testData = [
    { continent: "Europa", region: "West", country: "Germany", value: 100 },
    { continent: "Europa", region: "West", country: "France", value: 80 },
    { continent: "Europa", region: "East", country: "Poland", value: 60 },
    { continent: "Asia", region: "East", country: "China", value: 200 },
    { continent: "Asia", region: "East", country: "Japan", value: 120 },
  ];

  const continentAcc = (d) => d.continent;
  const regionAcc = (d) => d.region;
  const countryAcc = (d) => d.country;
  const valueAcc = (d) => d.value;

  it("should accept hierarchical data from prepareHierarchyData", () => {
    // Create a container
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Prepare hierarchical data
    const hierarchicalData = prepareHierarchyData()
      .layer(continentAcc)
      .layer(regionAcc)
      .layer(countryAcc)
      .value(valueAcc)
      .calculate(testData);

    // Create sunburst component
    const sunburstComponent = sunburst()
      .fill(() => "#steelblue")
      .radiusScale((d) => d * 10)
      .centerRadius(50);

    // Render
    const svg = select(container).append("svg").attr("width", 400).attr("height", 400);

    const chartGroup = svg.append("g").datum(hierarchicalData).call(sunburstComponent);

    // Check that arcs were created
    const arcs = chartGroup.selectAll(".sszvis-sunburst-arc");
    expect(arcs.size()).toBeGreaterThan(0);

    // Cleanup
    document.body.removeChild(container);
  });

  it("should accept pre-processed flat data (backwards compatibility)", () => {
    // Create a container
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Prepare flat data the old way
    const hierarchicalData = prepareHierarchyData()
      .layer(continentAcc)
      .layer(regionAcc)
      .layer(countryAcc)
      .value(valueAcc)
      .calculate(testData);

    // Apply partition layout and flatten (simulating old prepareData behavior)
    partition()(hierarchicalData);

    function flatten(node) {
      return Array.prototype.concat.apply([node], (node.children || []).map(flatten));
    }

    const flatData = flatten(hierarchicalData).filter((d) => d.data._tag !== "root");

    // Create sunburst component
    const sunburstComponent = sunburst()
      .fill(() => "#steelblue")
      .radiusScale((d) => d * 10)
      .centerRadius(50);

    // Render
    const svg = select(container).append("svg").attr("width", 400).attr("height", 400);

    const chartGroup = svg.append("g").datum(flatData).call(sunburstComponent);

    // Check that arcs were created
    const arcs = chartGroup.selectAll(".sszvis-sunburst-arc");
    expect(arcs.size()).toBeGreaterThan(0);

    // Cleanup
    document.body.removeChild(container);
  });
});
