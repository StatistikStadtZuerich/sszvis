/**
 * @module sszvis/color
 *
 * THIS IS ONLY A DRAFT OF A REVISION OF THE API AND IS NOT PART OF sszvis.js AT THE MOMENT
 *
 * instead of nested objects, this module exposes an api of just functions
 *
 * basicBlue
 * basicDeepBlue
 * plainWhite
 *
 * qual3
 * qual6
 * qual9
 * qual12
 *
 * qualRedBlu
 * qualGrnBrn
 *
 * qualBlu
 * qualRed
 * qualGrn
 * qualBrn
 * qualBluGryRed
 * qualGrnGryBrn
 *
 * linearBlu
 * linearRed
 * linearGrn
 * linearBrn
 * linearBluWhtRed
 * linearBluGryRed
 * linearGrnWhtBrn
 * linearGrnGryBrn
 *
 * logBlu
 * logRed
 * logGrn
 * logBrn
 * logBluWhtRed
 * logBluGryRed
 * logGrnWhtBrn
 * logGrnGryBrn
 *
 * powBlu
 * powRed
 * powGrn
 * powBrn
 * powBluWhtRed
 * powBluGryRed
 * powGrnWhtBrn
 * powGrnGryBrn
 */
namespace('sszvis.color', function(module) {

  /* Values
  ----------------------------------------------- */
  module.exports.basicBlue = function() { return d3.lab("#6392C5"); };
  module.exports.basicDeepBlue = function() { return d3.lab("#3A75B2"); };
  module.exports.plainWhite = function() { return d3.lab("#FFFFFF"); };

  /* Color Arrays - private
  ----------------------------------------------- */
  function convertLab(a) { return a.map(function(c) { return d3.lab(c); }); }

  var qualColors = convertLab(["#b8cfe6", "#5182b3", "#e6b7c7", "#cc6788", "#f2cec2", "#e67d73", "#faebaf", "#e6cf73", "#cfe6b8", "#94bf69", "#b8e6d2", "#60bf97"]);

  /* Scales
  ----------------------------------------------- */
  [3, 6, 9, 12].forEach(function(n) {
    module.exports['qual' + n] = function() { return d3.scale.ordinal().range(qualColors.slice(0, n)); };
  });

  module.exports.qualRedBlu = function() { return d3.scale.ordinal().range(convertLab(["#3b76b3", "#cc6171"])); };
  module.exports.qualGrnBrn = function() { return d3.scale.ordinal().range(convertLab(["#497f7b", "#a57c59"])); };

  var seqColorsFull = {
      Blu: convertLab(["#DDE9FE", "#b5cceb", "#8cb0d9", "#6493c6", "#3b76b3", "#396899", "#385b80", "#364d66", "#333e4c"]),
      Red: convertLab(["#fdebeb", "#f2c9cd", "#e5a7af", "#d98490", "#cc6171", "#ac5663", "#8d4b56", "#6d4048", "#4d353a", "#4c3439"]),
      Grn: convertLab(["#d2dfde", "#b0c7c6", "#8eb0ad", "#6c9894", "#4a807c", "#436f6d", "#3b5e5e", "#344d4e", "#2c3c3f"]),
      Brn: convertLab(["#e9dfd6", "#d8c7b7", "#c8ae98", "#b79579", "#a67d5a", "#906b51", "#795a48", "#62493e", "#4c3735"]),
      BluGryRed: convertLab(["#3b76b3", "#6995c3", "#97b4d3", "#c5d4e3", "#f3f3f3", "#e9ced3", "#e0aab2", "#d68592", "#cc6171"]),
      GrnGryBrn: convertLab(["#4a807c", "#749d9a", "#9fbab8", "#c9d6d5", "#f3f3f3", "#e0d5cd", "#cdb8a7", "#b99b80", "#a67d5a"])
  };

  Object.keys(seqColorsFull).forEach(function(c) {
    module.exports['qual' + c] = function() { return d3.scale.ordinal().range(seqColorsFull[c]); };
  });

  var seqColorsPartial = {
    Blu: ["#dce8fd", "#3a75b2", "#333e4c"],
    Red: ["#fdebeb", "#cb6070", "#4c3439"],
    Grn: ["#d1dedd", "#497f7b", "#2b3b3e"],
    Brn: ["#e8ded5", "#a57c59", "#4b3634"],
    BluWhtRed: ["#3a75b2", "#ffffff", "#cb6070"],
    BluGryRed: ["#3a75b2", "#f2f2f2", "#cb6070"],
    GrnWhtBrn: ["#497f7b", "#ffffff", "#a57c59"],
    GrnGryBrn: ["#497f7b", "#f2f2f2", "#a57c59"]
  };

  ['linear', 'log', 'pow'].forEach(function(s) {
    Object.keys(seqColorsPartial).forEach(function(c) {
      module.exports[s + c] = function() { return d3.scale.[s]().range(seqColorsPartial[c]); };
    });
  });

});
