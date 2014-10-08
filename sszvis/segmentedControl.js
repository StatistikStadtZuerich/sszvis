/**
 * Segmented Control for switching top-level filter values
 *
 * @module sszvis/control/segmented
 */
namespace('sszvis.control.segmented', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('values')
      .prop('current')
      .prop('width')
      .prop('change').change(sszvis.fn.identity)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var buttonWidth = props.width / props.values.length,
            buttonHeight = 20;

        var container = selection.selectDiv('.ssvis-control--segmented');

        container.style('width', props.width + 'px');

        var buttons = container.selectAll('.sszvis-control--segmentitem')
          .data(props.values);

        buttons.enter()
          .append('div')
          .classed('sszvis-control--segmentitem', true);

        buttons.exit().remove();

        buttons
          .style('width', buttonWidth + 'px')
          .classed('selected', function(d) { return d === props.current; })
          .text(function(d) { return d; })
          .on('click', props.change);
      });
  };

});