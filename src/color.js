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
 * @function divValGry Variation of the valued scale with a grey midpoint
 * @function divNtrGry Variation of the neutral scale with a grey midpoint
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 * Grey color scales
 * @function gry       1-color scale for shaded values
 * @function lightGry  1-color scale for shaded backgrounds
 */

import { scaleOrdinal, scaleLinear, hsl, rgb, mean, lab } from "d3";

/* Constants
----------------------------------------------- */
var LIGHTNESS_STEP = 0.6;

/* Scales
----------------------------------------------- */
function qualColorScale(colors) {
  return function () {
    var scale = scaleOrdinal().range(colors.map(convertLab));
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

export var scaleQual12 = qualColorScale([
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

export var scaleQual6 = qualColorScale([
  darkBlue,
  mediumRed,
  mediumGreen,
  lightBrown,
  lightBlue,
  mediumBrown,
]);

export var scaleQual6a = qualColorScale([
  "#782600",
  "#CC4309",
  "#FF720C",
  "#6B8EFF",
  "#3B51FF",
  "#2F2ABB",
]);

export var scaleQual6b = qualColorScale([
  "#A30059",
  "#DB247D",
  "#FF579E",
  "#55BC5D",
  "#1D942E",
  "#10652A",
]);

function seqColorScale(colors) {
  return function () {
    var scale = scaleLinear().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}

export var scaleSeqBlu = seqColorScale([darkBlue, mediumBlue, lightBlue]);
export var scaleSeqRed = seqColorScale([darkRed, mediumRed, lightRed]);
export var scaleSeqGrn = seqColorScale([darkGreen, mediumGreen, lightGreen]);
export var scaleSeqBrn = seqColorScale([darkBrown, mediumBrown, lightBrown]);

function divColorScale(colors) {
  return function () {
    var scale = scaleLinear().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}

export var scaleDivVal = divColorScale(["#A30059", "#FFFFFF", "#2F2ABB"]);
export var scaleDivValGry = divColorScale(["#A30059", "#F3F3F3", "#2F2ABB"]);
export var scaleDivNtr = divColorScale(["#782600", "#FFFFFF", "#10652A"]);
export var scaleDivNtrGry = divColorScale(["#782600", "#F3F3F3", "#10652A"]);

function greyColorScale(colors) {
  return function () {
    var scale = scaleOrdinal().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}

export var scaleLightGry = greyColorScale(["#FAFAFA"]);
export var scalePaleGry = greyColorScale(["#EAEAEA"]);
export var scaleGry = greyColorScale(["#D6D6D6"]);
export var scaleDimGry = greyColorScale(["#B8B8B8"]);
export var scaleMedGry = greyColorScale(["#7C7C7C"]);
export var scaleDeepGry = greyColorScale(["#545454"]);

export var slightlyDarker = function (c) {
  return hsl(c).darker(0.4);
};

export var muchDarker = function (c) {
  return hsl(c).darker(0.7);
};

export var withAlpha = function (c, a) {
  var rgbColor = rgb(c);
  return "rgba(" + rgbColor.r + "," + rgbColor.g + "," + rgbColor.b + "," + a + ")";
};

/* Scale extensions
----------------------------------------------- */
function decorateOrdinalScale(scale) {
  scale.darker = function () {
    return decorateOrdinalScale(
      scale.copy().range(scale.range().map(func("darker", LIGHTNESS_STEP)))
    );
  };
  scale.brighter = function () {
    return decorateOrdinalScale(
      scale.copy().range(scale.range().map(func("brighter", LIGHTNESS_STEP)))
    );
  };
  scale.reverse = function () {
    return decorateOrdinalScale(scale.copy().range(scale.range().reverse()));
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
  var nativeDomain = scale.domain;
  scale.domain = function (dom) {
    if (arguments.length === 1) {
      var threeDomain = [dom[0], mean(dom), dom[1]];
      return nativeDomain.call(this, threeDomain);
    } else {
      return nativeDomain.apply(this, arguments);
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
  var args = Array.prototype.slice.call(arguments, 1);
  return function (d) {
    return d[fName].apply(d, args);
  };
}
