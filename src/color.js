/**
 * Color scales
 *
 * Three kinds of color scales are provided: qualitative, sequential, and
 * diverging. All color scales can be reversed, qualitative color scales
 * can also be brightened or darkened.
 *
 * @module sszvis/color
 *
 *
 * Qualitative color scales
 *
 * @function qual12    The full range of categorical colors
 * @function qual6     Subset of saturated categorical colors
 * @function qual6a    Subset of blue-green categorical colors
 * @function qual6b    Subset of yellow-red categorical colors
 * @method   darken    Instance method to darken all colors. @returns new scale
 * @method   brighten  Instance method to brighten all colors. @returns new scale
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 *
 * Sequential color scales
 *
 * @function seqBlu    Linear color scale from bright to dark blue
 * @function seqRed    Linear color scale from bright to dark red
 * @function seqGrn    Linear color scale from bright to dark green
 * @function seqBrn    Linear color scale from bright to dark brown
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 *
 * Diverging color scales
 *
 * @function divVal    Diverging and valued color scale from red to blue
 * @function divNtr    Diverging and neutral color scale from brown to green
 * @function divValGry constiation of the valued scale with a grey midpoint
 * @function divNtrGry constiation of the neutral scale with a grey midpoint
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 * Grey color scales
 * @function gry       1-color scale for shaded values
 * @function lightGry  1-color scale for shaded backgrounds
 */

import { scaleOrdinal, scaleLinear, hsl, rgb, lab, mean, quantile } from "d3";

/* Constants
----------------------------------------------- */
const LIGHTNESS_STEP = 0.6;

/* Scales
----------------------------------------------- */
function qualColorScale(colors) {
  return function () {
    const scale = scaleOrdinal().range(colors.map(convertLab)).unknown(convertLab(colors[0]));
    return decorateOrdinalScale(scale);
  };
}

const darkBlue = "#3431DE";
const mediumBlue = "#0A8DF6";
const lightBlue = "#23C3F1";

const darkRed = "#7B4FB7";
const mediumRed = "#DB247D";
const lightRed = "#FB737E";

const darkGreen = "#007C78";
const mediumGreen = "#1D942E";
const lightGreen = "#99C32E";

const darkBrown = "#9A5B01";
const mediumBrown = "#FF720C";
const lightBrown = "#FBB900";

export const scaleQual12 = qualColorScale([
  darkBlue,
  mediumBlue,
  lightBlue,
  darkRed,
  mediumRed,
  lightRed,
  darkGreen,
  mediumGreen,
  lightGreen,
  darkBrown,
  mediumBrown,
  lightBrown,
]);

export const scaleQual6 = qualColorScale([
  darkBlue,
  mediumRed,
  mediumGreen,
  lightBrown,
  lightBlue,
  mediumBrown,
]);

export const scaleQual6a = qualColorScale([
  darkBlue,
  mediumBlue,
  lightBlue,
  darkRed,
  mediumRed,
  lightRed,
]);

export const scaleQual6b = qualColorScale([
  darkGreen,
  mediumGreen,
  lightGreen,
  darkBrown,
  mediumBrown,
  lightBrown,
]);

const female = "#349894";
const male = "#FFD736";
const misc = "#986AD5";

export const scaleGender3 = () =>
  qualColorScale([female, male, misc])().domain(["Frauen", "Männer", "Divers"]);

const swissFemale = "#00615D";
const foreignFemale = "#349894";
const swissMale = "#DA9C00";
const foreignMale = "#FFD736";
const swissMisc = "#5E359A";
const foreignMisc = "#986AD5";

export const scaleGender6Origin = () =>
  qualColorScale([
    swissFemale,
    foreignFemale,
    swissMale,
    foreignMale,
    swissMisc,
    foreignMisc,
  ])().domain([
    "Schweizerinnen",
    "Ausländerinnen",
    "Schweizer",
    "Ausländer",
    "Divers Schweiz",
    "Divers Ausland",
  ]);

const femaleFemale = "#349894";
const maleMale = "#FFD736";
const femaleMale = "#3431DE";
const femaleUnknown = "#B8B8B8";
const maleUnknown = "#D6D6D6";

export const scaleGender5Wedding = () =>
  qualColorScale([femaleFemale, maleMale, femaleMale, femaleUnknown, maleUnknown])().domain([
    "Frau / Frau",
    "Mann / Mann",
    "Frau / Mann",
    "Frau / Unbekannt",
    "Mann / Unbekannt",
  ]);

