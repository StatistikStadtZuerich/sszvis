/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip', function(module) {
  'use strict';

  module.exports = function() {

    var fn = sszvis.fn;
    var renderer = tooltipRenderer();

    return d3.component()
      .delegate('header', renderer)
      .delegate('body', renderer)
      .delegate('orientation', renderer)
      .prop('renderInto')
      .prop('visible', d3.functor).visible(false)
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
  };

  function testPredicate(f, value) {
    return function() {
      return f.apply(this, arguments) === value;
    };
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
      .prop('orientation', d3.functor).orientation('bottom')
      .renderSelection(function(selection) {

        var tooltipData = selection.datum();
        var props = selection.props();

        var tooltip = selection.selectAll('.sszvis-tooltip')
          .data(tooltipData);

        tooltip.exit().remove();

        var enterTooltip = tooltip.enter()
          .append('div')
          .style('pointer-events', 'none')
          .classed('sszvis-tooltip', true);

        var enterBox = enterTooltip.append('div')
          .classed('sszvis-tooltip-box', true);

        enterBox.append('div')
          .classed('sszvis-tooltip-header', true);

        enterBox.append('div')
          .classed('sszvis-tooltip-body', true);

        var enterTipholder = enterTooltip.append('div')
          .classed('sszvis-tooltip-tipholder', true);

        enterTipholder.append('div')
          .classed('sszvis-tooltip-tip', true);

        tooltip.select('.sszvis-tooltip-header')
          .datum(fn.prop('datum'))
          .html(props.header);

        tooltip.select('.sszvis-tooltip-body')
          .datum(fn.prop('datum'))
          .html(props.body);

        tooltip.select('.sszvis-tooltip-tipholder')
          .classed('tip-top', testPredicate(props.orientation, 'top'))
          .classed('tip-bot', testPredicate(props.orientation, 'bottom'))
          .classed('tip-left', testPredicate(props.orientation, 'left'))
          .classed('tip-right', testPredicate(props.orientation, 'right'));

        tooltip.select('.sszvis-tooltip-tip')
          .classed('tip-top', testPredicate(props.orientation, 'top'))
          .classed('tip-bot', testPredicate(props.orientation, 'bottom'))
          .classed('tip-left', testPredicate(props.orientation, 'left'))
          .classed('tip-right', testPredicate(props.orientation, 'right'));

        selection.selectAll('.sszvis-tooltip')
          .each(function(d) {
            switch (props.orientation.apply(this, arguments)) {
              case 'top':
                d3.select(this).style({
                  left: (d.x - this.offsetWidth / 2) + 'px',
                  top:  (d.y + TIP_HEIGHT) + 'px'
                });
                break;
              case 'bottom':
                d3.select(this).style({
                  left: (d.x - this.offsetWidth / 2) + 'px',
                  top:  (d.y - this.offsetHeight - TIP_HEIGHT) + 'px'
                });
                break;
              case 'left':
                d3.select(this).style({
                  left: (d.x + TIP_HEIGHT) + 'px',
                  top:  (d.y - this.offsetHeight / 2) + 'px'
                });
                break;
              case 'right':
                d3.select(this).style({
                  left: (d.x - this.offsetWidth - TIP_HEIGHT) + 'px',
                  top:  (d.y - this.offsetHeight / 2) + 'px'
                });
                break;
            }
          });
      });
   };

});
