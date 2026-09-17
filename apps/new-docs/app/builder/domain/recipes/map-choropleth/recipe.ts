import { code, str } from "../../emit";
import {
  DESCRIPTION,
  FeatureKey,
  GEO,
  GEO_LABEL,
  OptionKey,
  RecipeKey,
  TITLE,
  VALUE,
  type AnnotationAxis,
  type RecipeDef,
} from "../../spec";
import { tooltipText } from "../../tooltip";

/*
 * None. A choropleth has no value axis to draw a line on - its scale is a run of
 * colours, not a distance - so the annotations the other recipes offer have
 * nowhere to land here.
 */
const ANNOTATION_AXES: readonly AnnotationAxis[] = [];

/** The file every geography of Zurich itself is a layer of. */
const ZURICH = "stadt-zurich.json";

/**
 * The geographies the chart can draw, and what each one is called inside its
 * topology. `lake` and `lakeBounds` are separate because they vary apart: the
 * agglomeration has a lake but no shoreline mesh, the statistical zones cover the
 * water with zones of their own, and Switzerland has neither.
 */
type Geography = {
  readonly value: string;
  readonly label: string;
  readonly file: string;
  readonly layer: string;
  readonly lake?: string;
  readonly lakeBounds?: string;
};

const GEOGRAPHIES = [
  {
    value: "statistische-quartiere",
    label: "Statistische Quartiere",
    file: ZURICH,
    layer: "statistische_quartiere",
    lake: "lakezurich",
    lakeBounds: "statistische_quartiere_lakebounds",
  },
  {
    value: "stadtkreise",
    label: "Stadtkreise",
    file: ZURICH,
    layer: "stadtkreise",
    lake: "lakezurich",
    lakeBounds: "stadtkreis_lakebounds",
  },
  {
    value: "wahlkreise",
    label: "Wahlkreise",
    file: ZURICH,
    layer: "wahlkreise",
    lake: "lakezurich",
    lakeBounds: "wahlkreis_lakebounds",
  },
  /* No lake: the zones tile the water too, so an overlay would hide four of them. */
  {
    value: "statistische-zonen",
    label: "Statistische Zonen",
    file: ZURICH,
    layer: "statistische_zonen",
  },
  /* A lake without a shoreline mesh: this topology carries no matching bounds layer. */
  {
    value: "agglomeration",
    label: "Agglomeration",
    file: "agglomeration-zurich.json",
    layer: "agglomeration",
    lake: "lakezurich_lakegreifen",
  },
  { value: "switzerland", label: "Schweizer Kantone", file: "switzerland.json", layer: "cantons" },
] as const satisfies readonly Geography[];

const GEOGRAPHY_OPTION = OptionKey.make("geography");
const TOOLTIP = FeatureKey.make("tooltip");
const LEGEND = FeatureKey.make("legend");
const BUBBLE = FeatureKey.make("bubble");
const LAKE = FeatureKey.make("lake");
const LAKE_BOUNDS = FeatureKey.make("lake-bounds");

/** The default is the one the corpus reaches for most: 54 of its 68 maps. */
const DEFAULT_GEOGRAPHY = GEOGRAPHIES[0];

const geographyFor = (value: string): Geography =>
  GEOGRAPHIES.find((candidate) => candidate.value === value) ?? DEFAULT_GEOGRAPHY;

/** Where the builder reads a topology from. The app serves the same files the examples use. */
const TOPO_SOURCE = "/preview/_static/topo/";
/** What it is called in the exported bundle, beside the data. */
const TOPO_PATH = "topo.json";