function seqColorScale(colors) {
  return function () {
    const scale = scaleLinear().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}

export const scaleSeqBlu = seqColorScale(["#CADEFF", "#5B6EFF", "#211A8A"]);
export const scaleSeqRed = seqColorScale(["#FED2EE", "#ED408D", "#7D0044"]);
export const scaleSeqGrn = seqColorScale(["#CFEED8", "#34B446", "#0C4B1F"]);
export const scaleSeqBrn = seqColorScale(["#FCDDBB", "#EA5D00", "#611F00"]);

function divColorScale(colors) {
  return function () {
    const scale = scaleLinear().range(colors.map(convertLab));
    return decorateDivScale(scale);
  };
}

export const scaleDivVal = divColorScale([
  "#611F00",
  "#A13200",
  "#EA5D00",
  "#FF9A54",
  "#FCDDBB",
  "#CADEFF",
  "#89AFFF",
  "#5B6EFF",
  "#3431DE",
  "#211A8A",
]);
export const scaleDivValGry = divColorScale([
  "#782600",
  "#CC4309",
  "#FF720C",
  "#FFBC88",
  "#E4E0DF",
  "#AECBFF",
  "#6B8EFF",
  "#3B51FF",
  "#2F2ABB",
]);
export const scaleDivNtr = divColorScale([
  "#7D0044",
  "#C4006A",
  "#ED408D",
  "#FF83B9",
  "#FED2EE",
  "#CFEED8",
  "#81C789",
  "#34B446",
  "#1A7F2D",
  "#0C4B1F",
]);
export const scaleDivNtrGry = divColorScale([
  "#A30059",
  "#DB247D",
  "#FF579E",
  "#FFA8D0",
  "#E4E0DF",
  "#A8DBB1",
  "#55BC5D",
  "#1D942E",
  "#10652A",
]);

function greyColorScale(colors) {
  return function () {
    const scale = scaleOrdinal().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}

export const scaleLightGry = greyColorScale(["#FAFAFA"]);
export const scalePaleGry = greyColorScale(["#EAEAEA"]);
export const scaleGry = greyColorScale(["#D6D6D6"]);
export const scaleDimGry = greyColorScale(["#B8B8B8"]);
export const scaleMedGry = greyColorScale(["#7C7C7C"]);
export const scaleDeepGry = greyColorScale(["#545454"]);

export const slightlyDarker = function (c) {
  return hsl(c).darker(0.4);
};

export const muchDarker = function (c) {
  return hsl(c).darker(0.7);
};

export const withAlpha = function (c, a) {
  const rgbColor = rgb(c);
  return "rgba(" + rgbColor.r + "," + rgbColor.g + "," + rgbColor.b + "," + a + ")";
};

/* Scale extensions
----------------------------------------------- */
function decorateOrdinalScale(scale) {
  scale.darker = function () {
    return decorateOrdinalScale(
      scale.copy().range(scale.range().map(lab).map(func("darker", LIGHTNESS_STEP)))
    );
  };
  scale.brighter = function () {
    return decorateOrdinalScale(
      scale.copy().range(scale.range().map(lab).map(func("brighter", LIGHTNESS_STEP)))
    );
  };
  scale.reverse = function () {
    return decorateOrdinalScale(scale.copy().range(scale.range().reverse()));
  };
  return scale;
}

function decorateDivScale(scale) {
  scale = interpolatedDivergentColorScale(scale);
  scale.reverse = function () {
    return decorateLinearScale(scale.copy().range(scale.range().reverse()));
  };
  return scale;
}

function interpolatedDivergentColorScale(scale) {
  const nativeDomain = scale.domain;
  if (!scale.range()) return scale;
  const length = scale.range().length;
  scale.domain = function (dom) {
    if (!dom) return nativeDomain.call(this);
    const xDomain = [];
    for (let i = 0; i < length; i++) {
      xDomain.push(quantile(dom, i / (length - 1)));
    }
    return nativeDomain.call(this, xDomain);
  };
  return scale;
}

function decorateLinearScale(scale) {
  scale = interpolatedColorScale(scale);
  scale.reverse = function () {
    return decorateLinearScale(scale.copy().range(scale.range().reverse()));
  };
  return scale;
}

function interpolatedColorScale(scale) {
  const nativeDomain = scale.domain;
  scale.domain = function (dom) {
    if (arguments.length === 1) {
      const threeDomain = [dom[0], mean(dom), dom[1]];
      return nativeDomain.call(this, threeDomain);
    } else {
      return Reflect.apply(nativeDomain, this, arguments);
    }
  };
  return scale;
}

/* Helper functions
----------------------------------------------- */
function convertLab(d) {
  return lab(d);
}

function func(fName) {
  const args = Array.prototype.slice.call(arguments, 1);
  return function (d) {
    return d[fName].apply(d, args);
  };
}
