import { expect, test } from "vitest";

import { contentPages } from "../content-pages";
import { LEGACY_PATHS } from "./legacy-paths";

/** Every page of the previous Catalog site, as its `#/<slug>` URL named it. */
const OLD_SLUGS = [
  "getting-started",
  "faq",
  "changelog",
  "accessibility",
  "annotations",
  "axes",
  "behaviors",
  "breakpoints",
  "colors",
  "controls",
  "formats",
  "legends",
  "tooltips",
  "small-multiples",
  "area-chart-stacked",
  "bar-chart-vertical",
  "bar-chart-vertical-stacked",
  "bar-chart-vertical-nested",
  "bar-chart-vertical-grouped",
  "bar-chart-horizontal",
  "bar-chart-horizontal-stacked",
  "bar-chart-horizontal-grouped",
  "line-charts",
  "heat-table",
  "pack",
  "sunburst",
  "treemap",
  "map-standard",
  "map-extended",
  "map-signature",
  "pie-charts",
  "population-pyramid",
  "sankey",
  "scatterplot",
  "scatterplot-over-time",
];

const routes = new Set(contentPages.map((page) => page.routePath));

test.each(OLD_SLUGS)("should send #/%s to a page that exists", (slug) => {
  const target = LEGACY_PATHS[slug] ?? slug;
  expect(routes.has(target), `${slug} -> ${target}`).toBe(true);
});
