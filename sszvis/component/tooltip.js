/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('header').header('')
      .prop('body').body('')
      .prop('visible')
      .prop('orientation')
      .prop('tipsize').tipsize(10)
      .prop('style', function(s) { return s || {} })
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var tooltip = selection.selectAll('.sszvis-tooltip')
          .data(data);

        tooltip.exit().remove();

        tooltip.style({
          left: function(d) { return props.x(d) + 'px' },
          top: function(d) { return props.y(d) + 'px' }
        });

        var enterTooltip = tooltip.enter()
          .append('div')
          .classed('sszvis-tooltip', true);

        var enterBox = enterTooltip.append('div')
          .classed('sszvis-tooltip-box', true)
          .style(props.style);

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

        tooltip.selectAll('.sszvis-tooltip-header')
          .data(data)
          .html(props.header);

        tooltip.selectAll('.sszvis-tooltip-body')
          .data(data)
          .html(props.body);

        selection.selectAll('.sszvis-tooltip')
          .each(function(d) {
            var d3this = d3.select(this),
                width = this.offsetWidth,
                height = this.offsetHeight,
                x = props.x(d),
                y = props.y(d);

            d3this.style({
              left: x - width / 2 + 'px',
              top: y - height - props.tipsize + 'px'
            });
          });
      });
   };

});
