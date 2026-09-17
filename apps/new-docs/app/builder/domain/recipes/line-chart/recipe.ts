import { referenceLinesCode } from "../../annotations";
import { code, str } from "../../emit";
import {
  ColumnName,
  DATE,
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

const ANNOTATION_AXES: readonly AnnotationAxis[] = [
  { role: DATE, axis: "x", kind: "date", label: "Date axis" },
  { role: VALUE, axis: "y", kind: "number", label: "Value axis" },
];

/* The option and feature keys, named once: they key `options`, `features` and every lookup. */
const X_LABEL_OPTION = OptionKey.make("xLabel");
const Y_LABEL_OPTION = OptionKey.make("yLabel");
const RULER = FeatureKey.make("ruler");
const LEGEND = FeatureKey.make("legend");
const POINTS = FeatureKey.make("points");
const REFERENCE_LINES_FEATURE = FeatureKey.make("reference-lines");

export const lineChart: RecipeDef = {
  key: RecipeKey.make("line-chart"),
  label: "Line",
  roles: [
    {
      key: DATE,
      label: "Date",
      kind: "date",
      hint: "Dates read 31.12.2024. Parsed with sszvis.parseDate; rows that fail to parse are dropped.",
    },
    { key: VALUE, label: "Value", kind: "number", hint: "The height of the line." },
    {
      key: SERIES,
      label: "Series",
      kind: "category",
      hint: "One line per distinct value. Leave empty for a single line.",
      optional: true,
    },
  ],
  options: [
    /* German: this reaches the chart, not the builder. See the README. */
    { key: TITLE, label: "Title", fallback: "Liniendiagramm" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    { key: X_LABEL_OPTION, label: "X axis label", fallback: "" },
    { key: Y_LABEL_OPTION, label: "Y axis label", fallback: "" },
  ],
  features: [RULER, LEGEND, POINTS, REFERENCE_LINES_FEATURE],
  scalars: (spec, option, column) => ({
    X_LABEL: str(option(X_LABEL_OPTION)),
    Y_LABEL: str(option(Y_LABEL_OPTION)),
    DATE_FIELD: str(spec.fields[DATE] ?? ""),
    /* A column of years is read by `parseYear`; `parseDate` would return null for
       every row of it and the chart would draw nothing. */
    DATE_PARSER: code(
      column(spec.fields[DATE] ?? ColumnName.make("")).dateFormat === "year"
        ? "sszvis.parseYear"
        : "sszvis.parseDate",
    ),
    VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
    /* An unmapped series emits `""`, not `d[""]`. */
    CATEGORY_EXPR:
      spec.fields[SERIES] === undefined || spec.fields[SERIES] === ""
        ? str("")
        : code(`d[${str(spec.fields[SERIES])}] ?? ""`),
    /* The legend feature overrides both, with a scale it has already laid out. This has
       to reach the same colours by itself, or unticking the legend would repaint the
       chart: `colorLegendLayout` picks its palette by the same count, and the domain is
       set because an sszvis qualitative scale declares an `unknown` colour, which stops
       d3 extending the domain implicitly and paints every series alike. */
    C_SCALE: code(
      "state.categories.length > 6\n      ? sszvis.scaleQual12().domain(state.categories)\n      : sszvis.scaleQual6().domain(state.categories)",
    ),
    BOTTOM_PADDING: code("45"),
    RULER_LABEL: tooltipText(
      "SVG",
      spec,
      {
        [DATE]: { accessor: "xAcc", kind: "date" },
        [VALUE]: { accessor: "yAcc", kind: "number" },
        [SERIES]: { accessor: "cAcc", kind: "category" },
      },
      lineChart.defaultTooltip,
    ),
    REFERENCE_LINES: referenceLinesCode(spec.annotations, ANNOTATION_AXES),
  }),
  tooltipFeature: RULER,
  defaultTooltip: { header: VALUE, body: [SERIES] },
  annotationAxes: ANNOTATION_AXES,
  implied: (spec) => (spec.annotations.length > 0 ? [REFERENCE_LINES_FEATURE] : []),
  sample: "zu-und-wegzuege",
};
