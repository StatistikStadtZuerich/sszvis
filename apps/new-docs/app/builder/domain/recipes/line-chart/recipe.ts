import { referenceLinesCode } from "../../annotations";
import { code, str } from "../../emit";
import {
  DESCRIPTION,
  FeatureKey,
  OptionKey,
  RecipeKey,
  RoleKey,
  TITLE,
  type AnnotationAxis,
  type RecipeDef,
} from "../../spec";
import { tooltipText } from "../../tooltip";

const ANNOTATION_AXES: readonly AnnotationAxis[] = [
  { axis: "x", kind: "date", label: "Date axis" },
  { axis: "y", kind: "number", label: "Value axis" },
];

/* The role keys, named once: they key `roles`, `spec.fields` and the ruler roles alike. */
const DATE = RoleKey.make("date");
const VALUE = RoleKey.make("value");
const SERIES = RoleKey.make("series");

/* The option and feature keys, named once for the same reason. */
const X_LABEL_OPTION = OptionKey.make("xLabel");
const Y_LABEL_OPTION = OptionKey.make("yLabel");
const RULER = FeatureKey.make("ruler");
const LEGEND = FeatureKey.make("legend");
const POINTS = FeatureKey.make("points");
const REFERENCE_LINES_FEATURE = FeatureKey.make("reference-lines");

export const lineChart: RecipeDef = {
  key: RecipeKey.make("line-chart"),
  label: "Line chart",
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
  scalars: (spec, option) => ({
    X_LABEL: str(option(X_LABEL_OPTION)),
    Y_LABEL: str(option(Y_LABEL_OPTION)),
    DATE_FIELD: str(spec.fields[DATE] ?? ""),
    VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
    /* An unmapped series emits `""`, not `d[""]`. */
    CATEGORY_EXPR:
      spec.fields[SERIES] === undefined || spec.fields[SERIES] === ""
        ? str("")
        : code(`d[${str(spec.fields[SERIES])}] ?? ""`),
    /* The legend feature overrides both. */
    C_SCALE: code("sszvis.scaleQual12()"),
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
