import { test, describe, expect } from "vitest";
import { prepareData } from "../../src/layout/sankey";
import { set } from "../../src/fn";

const sAcc = (d) => d.source;
const tAcc = (d) => d.target;
const vAcc = (d) => d.value;

describe("sankey", () => {
  const tidyData = [
    { source: "Karibik", target: "Affoltern", value: 19 },
    { source: "Karibik", target: "Albisrieden", value: 9 },
    { source: "Karibik", target: "Alt", value: 21 },
    { source: "Mittleres", target: "Altstetten", value: 24 },
    { source: "Mittleres", target: "City", value: 2 },
    { source: "Mittleres", target: "Enge", value: 19 },
    { source: "Mittleres", target: "Escher", value: 4 },
    { source: "Nordafrika", target: "Fluntern", value: 6 },
    { source: "Nordafrika", target: "Enge", value: 1 },
    { source: "Nordafrika", target: "Escher", value: 11 },
  ];

  test("when preparing data with sankey", () => {
    const leftColIds = set(tidyData, sAcc);
    const rightColIds = set(tidyData, tAcc);

    const { nodes, links } = prepareData()
      .source(sAcc)
      .target(tAcc)
      .value(vAcc)
      .idLists([leftColIds, rightColIds])
      .apply(tidyData);

    for (const node of nodes) {
      expect(node).toHaveProperty("id");
      expect(node).toHaveProperty("columnIndex");
      expect(node).toHaveProperty("value");
    }
    for (const link of links) {
      expect(link).toHaveProperty("id");
      expect(link).toHaveProperty("value");

      expect(nodes).toContain(link.src);
      expect(nodes).toContain(link.tgt);
    }
  });
});
