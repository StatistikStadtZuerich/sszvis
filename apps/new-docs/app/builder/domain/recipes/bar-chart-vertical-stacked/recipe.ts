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
 * No annotation axis, for the reason the stacked area gives: the value axis
 * measures the stack's running total, so a line across it is not a comparison
 * against any one slice.
 */
const ANNOTATION_AXES: readonly AnnotationAxis[] = [];

/* The option and feature keys, named once: they key `options`, `features` and every lookup. */
const X_LABEL_OPTION = OptionKey.make("xLabel");
const Y_LABEL_OPTION = OptionKey.make("yLabel");
const UNIT = OptionKey.make("unit");
const TOOLTIP = FeatureKey.make("tooltip");
const LEGEND = FeatureKey.make("legend");

export const barChartVerticalStacked: RecipeDef = {
  key: RecipeKey.make("bar-chart-vertical-stacked"),
  label: "Stacked bar",
  roles: [
    {
      key: CATEGORY,
      label: "Category",
      kind: "category",
      hint: "One bar per distinct value; labels the x axis.",
    },
    {
      key: SERIES,
      label: "Series",
      kind: "category",
      hint: "One slice per distinct value, stacked within each bar.",
    },
    { key: VALUE, label: "Value", kind: "number", hint: "The height of the slice." },
  ],
  options: [
    /* German: this reaches the chart, not the builder. See the README. */
    { key: TITLE, label: "Title", fallback: "Gestapeltes Balkendiagramm" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    { key: X_LABEL_OPTION, label: "X axis label", fallback: "" },
    { key: Y_LABEL_OPTION, label: "Y axis label", fallback: "" },
    { key: UNIT, label: "Tooltip unit", fallback: "" },
  ],
  features: [TOOLTIP, LEGEND],
  scalars: (spec, option) => ({
    X_LABEL: str(option(X_LABEL_OPTION)),
    Y_LABEL: str(option(Y_LABEL_OPTION)),
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
    /*
     * The tooltip's datum is a slice rather than a row, but every slice carries the
     * row it was built from, so the roles stay the ordinary ones and read through it.
     */
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
      barChartVerticalStacked.defaultTooltip,
      "Slice",
    ),
  }),
  tooltipFeature: TOOLTIP,
  defaultTooltip: { header: VALUE, body: [SERIES] },
  annotationAxes: ANNOTATION_AXES,
  implied: () => [],
  sample: "berufsfeld-jahr",
};
