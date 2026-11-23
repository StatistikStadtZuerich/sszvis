import { CDN, LIBRARIES } from "@sszvis/chart-builder/host";

import html from "../ui/dist/index.html?raw";
import { CHART_APP_URI } from "./chartTools.ts";
import { appResource, origins } from "./mcpApp.ts";

export const ChartApp = appResource({
  uri: CHART_APP_URI,
  name: "sszvis chart",
  description: "Draws a chart from render_chart, with controls to adjust it and its code.",
  html,
  /* The same published builds the generated page loads, so the preview matches the download. */
  csp: { resourceDomains: origins([...Object.values(CDN), ...Object.values(LIBRARIES)]) },
});
