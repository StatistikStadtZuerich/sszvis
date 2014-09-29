/**
 * Pie component
 * @return {d3.component}
*/
namespace('sszvis.component.pie', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('radius')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        
      })
  };

});