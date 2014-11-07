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
 * divVal
 * divValGry
 * divNtr
 * divNtrGry
 *
 * darker
 */
namespace('sszvis.color2', function(module) {
  'use strict';

  var DARKEN = 0.6;

  var QUAL_COLORS = {
    qual: [
      '#5182B3', '#B8CFE6',
      '#60BF97', '#B8E6D2',
      '#94BF69', '#CFE6B8',
      '#E6CF73', '#FAEBAF',
      '#E67D73', '#F2CEC2',
      '#CC6788', '#E6B7C7'
    ],

    qual6a: [
      '#5182B3', '#B8CFE6',
      '#60BF97', '#B8E6D2',
      '#94BF69', '#CFE6B8'
    ],

    qual6b: [
      '#E6CF73', '#FAEBAF',
      '#E67D73', '#F2CEC2',
      '#CC6788', '#E6B7C7'
    ]
  };

  var SEQ_COLORS = {
    seqBlu: ['#DDE9FE', '#3B76B3', '#343F4D'],
    seqRed: ['#FEECEC', '#CC6171', '#4D353A'],
    seqGrn: ['#D2DFDE', '#4A807C', '#2C3C3F'],
    seqBrn: ['#E9DFD6', '#A67D5A', '#4C3735']
  };

  var DIV_COLORS = {
    divVal:    ['#CC6171', '#FFFFFF', '#3B76B3'],
    divValGry: ['#CC6171', '#F3F3F3', '#3B76B3'],
    divNtr:    ['#A67D5A', '#FFFFFF', '#4A807C'],
    divNtrGry: ['#A67D5A', '#F3F3F3', '#4A807C']
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
  module.exports.darker = function(color) {
    return convertLab(color).darker(DARKEN);
  };


  /* Helper functions
  ----------------------------------------------- */
  function convertLab(d) {
    return d3.lab(d);
  }

  function interpolatedColorScale() {
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
