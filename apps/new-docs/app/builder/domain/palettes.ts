import { distinctValues, type Table } from "./csv";
import { code, type Safe } from "./emit";
import { FeatureKey, OptionKey, type Choice, type ColumnName } from "./spec";

/** The option a map's colours are chosen with. */
export const PALETTE = OptionKey.make("palette");

/**
 * The hidden feature a diverging palette switches on.
 *
 * A diverging ramp is only readable on a domain that straddles its middle stop, and the
 * map's `valueDomain` is anchored at zero for the bubble radii that also read it. So a
 * diverging palette brings a second domain of its own rather than widening that one.
 */
export const DIVERGING_FEATURE = FeatureKey.make("diverging");

/*
 * What a scale is for, which is also what decides how it is written down.
 *
 * `sequential` and `diverging` shade a number and take a domain of two bounds; `qualitative`
 * tells categories apart and takes the categories themselves; `keyed` is qualitative with
 * its domain already built in, naming the values it colours.
 */
type PaletteKind = "sequential" | "diverging" | "qualitative" | "keyed";

/** What the menu calls each family. The choice between families is a meaning, not a look. */
const GROUP: Record<PaletteKind, string> = {
  sequential: "Sequential",
  diverging: "Diverging",
  qualitative: "Categorical",
  keyed: "Gender",
};

export type Palette = {
  readonly value: string;
  readonly label: string;
  readonly kind: PaletteKind;
  /** The sszvis factory that builds the scale. Empty where the chart decides for itself. */
  readonly scale: string;
  /** The scale's own stops, as CSS colours. The swatch is drawn from these. */
  readonly stops: readonly string[];
  /** The values a keyed scale colours, which is the domain it carries. */
  readonly keys?: readonly string[];
};

/*
 * The continuous scales, for a chart that shades a number: a choropleth's areas.
 *
 * The qualitative scales are not here - they are ordinal, keyed by a category name - and
 * neither are the greys, which hold a single colour each.
 *
 * The names are read off the stops rather than out of the module's own doc comment, which
 * has gone stale: it calls `scaleDivVal` red-to-blue and `scaleDivNtr` brown-to-green, and
 * neither matches the colours those scales actually carry.
 *
 * `stops` is what each scale's `range()` returns, and `palettes.browser.test.ts` holds it
 * to that.
 */
const CONTINUOUS = [
  {
    value: "seq-blu",
    label: "Blue",
    kind: "sequential",
    scale: "scaleSeqBlu",
    stops: ["rgb(202, 222, 255)", "rgb(91, 110, 255)", "rgb(33, 26, 138)"],
  },
  {
    value: "seq-red",
    label: "Red",
    kind: "sequential",
    scale: "scaleSeqRed",
    stops: ["rgb(254, 210, 238)", "rgb(237, 64, 141)", "rgb(125, 0, 68)"],
  },
  {
    value: "seq-grn",
    label: "Green",
    kind: "sequential",
    scale: "scaleSeqGrn",
    stops: ["rgb(207, 238, 216)", "rgb(52, 180, 70)", "rgb(12, 75, 31)"],
  },
  {
    value: "seq-brn",
    label: "Brown",
    kind: "sequential",
    scale: "scaleSeqBrn",
    stops: ["rgb(252, 221, 187)", "rgb(234, 93, 0)", "rgb(97, 31, 0)"],
  },
  {
    value: "div-val",
    label: "Orange to blue",
    kind: "diverging",
    scale: "scaleDivVal",
    stops: [
      "rgb(97, 31, 0)",
      "rgb(161, 50, 0)",
      "rgb(234, 93, 0)",
      "rgb(255, 154, 84)",
      "rgb(252, 221, 187)",
      "rgb(202, 222, 255)",
      "rgb(137, 175, 255)",
      "rgb(91, 110, 255)",
      "rgb(52, 49, 222)",
      "rgb(33, 26, 138)",
    ],
  },
  {
    value: "div-val-gry",
    label: "Orange to blue, grey midpoint",
    kind: "diverging",
    scale: "scaleDivValGry",
    stops: [
      "rgb(120, 38, 0)",
      "rgb(204, 67, 9)",
      "rgb(255, 114, 12)",
      "rgb(255, 188, 136)",
      "rgb(228, 224, 223)",
      "rgb(174, 203, 255)",
      "rgb(107, 142, 255)",
      "rgb(59, 81, 255)",
      "rgb(47, 42, 187)",
    ],
  },
  {
    value: "div-ntr",
    label: "Pink to green",
    kind: "diverging",
    scale: "scaleDivNtr",
    stops: [
      "rgb(125, 0, 68)",
      "rgb(196, 0, 106)",
      "rgb(237, 64, 141)",
      "rgb(255, 131, 185)",
      "rgb(254, 210, 238)",
      "rgb(207, 238, 216)",
      "rgb(129, 199, 137)",
      "rgb(52, 180, 70)",
      "rgb(26, 127, 45)",
      "rgb(12, 75, 31)",
    ],
  },
  {
    value: "div-ntr-gry",
    label: "Pink to green, grey midpoint",
    kind: "diverging",
    scale: "scaleDivNtrGry",
    stops: [
      "rgb(163, 0, 89)",
      "rgb(219, 36, 125)",
      "rgb(255, 87, 158)",
      "rgb(255, 168, 208)",
      "rgb(228, 224, 223)",
      "rgb(168, 219, 177)",
      "rgb(85, 188, 93)",
      "rgb(29, 148, 46)",
      "rgb(16, 101, 42)",
    ],
  },
] as const satisfies readonly Palette[];

