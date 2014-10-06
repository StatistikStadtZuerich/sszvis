/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip2', function(module) {

  module.exports = function() {

    var props = {
      layer: null,
      visible: sszvis.fn.constant(false)
    }

    var component = function(selection) {

      var data = [];
      selection.each(function(d) {
        var pos = this.getBoundingClientRect();
        if (props.visible(d)) {
          data.push({
            datum: d,
            x: pos.left,
            y: pos.top
          })
        }
      });

      var headerText = sszvis.component.modularText()
        .bold(function(d){
          return Math.round(d.x);
        });

      var tooltipMaker = tooltipRenderer()
        .orientation('bottom')
        .x(function(d) {
          return d.x;
        })
        .y(function(d) {
          return d.y;
        })
        .header(headerText);

      props.layer
        .datum(data)
        .call(tooltipMaker);

    }

    component.renderInto = function(layer) {
      if (!arguments.length) return props.layer;
      props.layer = layer;
      return component;
    }

    component.visible = function(visible) {
      if (!arguments.length) return props.visible;
      props.visible = d3.functor(visible);
      return component;
    }

    return component;
  };



  //
  // Tooltip renderer
  // TODO: improve
  //
  tooltipRenderer = function() {
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
          .style('pointer-events', 'none')
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
