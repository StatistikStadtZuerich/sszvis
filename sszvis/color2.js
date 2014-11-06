/**
 * @module sszvis/color
 *
 * THIS IS ONLY A DRAFT OF A REVISION OF THE API AND IS NOT PART OF sszvis.js AT THE MOMENT
 *
 * instead of nested objects, this module exposes an api of just functions
 *
 * qual
 * seqBlu
 * seqRed
 * seqGrn
 * seqBrn
 * divBlu
 * divBluAlt
 * divGrn
 * divGrnAlt
 *
 * darker
 */
namespace('sszvis.color2', function(module) {
  'use strict';

  var DARKEN = 0.6;

  var QUAL_COLORS = {
    qual:       [
                  '#B8CFE6', '#5182B3', '#F2CEC2',
                  '#E67D73', '#FAEBAF', '#E6CF73',
                  '#CFE6B8', '#94BF69', '#B8E6D2',
                  '#60BF97', '#E6B7C7', '#CC6788'
                ]
  };

  var SEQ_COLORS = {
    seqBlu:     [ '#DDE9FE', '#3B76B3', '#343F4D' ],
    seqRed:     [ '#FEECEC', '#CC6171', '#4D353A' ],
    seqGrn:     [ '#D2DFDE', '#4A807C', '#2C3C3F' ],
    seqBrn:     [ '#E9DFD6', '#A67D5A', '#4C3735' ]
  };

  var DIV_COLORS = {
    divBlu:     [ '#3B76B3', '#FFFFFF', '#CC6171' ],
    divBluAlt:  [ '#3B76B3', '#F3F3F3', '#CC6171' ],
    divGrn:     [ '#4A807C', '#FFFFFF', '#A67D5A' ],
    divGrnAlt:  [ '#4A807C', '#F3F3F3', '#A67D5A' ]
  };


  /* Scales
  ----------------------------------------------- */

  Object.keys(QUAL_COLORS).forEach(function(key) {
    module.exports[key] = function() {
      return d3.scale.ordinal().range(QUAL_COLORS[key].map(convertLab));
    };
  });

  Object.keys(SEQ_COLORS).forEach(function(key) {
    module.exports[key] = function() {
      return interpolatedColorScale().range(SEQ_COLORS[key].map(convertLab));
    };
  });

  Object.keys(DIV_COLORS).forEach(function(key) {
    module.exports[key] = function() {
      return interpolatedColorScale().range(DIV_COLORS[key].map(convertLab));
    };
  });


  /* Color utilities
  ----------------------------------------------- */
  module.exports.darker = function(inColor) {
    return convertLab(inColor).darker(DARKEN);
  };


  /* Helper functions
  ----------------------------------------------- */
  var convertLab = sszvis.fn.arity(1, d3.lab);

  var interpolatedColorScale = function() {
    var alteredScale = d3.scale.linear();
    var nativeDomain = alteredScale.domain;

    alteredScale.domain = function(dom) {
      if (arguments.length === 1) {
        var threeDomain = [dom[0], d3.mean(dom), dom[1]];
        return nativeDomain.call(this, threeDomain);
      } else {
        return nativeDomain.apply(this, arguments);
      }
    };

    return alteredScale;
  };

});