/**
 * The value that leaves the choice to the chart.
 *
 * Six colours up to six categories and twelve past that, which is what every one of these
 * recipes did before there was anything to choose and what `colorLegendLayout` still does
 * on its own. Its swatch is the six, since that is what most charts land on.
 */
const AUTOMATIC = {
  value: "auto",
  label: "Automatic",
  kind: "qualitative",
  scale: "",
  stops: [
    "rgb(52, 49, 222)",
    "rgb(219, 36, 125)",
    "rgb(29, 148, 46)",
    "rgb(251, 185, 0)",
    "rgb(35, 195, 241)",
    "rgb(255, 114, 12)",
  ],
} as const satisfies Palette;

/*
 * The scales for a chart that tells categories apart: a stack's slices, a line per series.
 *
 * The four `qual` scales take the chart's own categories as their domain. The three below
 * them already carry one - they colour named values, and Zurich's tables are full of them:
 * 62 charts in the reference corpus reach for a gender scale, which makes it the third most
 * common colouring there is. They name those values in their labels, because a category
 * they do not know is drawn in the scale's first colour rather than refused.
 */
const CATEGORICAL = [
  AUTOMATIC,
  {
    value: "qual12",
    label: "Twelve colours",
    kind: "qualitative",
    scale: "scaleQual12",
    stops: [
      "rgb(52, 49, 222)",
      "rgb(10, 141, 246)",
      "rgb(35, 195, 241)",
      "rgb(123, 79, 183)",
      "rgb(219, 36, 125)",
      "rgb(251, 115, 126)",
      "rgb(0, 124, 120)",
      "rgb(29, 148, 46)",
      "rgb(153, 195, 46)",
      "rgb(154, 91, 1)",
      "rgb(255, 114, 12)",
      "rgb(251, 185, 0)",
    ],
  },
  {
    value: "qual6",
    label: "Six colours",
    kind: "qualitative",
    scale: "scaleQual6",
    stops: [
      "rgb(52, 49, 222)",
      "rgb(219, 36, 125)",
      "rgb(29, 148, 46)",
      "rgb(251, 185, 0)",
      "rgb(35, 195, 241)",
      "rgb(255, 114, 12)",
    ],
  },
  {
    value: "qual6a",
    label: "Six blues and reds",
    kind: "qualitative",
    scale: "scaleQual6a",
    stops: [
      "rgb(52, 49, 222)",
      "rgb(10, 141, 246)",
      "rgb(35, 195, 241)",
      "rgb(123, 79, 183)",
      "rgb(219, 36, 125)",
      "rgb(251, 115, 126)",
    ],
  },
  {
    value: "qual6b",
    label: "Six greens and browns",
    kind: "qualitative",
    scale: "scaleQual6b",
    stops: [
      "rgb(0, 124, 120)",
      "rgb(29, 148, 46)",
      "rgb(153, 195, 46)",
      "rgb(154, 91, 1)",
      "rgb(255, 114, 12)",
      "rgb(251, 185, 0)",
    ],
  },
  {
    value: "gender3",
    label: "Frauen, Männer, Divers",
    kind: "keyed",
    scale: "scaleGender3",
    stops: ["rgb(52, 152, 148)", "rgb(255, 215, 54)", "rgb(152, 106, 213)"],
    keys: ["Frauen", "Männer", "Divers"],
  },
  {
    value: "gender6",
    label: "Schweizerinnen, Ausländerinnen, Schweizer, …",
    kind: "keyed",
    scale: "scaleGender6Origin",
    stops: [
      "rgb(0, 97, 93)",
      "rgb(52, 152, 148)",
      "rgb(218, 156, 0)",
      "rgb(255, 215, 54)",
      "rgb(94, 53, 154)",
      "rgb(152, 106, 213)",
    ],
    keys: [
      "Schweizerinnen",
      "Ausländerinnen",
      "Schweizer",
      "Ausländer",
      "Divers Schweiz",
      "Divers Ausland",
    ],
  },
  {
    value: "gender5",
    label: "Frau / Frau, Mann / Mann, Frau / Mann, …",
    kind: "keyed",
    scale: "scaleGender5Wedding",
    stops: [
      "rgb(52, 152, 148)",
      "rgb(255, 215, 54)",
      "rgb(52, 49, 222)",
      "rgb(184, 184, 184)",
      "rgb(214, 214, 214)",
    ],
    keys: ["Frau / Frau", "Mann / Mann", "Frau / Mann", "Frau / Unbekannt", "Mann / Unbekannt"],
  },
] as const satisfies readonly Palette[];

