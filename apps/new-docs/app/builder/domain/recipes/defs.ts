import type { RecipeDef } from "../spec";
import { barChartHorizontal } from "./bar-chart-horizontal/recipe";
import { barChartVertical } from "./bar-chart-vertical/recipe";
import { lineChart } from "./line-chart/recipe";

export const recipeDefs: readonly RecipeDef[] = [barChartVertical, barChartHorizontal, lineChart];