export const mapChoropleth: RecipeDef = {
  key: RecipeKey.make("map-choropleth"),
  label: "Map",
  roles: [
    {
      key: GEO,
      label: "Area code",
      /*
       * Numeric, because the published tables number their areas - Qcode, QuarSort,
       * KreisCd, Stadtquartiernummer - and saying so is what makes the column bind to
       * this role rather than to the value. The Wahlkreise are the exception, being
       * called things like "1 + 2", and their column is still selectable by hand.
       */
      kind: "number",
      hint: "The number identifying the area, which is what the geometry is matched on.",
    },
    {
      key: VALUE,
      label: "Value",
      kind: "number",
      hint: "The shade of the area. An area with no row, or no number, is hatched instead.",
    },
    {
      key: GEO_LABEL,
      label: "Area name",
      kind: "category",
      hint: "What the tooltip calls the area. Falls back to the code when left unset.",
      optional: true,
    },
  ],
  options: [
    { key: TITLE, label: "Title", fallback: "Karte" },
    { key: DESCRIPTION, label: "Description", fallback: "" },
    {
      key: GEOGRAPHY_OPTION,
      label: "Geography",
      fallback: DEFAULT_GEOGRAPHY.value,
      choices: GEOGRAPHIES.map(({ value, label }) => ({ value, label })),
    },
  ],
  /* Bubbles after the legend: it overrides which legend the legend feature draws. */
  features: [TOOLTIP, LEGEND, BUBBLE, LAKE, LAKE_BOUNDS],
  assets: (_spec, option) => [
    {
      key: "topology",
      path: TOPO_PATH,
      source: `${TOPO_SOURCE}${geographyFor(option(GEOGRAPHY_OPTION)).file}`,
    },
  ],
  scripts: ["topojson"],
  scalars: (spec, option, _kind) => {
    const geography = geographyFor(option(GEOGRAPHY_OPTION));
    const labelField = spec.fields[GEO_LABEL] ?? "";
    return {
      TOPO_PATH: str(TOPO_PATH),
      LAYER: str(geography.layer),
      LAKE_LAYER: str(geography.lake ?? ""),
      LAKE_BOUNDS_LAYER: str(geography.lakeBounds ?? ""),
      GEO_FIELD: str(spec.fields[GEO] ?? ""),
      VALUE_FIELD: str(spec.fields[VALUE] ?? ""),
      /* With no name column the tooltip still has to call the area something, and the code is what it has. */
      LABEL_EXPR: code(
        `d[${str(labelField === "" ? (spec.fields[GEO] ?? "") : labelField)}] ?? ""`,
      ),
      COLOR_SCALE: code("sszvis.scaleSeqBlu().domain(state.valueDomain)"),
      /* The bubble feature takes the colour out of the base map and puts it in the circles. */
      MAP_FILL: code('(d) => (d === undefined ? "none" : colorScale(d.value))'),
      LEGEND_X: code("bounds.width / 2 - props.legendWidth / 2"),
      LEGEND_COMPONENT: code(
        "sszvis\n  .legendColorLinear()\n  .scale(colorScale)\n  .width(props.legendWidth)\n  .labelFormat(sszvis.formatNumber)",
      ),
      /* The legend feature overrides this to make room for itself below the map. */
      BOTTOM_PADDING: code("30"),
      TOOLTIP_TEXT: tooltipText(
        "HTML",
        spec,
        {
          [GEO_LABEL]: { accessor: "labelAcc", kind: "category" },
          [GEO]: { accessor: "codeAcc", kind: "category" },
          [VALUE]: { accessor: "vAcc", kind: "number", missing: "keine Daten" },
        },
        mapChoropleth.defaultTooltip,
        "MapDatum",
      ),
    };
  },
  tooltipFeature: TOOLTIP,
  defaultTooltip: { header: GEO_LABEL, body: [VALUE] },
  annotationAxes: ANNOTATION_AXES,
  /* The geography decides these, not the reader: a lake is drawn where there is one to draw. */
  implied: (spec) => {
    const geography = geographyFor(spec.options[GEOGRAPHY_OPTION] ?? DEFAULT_GEOGRAPHY.value);
    return [
      ...(geography.lake === undefined ? [] : [LAKE]),
      ...(geography.lakeBounds === undefined ? [] : [LAKE_BOUNDS]),
    ];
  },
  sample: "auslaenderanteil-quartier",
};