export const palettes: readonly Palette[] = [...CONTINUOUS, ...CATEGORICAL];

/** The one every map draws in until someone picks another: 11 of the corpus's 15 use it. */
export const DEFAULT_PALETTE = CONTINUOUS[0];

/** The one every categorical chart draws in until someone picks another. */
export const DEFAULT_CATEGORY_PALETTE = AUTOMATIC;

/*
 * Each menu is built from its own family and each lookup falls back within it, so a spec
 * carrying a palette its chart cannot use - a map saved as `qual6`, a stack saved as
 * `div-ntr`, either of them saved before the list was as long as it is - draws in that
 * chart's own default rather than emitting a scale that makes no sense for it.
 */
const find = (from: readonly Palette[], value: string, fallback: Palette): Palette =>
  from.find((candidate) => candidate.value === value) ?? fallback;

const continuousFor = (value: string): Palette => find(CONTINUOUS, value, DEFAULT_PALETTE);

const categoricalFor = (value: string): Palette => find(CATEGORICAL, value, AUTOMATIC);

const seriesFor = (value: string): Palette => find(SERIES_PALETTES, value, DEFAULT_SERIES_PALETTE);

/** The menu a family is drawn as: a swatch and a name, under the name of its own family. */
const choicesOf = (from: readonly Palette[]): readonly Choice[] =>
  from.map(({ value, label, kind, stops, scale, keys }) => ({
    value,
    label,
    /* The automatic one belongs to no family: it stands for whichever the chart picks. */
    ...(scale === "" ? {} : { group: GROUP[kind] }),
    ...(keys === undefined ? {} : { expects: keys }),
    swatch: {
      colors: stops,
      /* A continuous scale interpolates between its stops; a categorical one does not. */
      blend: kind === "sequential" || kind === "diverging",
    },
  }));

