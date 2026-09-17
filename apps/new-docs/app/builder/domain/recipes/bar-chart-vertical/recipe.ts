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

const ANNOTATION_AXES: readonly AnnotationAxis[] = [
  { role: VALUE, axis: "y", kind: "number", label: "Value axis" },
];

/* The option and feature keys, named once: they key `options`, `features` and every lookup. */
const SERIES_KEY = OptionKey.make("seriesKey");
const UNIT = OptionKey.make("unit");
const TOOLTIP = FeatureKey.make("tooltip");
const REFERENCE_LINES_FEATURE = FeatureKey.make("reference-lines");

export const barChartVertical: RecipeDef = {
  key: RecipeKey.make("bar-chart-vertical"),
  label: "Vertical bar chart",
  roles: [
    {
      key: CATEGORY,
      label: "Category",
      kind: "category",
      hint: "One bar per distinct value; labels the x axis.",
    },
    { key: VALUE, label: "Value", kind: "number", hint: "The height of the bar." },
  ],
  options: [
    /*
     * German, like every other default that reaches the chart rather than the
     * builder: `label` above names this recipe to the person building, and the
     * fallback names the chart to the public who reads it. See the README.
     */
    { key: TITLE, label: "Title", fallback: "Vertikales Balkendiagramm" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    { key: SERIES_KEY, label: "Series name", fallback: "Serie" },
    { key: UNIT, label: "Tooltip unit", fallback: "Einheiten" },
  ],
  /* No sort feature: the bars follow the row order of the data, which the table editor sorts. */
  features: [TOOLTIP, REFERENCE_LINES_FEATURE],
  scalars: (spec, option) => ({
    SERIES_KEY: str(option(SERIES_KEY)),
    CATEGORY_FIELD: str(spec.fields[CATEGORY] ?? ""),
    VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
    /* The tooltip feature overrides this. */
    BAR_FILL: code("barFill"),
    TOOLTIP_TEXT: tooltipText(
      "HTML",
      spec,
      {
        [CATEGORY]: { accessor: "xAcc", kind: "category" },
        [VALUE]: { accessor: "yAcc", kind: "number", suffix: str(option(UNIT)), missing: "keine" },
      },
      barChartVertical.defaultTooltip,
    ),
    REFERENCE_LINES: referenceLinesCode(spec.annotations, ANNOTATION_AXES),
  }),
  tooltipFeature: TOOLTIP,
  defaultTooltip: { header: VALUE, body: [] },
  annotationAxes: ANNOTATION_AXES,
  implied: (spec) => (spec.annotations.length > 0 ? [REFERENCE_LINES_FEATURE] : []),
  sample: "beschaeftigte-sektor",
};
