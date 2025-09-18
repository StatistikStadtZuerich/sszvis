import { hsl, scaleOrdinal, scaleLinear, rgb, lab, mean, quantile } from 'd3';

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
/* Constants
----------------------------------------------- */
const LIGHTNESS_STEP = 1;
/* Scales
----------------------------------------------- */
function qualColorScale(colors) {
  return () => {
    const scale = scaleOrdinal().range(colors.map(convertLab));
    // Set unknown to first color without the type constraint
    scale.unknown(convertLab(colors[0]));
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
const scaleQual12 = qualColorScale([darkBlue, mediumBlue, lightBlue, darkRed, mediumRed, lightRed, darkGreen, mediumGreen, lightGreen, darkBrown, mediumBrown, lightBrown]);
const scaleQual6 = qualColorScale([darkBlue, mediumRed, mediumGreen, lightBrown, lightBlue, mediumBrown]);
const scaleQual6a = qualColorScale([darkBlue, mediumBlue, lightBlue, darkRed, mediumRed, lightRed]);
const scaleQual6b = qualColorScale([darkGreen, mediumGreen, lightGreen, darkBrown, mediumBrown, lightBrown]);
const female = "#349894";
const male = "#FFD736";
const misc = "#986AD5";
const scaleGender3 = () => qualColorScale([female, male, misc])().domain(["Frauen", "Männer", "Divers"]);
const swissFemale = "#00615D";
const foreignFemale = "#349894";
const swissMale = "#DA9C00";
const foreignMale = "#FFD736";
const swissMisc = "#5E359A";
const foreignMisc = "#986AD5";
const scaleGender6Origin = () => qualColorScale([swissFemale, foreignFemale, swissMale, foreignMale, swissMisc, foreignMisc])().domain(["Schweizerinnen", "Ausländerinnen", "Schweizer", "Ausländer", "Divers Schweiz", "Divers Ausland"]);
const femaleFemale = "#349894";
const maleMale = "#FFD736";
const femaleMale = "#3431DE";
const femaleUnknown = "#B8B8B8";
const maleUnknown = "#D6D6D6";
const scaleGender5Wedding = () => qualColorScale([femaleFemale, maleMale, femaleMale, femaleUnknown, maleUnknown])().domain(["Frau / Frau", "Mann / Mann", "Frau / Mann", "Frau / Unbekannt", "Mann / Unbekannt"]);
function seqColorScale(colors) {
  return () => {
    const scale = scaleLinear().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}
const scaleSeqBlu = seqColorScale(["#CADEFF", "#5B6EFF", "#211A8A"]);
const scaleSeqRed = seqColorScale(["#FED2EE", "#ED408D", "#7D0044"]);
const scaleSeqGrn = seqColorScale(["#CFEED8", "#34B446", "#0C4B1F"]);
const scaleSeqBrn = seqColorScale(["#FCDDBB", "#EA5D00", "#611F00"]);
function divColorScale(colors) {
  return () => {
    const scale = scaleLinear().range(colors.map(convertLab));
    return decorateDivScale(scale);
  };
}
const scaleDivVal = divColorScale(["#611F00", "#A13200", "#EA5D00", "#FF9A54", "#FCDDBB", "#CADEFF", "#89AFFF", "#5B6EFF", "#3431DE", "#211A8A"]);
const scaleDivValGry = divColorScale(["#782600", "#CC4309", "#FF720C", "#FFBC88", "#E4E0DF", "#AECBFF", "#6B8EFF", "#3B51FF", "#2F2ABB"]);
const scaleDivNtr = divColorScale(["#7D0044", "#C4006A", "#ED408D", "#FF83B9", "#FED2EE", "#CFEED8", "#81C789", "#34B446", "#1A7F2D", "#0C4B1F"]);
const scaleDivNtrGry = divColorScale(["#A30059", "#DB247D", "#FF579E", "#FFA8D0", "#E4E0DF", "#A8DBB1", "#55BC5D", "#1D942E", "#10652A"]);
function greyColorScale(colors) {
  return () => {
    // Grey color scales are really ordinal but we treat them like linear for the API
    const scale = scaleOrdinal().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}
const scaleLightGry = greyColorScale(["#FAFAFA"]);
const scalePaleGry = greyColorScale(["#EAEAEA"]);
const scaleGry = greyColorScale(["#D6D6D6"]);
const scaleDimGry = greyColorScale(["#B8B8B8"]);
const scaleMedGry = greyColorScale(["#7C7C7C"]);
const scaleDeepGry = greyColorScale(["#545454"]);
const slightlyDarker = c => hsl(c).darker(0.4);
const muchDarker = c => hsl(c).darker(0.7);
const withAlpha = (c, a) => {
  const rgbColor = rgb(c);
  return "rgba(".concat(rgbColor.r, ",").concat(rgbColor.g, ",").concat(rgbColor.b, ",").concat(a, ")");
};
/* Scale extensions
----------------------------------------------- */
function decorateOrdinalScale(scale) {
  const enhancedScale = scale;
  enhancedScale.darker = () => decorateOrdinalScale(scale.copy().range(scale.range().map(d => d.brighter(LIGHTNESS_STEP))));
  enhancedScale.brighter = () => decorateOrdinalScale(scale.copy().range(scale.range().map(d => d.darker(LIGHTNESS_STEP))));
  enhancedScale.reverse = () => decorateOrdinalScale(scale.copy().range(scale.range().reverse()));
  return enhancedScale;
}
function decorateDivScale(scale) {
  const enhancedScale = interpolatedDivergentColorScale(scale);
  enhancedScale.reverse = () => decorateLinearScale(scale.copy().range(scale.range().reverse()));
  return enhancedScale;
}
function interpolatedDivergentColorScale(scale) {
  const nativeDomain = scale.domain;
  if (!scale.range()) return scale;
  const length = scale.range().length;
  scale.domain = function (dom) {
    if (!dom) return nativeDomain.call(this, []);
    const xDomain = [];
    for (let i = 0; i < length; i++) {
      xDomain.push(quantile(dom, i / (length - 1)) || 0);
    }
    return nativeDomain.call(this, xDomain);
  };
  return scale;
}
function decorateLinearScale(scale) {
  // Only apply interpolation to actual linear scales, not ordinal scales used for grey
  const processedScale = "interpolate" in scale ? interpolatedColorScale(scale) : scale;
  const enhancedScale = processedScale;
  enhancedScale.reverse = () => {
    const copiedScale = "copy" in scale ? scale.copy() : scale;
    return decorateLinearScale(copiedScale.range(scale.range().reverse()));
  };
  return enhancedScale;
}
function interpolatedColorScale(scale) {
  const nativeDomain = scale.domain;
  scale.domain = function (dom) {
    if (arguments.length === 1 && dom && dom.length === 2) {
      const threeDomain = [dom[0], mean(dom) || 0, dom[1]];
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

export { muchDarker, scaleDeepGry, scaleDimGry, scaleDivNtr, scaleDivNtrGry, scaleDivVal, scaleDivValGry, scaleGender3, scaleGender5Wedding, scaleGender6Origin, scaleGry, scaleLightGry, scaleMedGry, scalePaleGry, scaleQual12, scaleQual6, scaleQual6a, scaleQual6b, scaleSeqBlu, scaleSeqBrn, scaleSeqGrn, scaleSeqRed, slightlyDarker, withAlpha };
//# sourceMappingURL=color.js.map