/*
 * What a chart with one series can be drawn in.
 *
 * The four `qual` scales and nothing else. Automatic has nothing to decide where there is
 * one colour to pick, and a keyed scale colours values the chart does not have: its series
 * is a name the author typed, not a column of them, so it would take the scale's first
 * colour and say nothing about why.
 */
const SERIES_PALETTES = CATEGORICAL.filter(
  (palette) => palette.kind === "qualitative" && palette.scale !== "",
);

/** What a single series is drawn in until someone picks another: what it was before. */
export const DEFAULT_SERIES_PALETTE = SERIES_PALETTES[0];

export const continuousChoices: readonly Choice[] = choicesOf(CONTINUOUS);

export const categoricalChoices: readonly Choice[] = choicesOf(CATEGORICAL);

export const seriesChoices: readonly Choice[] = choicesOf(SERIES_PALETTES);

export const isDiverging = (value: string): boolean => continuousFor(value).kind === "diverging";

/**
 * The scale a map colours its areas with.
 *
 * Which domain it reads is the palette's to decide, not the chart's. A sequential ramp runs
 * from zero to the largest value, which is what `valueDomain` already holds; a diverging one
 * needs its middle stop to sit where the values change sign, which is `colorDomain` - the
 * domain the diverging feature computes.
 */
export const colorScaleCode = (value: string): Safe => {
  const palette = continuousFor(value);
  const domain = palette.kind === "diverging" ? "state.colorDomain" : "state.valueDomain";
  return code(`sszvis.${palette.scale}().domain(${domain})`);
};

/* Written out the way the recipes wrote it before there was anything to choose, so that a
   chart left on Automatic emits what it always did. */
const AUTOMATIC_CODE = code(
  "state.categories.length > 6\n      ? sszvis.scaleQual12().domain(state.categories)\n      : sszvis.scaleQual6().domain(state.categories)",
);

/**
 * The scale a chart tells its categories apart with.
 *
 * A `qual` scale is given the chart's categories as its domain, and has to be: an sszvis
 * qualitative scale declares an `unknown` colour, which stops d3 extending the domain
 * implicitly and paints every category alike. A keyed scale is left as it is, because the
 * domain it already carries is the whole point of choosing it.
 */
export const categoryScaleCode = (value: string): Safe => {
  const palette = categoricalFor(value);
  if (palette.scale === "") return AUTOMATIC_CODE;
  return palette.kind === "keyed"
    ? code(`sszvis.${palette.scale}()`)
    : code(`sszvis.${palette.scale}().domain(state.categories)`);
};

/**
 * The values in `column` that `choice` will not be colouring.
 *
 * A scale carrying its own domain is chosen precisely so that a value always gets the same
 * colour - Frauen teal wherever it appears. The cost is that it has nothing to say about a
 * value it was not built for: that one takes the scale's first colour, and the legend is
 * labelled from the scale's domain rather than the chart's, so a stack of four occupations
 * drawn in a gender scale comes out one colour under a legend reading Frauen, Männer,
 * Divers. Both are worth saying out loud before the chart is taken away.
 *
 * Empty for a choice that colours positions rather than values, which is most of them.
 */
export const unkeyedValues = (
  choice: Choice | undefined,
  table: Table,
  column: ColumnName | undefined,
): readonly string[] => {
  const expects = choice?.expects;
  if (expects === undefined || column === undefined || column === "") return [];
  return distinctValues(table, column).filter((value) => !expects.includes(value));
};

/**
 * The scale a chart with a single series is drawn with.
 *
 * Its one series is named rather than read from a column, and that name is the scale's
 * whole domain. Setting it is what makes the scale work at all: an sszvis qualitative
 * scale declares an `unknown` colour, so a scale with no domain hands back its first
 * colour for every key - and, worse, goes on doing so after `darker()`, which is why the
 * highlight a tooltip draws was the same colour as the bar underneath it.
 */
export const seriesScaleCode = (value: string): Safe =>
  code(`sszvis.${seriesFor(value).scale}().domain([SERIES_KEY])`);
