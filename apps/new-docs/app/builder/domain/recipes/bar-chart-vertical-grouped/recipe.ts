import { code, str } from "../../emit";
import {
  CATEGORY,
  DESCRIPTION,
  FeatureKey,
  OptionKey,
  RecipeKey,
  SERIES,
  TITLE,
  VALUE,
  type AnnotationAxis,
  type RecipeDef,
} from "../../spec";
import { tooltipText } from "../../tooltip";

/*
 * None yet. Unlike the stacks, this chart could carry a reference line - its value
 * axis measures one bar rather than a running total - but it has no template that
 * draws one, and offering the axis without that would put a control in the builder
 * that quietly does nothing.
 */
const ANNOTATION_AXES: readonly AnnotationAxis[] = [];

/* The option and feature keys, named once: they key `options`, `features` and every lookup. */
const X_LABEL_OPTION = OptionKey.make("xLabel");
const Y_LABEL_OPTION = OptionKey.make("yLabel");
const TOOLTIP = FeatureKey.make("tooltip");
const LEGEND = FeatureKey.make("legend");

export const barChartVerticalGrouped: RecipeDef = {
  key: RecipeKey.make("bar-chart-vertical-grouped"),
  label: "Grouped bar chart",
  roles: [
    {
      key: CATEGORY,
      label: "Category",
      kind: "category",
      hint: "One group of bars per distinct value; labels the x axis.",
    },
    {
      key: SERIES,
      label: "Series",
      kind: "category",
      hint: "One bar per distinct value, side by side within each group.",
    },
    {
      key: VALUE,
      label: "Value",
      kind: "number",
      hint: "The height of the bar. Negative values hang below the zero line.",
    },
  ],
  options: [
    /* German: this reaches the chart, not the builder. See the README. */
    { key: TITLE, label: "Title", fallback: "Gruppiertes Balkendiagramm" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    { key: X_LABEL_OPTION, label: "X axis label", fallback: "" },
    { key: Y_LABEL_OPTION, label: "Y axis label", fallback: "" },
  ],
  features: [TOOLTIP, LEGEND],
  scalars: (spec, option) => ({
    X_LABEL: str(option(X_LABEL_OPTION)),
    Y_LABEL: str(option(Y_LABEL_OPTION)),
    CATEGORY_FIELD: str(spec.fields[CATEGORY] ?? ""),
    SERIES_FIELD: str(spec.fields[SERIES] ?? ""),
    VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
    /* The legend feature overrides both. See the line chart for why the domain is set. */
    C_SCALE: code(
      "state.categories.length > 6\n      ? sszvis.scaleQual12().domain(state.categories)\n      : sszvis.scaleQual6().domain(state.categories)",
    ),
    BOTTOM_PADDING: code("60"),
    /* The tooltip feature overrides this; without it no tick is singled out. */
    HIGHLIGHT_TICK: code("() => false"),
    /*
     * Only the category, because the datum is a whole group: the series and the
     * value differ between its members, and the body lists every one of them.
     * `tooltipRoles` keeps the picker from offering the other two.
     */
    TOOLTIP_TEXT: tooltipText(
      "HTML",
      spec,
      { [CATEGORY]: { accessor: "groupCategory", kind: "category" } },
      barChartVerticalGrouped.defaultTooltip,
      "Group",
    ),
  }),
  tooltipFeature: TOOLTIP,
  tooltipRoles: [CATEGORY],
  defaultTooltip: { header: CATEGORY, body: [] },
  annotationAxes: ANNOTATION_AXES,
  implied: () => [],
  sample: "berufsfeld-jahr",
};
