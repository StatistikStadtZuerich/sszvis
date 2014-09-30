/**
 * Pyramid Component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.pyramid', function(module) {

  module.exports = function() {
    return d3.component()
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        
      });
  };

});