import { code, str } from "../../emit";
import {
  categoricalChoices,
  categoryScaleCode,
  DEFAULT_CATEGORY_PALETTE,
  PALETTE,
} from "../../palettes";
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

const ANNOTATION_AXES: readonly AnnotationAxis[] = [];

const X_LABEL_OPTION = OptionKey.make("xLabel");
const Y_LABEL_OPTION = OptionKey.make("yLabel");
const RULER = FeatureKey.make("ruler");
const LEGEND = FeatureKey.make("legend");

export const areaChartStacked: RecipeDef = {
  key: RecipeKey.make("area-chart-stacked"),
  label: "Stacked area",
  roles: [
    {
      key: DATE,
      label: "Date",
      kind: "date",
      hint: "Dates read 31.12.2024. Parsed with sszvis.parseDate; rows that fail to parse are dropped.",
    },
    { key: VALUE, label: "Value", kind: "number", hint: "The height of the band." },
    {
      key: SERIES,
      label: "Series",
      kind: "category",
      hint: "One band per distinct value. Leave empty for a single area.",
      optional: true,
    },
  ],
  options: [
    { key: TITLE, label: "Title", fallback: "Gestapeltes Flächendiagramm" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    { key: X_LABEL_OPTION, label: "X axis label", fallback: "" },
    { key: Y_LABEL_OPTION, label: "Y axis label", fallback: "" },
    {
      key: PALETTE,
      label: "Colours",
      hint: "How the series are told apart. The last three colour named values, and a value they do not know takes the first colour rather than one of its own.",
      fallback: DEFAULT_CATEGORY_PALETTE.value,
      choices: categoricalChoices,
      keyedTo: SERIES,
    },
  ],
  features: [RULER, LEGEND],
  scalars: (spec, option, column) => ({
    X_LABEL: str(option(X_LABEL_OPTION)),
    Y_LABEL: str(option(Y_LABEL_OPTION)),
    DATE_FIELD: str(spec.fields[DATE] ?? ""),
    DATE_PARSER: code(
      column(spec.fields[DATE] ?? ColumnName.make("")).dateFormat === "year"
        ? "sszvis.parseYear"
        : "sszvis.parseDate",
    ),
    VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
    CATEGORY_EXPR:
      spec.fields[SERIES] === undefined || spec.fields[SERIES] === ""
        ? str("")
        : code(`d[${str(spec.fields[SERIES])}] ?? ""`),
    C_SCALE: categoryScaleCode(option(PALETTE)),
    BOTTOM_PADDING: code("45"),

    X_TICK_VALUES: code("state.dates.length > 0 ? xScale.ticks(props.ticks) : []"),
    HIGHLIGHT_TICK: code("() => false"),
    TOOLTIP_TEXT: tooltipText(
      "HTML",
      spec,
      {
        [DATE]: { accessor: "pointDate", kind: "date" },
        [VALUE]: { accessor: "pointValue", kind: "number", missing: "keine" },
        [SERIES]: { accessor: "pointKey", kind: "category" },
      },
      areaChartStacked.defaultTooltip,
      "HighlightPoint",
    ),
  }),
  tooltipFeature: RULER,
  defaultTooltip: { header: VALUE, body: [SERIES] },
  annotationAxes: ANNOTATION_AXES,
  implied: () => [],
  sample: "zu-und-wegzuege",
};
