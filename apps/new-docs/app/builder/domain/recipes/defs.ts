import type { RecipeDef } from "../spec";
import { areaChartStacked } from "./area-chart-stacked/recipe";
import { barChartHorizontal } from "./bar-chart-horizontal/recipe";
import { barChartHorizontalStacked } from "./bar-chart-horizontal-stacked/recipe";
import { barChartVertical } from "./bar-chart-vertical/recipe";
import { barChartVerticalGrouped } from "./bar-chart-vertical-grouped/recipe";
import { barChartVerticalStacked } from "./bar-chart-vertical-stacked/recipe";
import { lineChart } from "./line-chart/recipe";

export const recipeDefs: readonly RecipeDef[] = [
  barChartVertical,
  barChartHorizontal,
  barChartVerticalStacked,
  barChartHorizontalStacked,
  barChartVerticalGrouped,
  lineChart,
  areaChartStacked,
];
