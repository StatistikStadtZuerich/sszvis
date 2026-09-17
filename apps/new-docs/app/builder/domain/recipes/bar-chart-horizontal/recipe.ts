import { referenceLinesCode } from "../../annotations";
import { code, str } from "../../emit";
import {
  CATEGORY,
  DESCRIPTION,
  FeatureKey,
  OptionKey,
  RecipeKey,
  TITLE,
  VALUE,
  type AnnotationAxis,
  type RecipeDef,
} from "../../spec";
import { tooltipText } from "../../tooltip";

/*
 * The same value axis as the vertical chart's, drawn along x. Stated as a role,
 * so a reference line the reader set on one survives the switch to the other -
 * see `carryAnnotations`.
 */
const ANNOTATION_AXES: readonly AnnotationAxis[] = [
  { role: VALUE, axis: "x", kind: "number", label: "Value axis" },
];

/* The option and feature keys, named once: they key `options`, `features` and every lookup. */
const SERIES_KEY = OptionKey.make("seriesKey");
const UNIT = OptionKey.make("unit");
const X_LABEL_OPTION = OptionKey.make("xLabel");
const TOOLTIP = FeatureKey.make("tooltip");
const REFERENCE_LINES_FEATURE = FeatureKey.make("reference-lines");

export const barChartHorizontal: RecipeDef = {
  key: RecipeKey.make("bar-chart-horizontal"),
  label: "Horizontal bar chart",
  roles: [
    {
      key: CATEGORY,
      label: "Category",
      kind: "category",
      hint: "One bar per distinct value; labels the y axis.",
    },
    { key: VALUE, label: "Value", kind: "number", hint: "The length of the bar." },
  ],
  options: [
    /* German: this reaches the chart, not the builder. See the README. */
    { key: TITLE, label: "Title", fallback: "Horizontales Balkendiagramm" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    { key: SERIES_KEY, label: "Series name", fallback: "Serie" },
    { key: X_LABEL_OPTION, label: "Value axis label", fallback: "" },
    { key: UNIT, label: "Tooltip unit", fallback: "Einheiten" },
  ],
  /* No sort feature: the bars follow the row order of the data, which the table editor sorts. */
  features: [TOOLTIP, REFERENCE_LINES_FEATURE],
  scalars: (spec, option) => ({
    SERIES_KEY: str(option(SERIES_KEY)),
    X_LABEL: str(option(X_LABEL_OPTION)),
    CATEGORY_FIELD: str(spec.fields[CATEGORY] ?? ""),
    VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
    // NOTE: Underscored in chart.ts because the template is linted as ordinary source,
    // where a binding only read through a hole looks unused. Keep the two names in step.
    /* The tooltip feature overrides this. */
    BAR_FILL: code("_barFill"),
    TOOLTIP_TEXT: tooltipText(
      "HTML",
      spec,
      {
        [CATEGORY]: { accessor: "cAcc", kind: "category" },
        [VALUE]: { accessor: "xAcc", kind: "number", suffix: str(option(UNIT)), missing: "keine" },
      },
      barChartHorizontal.defaultTooltip,
    ),
    REFERENCE_LINES: referenceLinesCode(spec.annotations, ANNOTATION_AXES),
  }),
  tooltipFeature: TOOLTIP,
  defaultTooltip: { header: VALUE, body: [] },
  annotationAxes: ANNOTATION_AXES,
  implied: (spec) => (spec.annotations.length > 0 ? [REFERENCE_LINES_FEATURE] : []),
  sample: "beschaeftigte-sektor",
};
