import { code, type Safe } from "./emit";
import { FeatureKey, OptionKey, type Choice } from "./spec";

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

type PaletteKind = "sequential" | "diverging";

/** What the menu calls each family. Two, because the choice between them is a meaning. */
const GROUP: Record<PaletteKind, string> = {
  sequential: "Sequential",
  diverging: "Diverging",
};

export type Palette = {
  readonly value: string;
  readonly label: string;
  readonly kind: PaletteKind;
  /** The sszvis factory that builds the scale. */
  readonly scale: string;
  /** The scale's own stops, as CSS colours. The swatch is drawn from these. */
  readonly stops: readonly string[];
};

/*
 * The library's continuous scales, and only those. A choropleth shades an area by a number,
 * which rules out the qualitative scales - they are ordinal, keyed by a category name - and
 * the greys, which hold a single colour each.
 *
 * The names are read off the stops rather than out of the module's own doc comment, which
 * has gone stale: it calls `scaleDivVal` red-to-blue and `scaleDivNtr` brown-to-green, and
 * neither matches the colours those scales actually carry.
 *
 * `stops` is what each scale's `range()` returns, and `palettes.browser.test.ts` holds it to that.
 */
const PALETTES = [
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

export const palettes: readonly Palette[] = PALETTES;

/** The one every map draws in until someone picks another: 11 of the corpus's 15 use it. */
export const DEFAULT_PALETTE = PALETTES[0];

export const paletteFor = (value: string): Palette =>
  PALETTES.find((candidate) => candidate.value === value) ?? DEFAULT_PALETTE;

/** The menu the option is drawn as: a swatch and a name, under the name of its family. */
export const paletteChoices: readonly Choice[] = PALETTES.map(({ value, label, kind, stops }) => ({
  value,
  label,
  group: GROUP[kind],
  swatch: stops,
}));

export const isDiverging = (value: string): boolean => paletteFor(value).kind === "diverging";

/**
 * The scale the map colours its areas with.
 *
 * Which domain it reads is the palette's to decide, not the chart's. A sequential ramp runs
 * from zero to the largest value, which is what `valueDomain` already holds; a diverging one
 * needs its middle stop to sit where the values change sign, which is `colorDomain` - the
 * domain the diverging feature computes.
 */
export const colorScaleCode = (value: string): Safe => {
  const palette = paletteFor(value);
  const domain = palette.kind === "diverging" ? "state.colorDomain" : "state.valueDomain";
  return code(`sszvis.${palette.scale}().domain(${domain})`);
};
