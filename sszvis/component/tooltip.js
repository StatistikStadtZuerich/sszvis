/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip', function(module) {

  module.exports = function() {

    var fn = sszvis.fn;
    var renderer = tooltipRenderer();

    return d3.component()
      .delegate('header', renderer)
      .delegate('body', renderer)
      .delegate('orientation', renderer)
      .prop('renderInto')
      .prop('visible').visible(fn.constant(false))
      .renderSelection(function(selection) {
        var props = selection.props();

        var tooltipData = [];
        selection.each(function(d) {
          var pos = this.getBoundingClientRect();
          if (props.visible(d)) {
            tooltipData.push({
              datum: d,
              x: pos.left,
              y: pos.top
            });
          }
        });

        props.renderInto
          .datum(tooltipData)
          .call(renderer);
      });
  }


  /**
   * Tooltip renderer
   * @private
   */
  var tooltipRenderer = function() {

    var TIP_HEIGHT = 10;

    var fn = sszvis.fn;

    return d3.component()
      .prop('header').header('')
      .prop('body').body('')
      .prop('orientation').orientation('bottom')
      .renderSelection(function(selection) {

        var tooltipData = selection.datum();
        var data = tooltipData.map(fn.prop('datum'));
        var props = selection.props();

        var tooltip = selection.selectAll('.sszvis-tooltip')
          .data(tooltipData)

        tooltip.exit().remove();

        var enterTooltip = tooltip.enter()
          .append('div')
          .style('pointer-events', 'none')
          .classed('sszvis-tooltip', true);

        var enterBox = enterTooltip.append('div')
          .classed('sszvis-tooltip-box', true)

        enterBox.append('div')
          .classed('sszvis-tooltip-header', true);

        enterBox.append('div')
          .classed('sszvis-tooltip-body', true);

        var enterTipholder = enterTooltip.append('div')
          .classed('sszvis-tooltip-tipholder', true)
          .classed('tip-top', props.orientation === 'top')
          .classed('tip-bot', props.orientation === 'bottom')
          .classed('tip-left', props.orientation === 'left')
          .classed('tip-right', props.orientation === 'right');

        var enterTip = enterTipholder.append('div')
          .classed('sszvis-tooltip-tip', true)
          .classed('tip-top', props.orientation === 'top')
          .classed('tip-bot', props.orientation === 'bottom')
          .classed('tip-left', props.orientation === 'left')
          .classed('tip-right', props.orientation === 'right');

        tooltip.select('.sszvis-tooltip-header')
          .datum(fn.prop('datum'))
          .html(props.header);

        tooltip.select('.sszvis-tooltip-body')
          .datum(fn.prop('datum'))
          .html(props.body);

        selection.selectAll('.sszvis-tooltip')
          .each(function(d) {
            d3.select(this).style({
              left: d.x - this.offsetWidth / 2 + 'px',
              top:  d.y - this.offsetHeight - TIP_HEIGHT + 'px'
            });
          });
      });
   };

});
