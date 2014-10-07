/**
 * default transition attributes for sszvis
 *
 * @module sszvis/transition
 */
namespace('sszvis.transition', function(module) {

  var defaultEase = d3.ease('poly-out', 4);

  module.exports = function(transition) {
    transition
      .ease(defaultEase)
      .duration(300);
  };

});