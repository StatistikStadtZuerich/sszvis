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
  return function() {
    var scale = scaleOrdinal().range(colors.map(convertLab));
    return decorateOrdinalScale(scale);
  };
}

export var scaleQual12 = qualColorScale([
  "#5182B3",
  "#B8CFE6",
  "#60BF97",
  "#B8E6D2",
  "#94BF69",
  "#CFE6B8",
  "#E6CF73",
  "#FAEBAF",
  "#E67D73",
  "#F2CEC2",
  "#CC6788",
  "#E6B7C7"
]);
export var scaleQual6 = qualColorScale([
  "#5182B3",
  "#60BF97",
  "#94BF69",
  "#E6CF73",
  "#E67D73",
  "#CC6788"
]);
export var scaleQual6a = qualColorScale([
  "#5182B3",
  "#B8CFE6",
  "#60BF97",
  "#B8E6D2",
  "#94BF69",
  "#CFE6B8"
]);
export var scaleQual6b = qualColorScale([
  "#E6CF73",
  "#FAEBAF",
  "#E67D73",
  "#F2CEC2",
  "#CC6788",
  "#E6B7C7"
]);

function seqColorScale(colors) {
  return function() {
    var scale = scaleLinear().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}

export var scaleSeqBlu = seqColorScale(["#DDE9FE", "#3B76B3", "#343F4D"]);
export var scaleSeqRed = seqColorScale(["#FEECEC", "#CC6171", "#4D353A"]);
export var scaleSeqGrn = seqColorScale(["#D2DFDE", "#4A807C", "#2C3C3F"]);
export var scaleSeqBrn = seqColorScale(["#E9DFD6", "#A67D5A", "#4C3735"]);

function divColorScale(colors) {
  return function() {
    var scale = scaleLinear().range(colors.map(convertLab));
    return decorateLinearScale(scale);
  };
}

export var scaleDivVal = divColorScale(["#CC6171", "#FFFFFF", "#3B76B3"]);
export var scaleDivValGry = divColorScale(["#CC6171", "#F3F3F3", "#3B76B3"]);
export var scaleDivNtr = divColorScale(["#A67D5A", "#FFFFFF", "#4A807C"]);
export var scaleDivNtrGry = divColorScale(["#A67D5A", "#F3F3F3", "#4A807C"]);

function greyColorScale(colors) {
  return function() {
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

export var slightlyDarker = function(c) {
  return hsl(c).darker(0.4);
};

export var muchDarker = function(c) {
  return hsl(c).darker(0.7);
};

export var withAlpha = function(c, a) {
  var rgbColor = rgb(c);
  return "rgba(" + rgbColor.r + "," + rgbColor.g + "," + rgbColor.b + "," + a + ")";
};

/* Scale extensions
----------------------------------------------- */
function decorateOrdinalScale(scale) {
  scale.darker = function() {
    return decorateOrdinalScale(
      scale.copy().range(scale.range().map(func("darker", LIGHTNESS_STEP)))
    );
  };
  scale.brighter = function() {
    return decorateOrdinalScale(
      scale.copy().range(scale.range().map(func("brighter", LIGHTNESS_STEP)))
    );
  };
  scale.reverse = function() {
    return decorateOrdinalScale(scale.copy().range(scale.range().reverse()));
  };
  return scale;
}

function decorateLinearScale(scale) {
  scale = interpolatedColorScale(scale);
  scale.reverse = function() {
    return decorateLinearScale(scale.copy().range(scale.range().reverse()));
  };
  return scale;
}

function interpolatedColorScale(scale) {
  var nativeDomain = scale.domain;
  scale.domain = function(dom) {
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
  return function(d) {
    return d[fName].apply(d, args);
  };
}
