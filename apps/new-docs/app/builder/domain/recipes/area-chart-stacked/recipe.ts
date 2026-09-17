import { code, str } from "../../emit";
import {
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

/*
 * No annotation axis. A reference line on the value axis would sit against the
 * stack's running total rather than against any one band, which reads as a
 * comparison the chart cannot support - so the recipe offers none rather than
 * drawing a line whose meaning depends on the layer order.
 */
const ANNOTATION_AXES: readonly AnnotationAxis[] = [];

/* The option and feature keys, named once: they key `options`, `features` and every lookup. */
const X_LABEL_OPTION = OptionKey.make("xLabel");
const Y_LABEL_OPTION = OptionKey.make("yLabel");
const RULER = FeatureKey.make("ruler");
const LEGEND = FeatureKey.make("legend");

export const areaChartStacked: RecipeDef = {
  key: RecipeKey.make("area-chart-stacked"),
  label: "Stacked area chart",
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
    /* German: this reaches the chart, not the builder. See the README. */
    { key: TITLE, label: "Title", fallback: "Gestapeltes Flächendiagramm" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    { key: X_LABEL_OPTION, label: "X axis label", fallback: "" },
    { key: Y_LABEL_OPTION, label: "Y axis label", fallback: "" },
  ],
  features: [RULER, LEGEND],
  scalars: (spec, option) => ({
    X_LABEL: str(option(X_LABEL_OPTION)),
    Y_LABEL: str(option(Y_LABEL_OPTION)),
    DATE_FIELD: str(spec.fields[DATE] ?? ""),
    VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
    /* An unmapped series emits `""`, which stacks every row into one band. */
    CATEGORY_EXPR:
      spec.fields[SERIES] === undefined || spec.fields[SERIES] === ""
        ? str("")
        : code(`d[${str(spec.fields[SERIES])}] ?? ""`),
    /* The legend feature overrides both, with a scale it has already laid out. See the line chart. */
    C_SCALE: code(
      "state.categories.length > 6\n      ? sszvis.scaleQual12().domain(state.categories)\n      : sszvis.scaleQual6().domain(state.categories)",
    ),
    BOTTOM_PADDING: code("45"),
    /*
     * The ruler feature overrides both; without it no tick is singled out.
     *
     * No ticks when every date row was dropped: `timeExtent` falls back to `new Date()`,
     * so the axis would otherwise label an empty chart with this afternoon.
     */
    X_TICK_VALUES: code("state.dates.length > 0 ? xScale.ticks(props.ticks) : []"),
    HIGHLIGHT_TICK: code("() => false"),
    /* The ruler's datum is a point on a band rather than a CSV row, so these are its own accessors. */
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
