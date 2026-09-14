/**
 * The one place a page is registered: routes.ts and nav.config.ts are both
 * derived from this list, in this order. An empty routePath is the site index.
 *
 * `section` groups consecutive pages under one collapsible heading in the
 * sidebar; `null` puts the page at the top level on its own, the way the old
 * Catalog docs listed the single-page chart types.
 *
 * `tocMaxDepth` caps the deepest heading level a page lists in its table of
 * contents; omitted, the page lists everything down to `h4`. Every page ported
 * from the old docs uses `h4` for one thing - an entry per configuration
 * option - which is a reference listing rather than a section a reader
 * navigates to, and dozens of them bury the page's actual structure. So each
 * such page caps at 3; the pages without an option listing need no cap.
 */
export interface ContentPage {
  readonly section: string | null;
  readonly label: string;
  readonly href: string;
  readonly routePath: string;
  readonly contentPath: string;
  readonly tocMaxDepth?: number;
}

export const contentPages: readonly ContentPage[] = [
  {
    section: "Introduction",
    label: "Installation",
    href: "/",
    routePath: "",
    contentPath: "content/index.mdx",
  },
  {
    section: "Introduction",
    label: "Getting Started",
    href: "/getting-started",
    routePath: "getting-started",
    contentPath: "content/getting-started.mdx",
  },
  {
    section: "Introduction",
    label: "Gallery",
    href: "/gallery",
    routePath: "gallery",
    contentPath: "content/gallery.mdx",
  },
  {
    section: "Introduction",
    label: "FAQ",
    href: "/faq",
    routePath: "faq",
    contentPath: "content/faq.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Guides",
    label: "Accessibility",
    href: "/guides/accessibility",
    routePath: "guides/accessibility",
    contentPath: "content/guides/accessibility.mdx",
  },
  {
    section: "Guides",
    label: "Annotations",
    href: "/guides/annotations",
    routePath: "guides/annotations",
    contentPath: "content/guides/annotations.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Guides",
    label: "Axes",
    href: "/guides/axes",
    routePath: "guides/axes",
    contentPath: "content/guides/axes.mdx",
  },
  {
    section: "Guides",
    label: "Behaviors",
    href: "/guides/behaviors",
    routePath: "guides/behaviors",
    contentPath: "content/guides/behaviors.mdx",
  },
  {
    section: "Guides",
    label: "Breakpoints",
    href: "/guides/breakpoints",
    routePath: "guides/breakpoints",
    contentPath: "content/guides/breakpoints.mdx",
  },
  {
    section: "Guides",
    label: "Colors",
    href: "/guides/colors",
    routePath: "guides/colors",
    contentPath: "content/guides/colors.mdx",
  },
  {
    section: "Guides",
    label: "Controls",
    href: "/guides/controls",
    routePath: "guides/controls",
    contentPath: "content/guides/controls.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Guides",
    label: "Formatting",
    href: "/guides/formats",
    routePath: "guides/formats",
    contentPath: "content/guides/formats.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Guides",
    label: "Legends",
    href: "/guides/legends",
    routePath: "guides/legends",
    contentPath: "content/guides/legends.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Guides",
    label: "Tooltips",
    href: "/guides/tooltips",
    routePath: "guides/tooltips",
    contentPath: "content/guides/tooltips.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Layout",
    label: "Small Multiples",
    href: "/layout/small-multiples",
    routePath: "layout/small-multiples",
    contentPath: "content/layout/small-multiples.mdx",
    tocMaxDepth: 3,
  },
  {
    section: null,
    label: "Area chart",
    href: "/area-chart-stacked",
    routePath: "area-chart-stacked",
    contentPath: "content/charts/area-chart-stacked.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Bar chart",
    label: "Vertical",
    href: "/bar-chart-vertical",
    routePath: "bar-chart-vertical",
    contentPath: "content/charts/bar-chart-vertical.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Bar chart",
    label: "Vertical (stacked)",
    href: "/bar-chart-vertical-stacked",
    routePath: "bar-chart-vertical-stacked",
    contentPath: "content/charts/bar-chart-vertical-stacked.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Bar chart",
    label: "Vertical (nested)",
    href: "/bar-chart-vertical-nested",
    routePath: "bar-chart-vertical-nested",
    contentPath: "content/charts/bar-chart-vertical-nested.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Bar chart",
    label: "Vertical (grouped)",
    href: "/bar-chart-vertical-grouped",
    routePath: "bar-chart-vertical-grouped",
    contentPath: "content/charts/bar-chart-vertical-grouped.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Bar chart",
    label: "Horizontal",
    href: "/bar-chart-horizontal",
    routePath: "bar-chart-horizontal",
    contentPath: "content/charts/bar-chart-horizontal.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Bar chart",
    label: "Horizontal (stacked)",
    href: "/bar-chart-horizontal-stacked",
    routePath: "bar-chart-horizontal-stacked",
    contentPath: "content/charts/bar-chart-horizontal-stacked.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Bar chart",
    label: "Horizontal (grouped)",
    href: "/bar-chart-horizontal-grouped",
    routePath: "bar-chart-horizontal-grouped",
    contentPath: "content/charts/bar-chart-horizontal-grouped.mdx",
    tocMaxDepth: 3,
  },
  {
    section: null,
    label: "Line chart",
    href: "/line-chart",
    routePath: "line-chart",
    contentPath: "content/charts/line-chart.mdx",
    tocMaxDepth: 3,
  },
  {
    section: null,
    label: "Heat table",
    href: "/heat-table",
    routePath: "heat-table",
    contentPath: "content/charts/heat-table.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Hierarchical",
    label: "Pack",
    href: "/pack",
    routePath: "pack",
    contentPath: "content/charts/pack.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Hierarchical",
    label: "Sunburst",
    href: "/sunburst",
    routePath: "sunburst",
    contentPath: "content/charts/sunburst.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Hierarchical",
    label: "Treemap",
    href: "/treemap",
    routePath: "treemap",
    contentPath: "content/charts/treemap.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Maps",
    label: "Choropleth maps",
    href: "/map-standard",
    routePath: "map-standard",
    contentPath: "content/charts/map-standard.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Maps",
    label: "Extended maps",
    href: "/map-extended",
    routePath: "map-extended",
    contentPath: "content/charts/map-extended.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Maps",
    label: "Signature maps",
    href: "/map-signature",
    routePath: "map-signature",
    contentPath: "content/charts/map-signature.mdx",
    tocMaxDepth: 3,
  },
  {
    section: null,
    label: "Pie chart",
    href: "/pie-charts",
    routePath: "pie-charts",
    contentPath: "content/charts/pie-charts.mdx",
    tocMaxDepth: 3,
  },
  {
    section: null,
    label: "Population pyramid",
    href: "/population-pyramid",
    routePath: "population-pyramid",
    contentPath: "content/charts/population-pyramid.mdx",
    tocMaxDepth: 3,
  },
  {
    section: null,
    label: "Sankey diagram",
    href: "/sankey",
    routePath: "sankey",
    contentPath: "content/charts/sankey.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Scatterplot",
    label: "Scatterplot",
    href: "/scatterplot",
    routePath: "scatterplot",
    contentPath: "content/charts/scatterplot.mdx",
    tocMaxDepth: 3,
  },
  {
    section: "Scatterplot",
    label: "Scatterplot over time",
    href: "/scatterplot-over-time",
    routePath: "scatterplot-over-time",
    contentPath: "content/charts/scatterplot-over-time.mdx",
  },
] as const;
