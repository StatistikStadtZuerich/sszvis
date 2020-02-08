import { Catalog, pageLoader } from "catalog";
import React from "react";
import ReactDOM from "react-dom";
import ProjectSpecimen from "./ProjectSpecimen/Project";

const staticMarkdown = src => pageLoader(`${process.env.PUBLIC_URL}/${src}`);
const staticFile = src => `${process.env.PUBLIC_URL}/${src}`;

const pages = [
  {
    path: "/",
    title: "Introduction",
    pages: [
      {
        path: "/",
        title: "Installation",
        content: staticMarkdown("intro.md")
      },
      {
        path: "getting-started",
        title: "Getting started",
        content: staticMarkdown("guides/getting-started.md")
      },
      { path: "faq", title: "FAQ", content: staticMarkdown("faq.md") },
      {
        path: "changelog",
        title: "Changelog",
        content: staticMarkdown("CHANGELOG.md")
      }
    ]
  },
  {
    path: "guides",
    title: "Guides",
    pages: [
      {
        path: "accessibility",
        title: "Accessibility",
        content: staticMarkdown("guides/accessibility.md")
      },
      {
        path: "annotations",
        title: "Annotations",
        content: staticMarkdown("guides/annotations.md")
      },
      {
        path: "axes",
        title: "Axes",
        content: staticMarkdown("guides/axes.md")
      },
      {
        path: "behaviors",
        title: "Behaviors",
        content: staticMarkdown("guides/behavior.md")
      },
      {
        path: "breakpoints",
        title: "Breakpoints",
        content: staticMarkdown("guides/breakpoints.md")
      },
      {
        path: "colors",
        title: "Colors",
        content: staticMarkdown("guides/colors.md"),
        styles: [staticFile("guides/colors.css")],
        scripts: [staticFile("guides/colors.js")]
      },
      {
        path: "controls",
        title: "Controls",
        content: staticMarkdown("guides/controls.md")
      },
      {
        path: "formats",
        title: "Formatting",
        content: staticMarkdown("guides/formats.md")
      },
      {
        path: "legends",
        title: "Legends",
        content: staticMarkdown("guides/legends.md")
      },
      {
        path: "tooltips",
        title: "Tooltips",
        content: staticMarkdown("guides/tooltips.md"),
        styles: [staticFile("guides/tooltips.css")],
        scripts: [staticFile("guides/tooltips.js")]
      }
    ]
  },
  {
    path: "area-chart-stacked",
    title: "+ Area chart",
    content: staticMarkdown("area-chart-stacked/README.md")
  },
  {
    path: "bar-charts",
    title: "+ Bar chart",
    pages: [
      {
        path: "bar-chart-vertical",
        title: "Vertical",
        content: staticMarkdown("bar-chart-vertical/README.md")
      },
      {
        path: "bar-chart-vertical-stacked",
        title: "Vertical (stacked)",
        content: staticMarkdown("bar-chart-vertical-stacked/README.md")
      },
      {
        path: "bar-chart-horizontal",
        title: "Horizontal",
        content: staticMarkdown("bar-chart-horizontal/README.md")
      },
      {
        path: "bar-chart-horizontal-stacked",
        title: "Horizontal (stacked)",
        content: staticMarkdown("bar-chart-horizontal-stacked/README.md")
      },
      {
        path: "bar-chart-grouped",
        title: "Grouped",
        content: staticMarkdown("bar-chart-grouped/README.md")
      }
    ]
  },
  {
    path: "line-charts",
    title: "+ Line chart",
    content: staticMarkdown("line-chart/README.md")
  },
  {
    path: "heat-table",
    title: "+ Heat table",
    content: staticMarkdown("heat-table/README.md")
  },
  {
    path: "map",
    title: "+ Maps",
    pages: [
      {
        path: "map-standard",
        title: "Choropleth Maps",
        content: staticMarkdown("map-standard/README.md")
      },
      // {path: 'map-baselayer', title: 'Map Base Layers', content: staticMarkdown('map-baselayer/README.md')},
      {
        path: "map-extended",
        title: "Extended Maps",
        content: staticMarkdown("map-extended/README.md")
      },
      {
        path: "map-signature",
        title: "Signature Maps",
        content: staticMarkdown("map-signature/README.md")
      }
    ]
  },
  {
    path: "pie-charts",
    title: "+ Pie chart",
    content: staticMarkdown("pie-charts/README.md")
  },
  {
    path: "population-pyramid",
    title: "+ Population pyramid",
    content: staticMarkdown("population-pyramid/README.md")
  },
  {
    path: "sankey",
    title: "+ Sankey diagram",
    content: staticMarkdown("sankey/README.md")
  },
  {
    path: "scatterplot",
    title: "+ Scatterplot",
    pages: [
      {
        path: "scatterplot",
        title: "Scatterplot",
        content: staticMarkdown("scatterplot/README.md")
      },
      {
        path: "scatterplot-over-time",
        title: "Scatterplot Over Time",
        content: staticMarkdown("scatterplot-over-time/README.md")
      }
    ]
  },
  {
    path: "sunburst",
    title: "+ Sunburst",
    content: staticMarkdown("sunburst/README.md")
  }
];

ReactDOM.render(
  <Catalog
    title="SSZ Visualization Library"
    specimens={{
      project: ProjectSpecimen({
        sizes: [
          { width: "750px", height: "600px" },
          { width: "541px", height: "500px" },
          { width: "284px", height: "500px" }
        ]
      })
    }}
    theme={{
      background: "#fdfdfd",
      brandColor: "#0070bc",
      linkColor: "#CC6171",
      // msRatio: 1.1,
      pageHeadingBackground: "#f5f5f5",
      pageHeadingTextColor: "#0070bc",
      sidebarColorHeading: "#0070bc",
      sidebarColorText: "#777",
      sidebarColorTextActive: "#0070bc"
    }}
    pages={pages}
  />,
  document.getElementById("catalog")
);
