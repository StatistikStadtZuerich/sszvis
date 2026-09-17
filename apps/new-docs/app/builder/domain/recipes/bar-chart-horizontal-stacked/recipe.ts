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
 * No annotation axis, for the reason the other two stacks give: the value axis
 * measures the stack's running total, so a line across it is not a comparison
 * against any one slice.
 */
const ANNOTATION_AXES: readonly AnnotationAxis[] = [];

/* The option and feature keys, named once: they key `options`, `features` and every lookup. */
const X_LABEL_OPTION = OptionKey.make("xLabel");
const UNIT = OptionKey.make("unit");
const TOOLTIP = FeatureKey.make("tooltip");
const LEGEND = FeatureKey.make("legend");

export const barChartHorizontalStacked: RecipeDef = {
  key: RecipeKey.make("bar-chart-horizontal-stacked"),
  label: "Stacked bar chart, horizontal",
  roles: [
    {
      key: CATEGORY,
      label: "Category",
      kind: "category",
      hint: "One bar per distinct value; labels the y axis.",
    },
    {
      key: SERIES,
      label: "Series",
      kind: "category",
      hint: "One slice per distinct value, stacked along each bar.",
    },
    { key: VALUE, label: "Value", kind: "number", hint: "The length of the slice." },
  ],
  options: [
    /* German: this reaches the chart, not the builder. See the README. */
    { key: TITLE, label: "Title", fallback: "Gestapeltes horizontales Balkendiagramm" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    { key: X_LABEL_OPTION, label: "Value axis label", fallback: "" },
    { key: UNIT, label: "Tooltip unit", fallback: "" },
  ],
  features: [TOOLTIP, LEGEND],
  scalars: (spec, option, _kind) => ({
    X_LABEL: str(option(X_LABEL_OPTION)),
    CATEGORY_FIELD: str(spec.fields[CATEGORY] ?? ""),
    SERIES_FIELD: str(spec.fields[SERIES] ?? ""),
    VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
    /* The tooltip feature overrides this, with the same colour darkened while read. */
    SLICE_FILL: code(
      "(slice) => (slice.data === undefined ? undefined : cScale(cAcc(slice.data)))",
    ),
    /* The legend feature overrides both. See the line chart for why the domain is set. */
    C_SCALE: code(
      "state.categories.length > 6\n      ? sszvis.scaleQual12().domain(state.categories)\n      : sszvis.scaleQual6().domain(state.categories)",
    ),
    BOTTOM_PADDING: code("60"),
    /* As in the vertical stack: the datum is a slice, and the roles read the row through it. */
    TOOLTIP_TEXT: tooltipText(
      "HTML",
      spec,
      {
        [CATEGORY]: { accessor: "sliceCategory", kind: "category" },
        [SERIES]: { accessor: "sliceSeries", kind: "category" },
        [VALUE]: {
          accessor: "sliceValue",
          kind: "number",
          suffix: str(option(UNIT)),
          missing: "keine",
        },
      },
      barChartHorizontalStacked.defaultTooltip,
      "Slice",
    ),
  }),
  tooltipFeature: TOOLTIP,
  defaultTooltip: { header: VALUE, body: [SERIES] },
  annotationAxes: ANNOTATION_AXES,
  implied: () => [],
  sample: "berufsfeld-jahr",
};
