/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip', function(module) {
  'use strict';

  /* Configuration
  ----------------------------------------------- */
  var RADIUS = 3;
  var TIP_SIZE = 6;
  var BLUR_PADDING = 5;


  /* Exported module
  ----------------------------------------------- */
  module.exports = function() {

    var renderer = tooltipRenderer();

    return d3.component()
      .delegate('centered', renderer)
      .delegate('header', renderer)
      .delegate('body', renderer)
      .delegate('orientation', renderer)
      .delegate('dx', renderer)
      .delegate('dy', renderer)
      .delegate('opacity', renderer)
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


  /**
   * Tooltip renderer
   * @private
   */
  var tooltipRenderer = function() {
    return d3.component()
      .prop('centered').centered(false)
      .prop('header').header('')
      .prop('body').body('')
      .prop('orientation', d3.functor).orientation('bottom')
      .prop('dx').dx(1)
      .prop('dy').dy(1)
      .prop('opacity', d3.functor).opacity(1)
      .renderSelection(function(selection) {
        var tooltipData = selection.datum();
        var props = selection.props();


        // Select tooltip elements

        var tooltip = selection.selectAll('.sszvis-tooltip')
          .data(tooltipData);

        tooltip.exit().remove();


        // Enter: tooltip

        var enterTooltip = tooltip.enter()
          .append('div');

        tooltip
          .style('pointer-events', 'none')
          .style('opacity', props.opacity)
          .style('padding-top', function(d) {
            return (props.orientation(d) === 'top') ? TIP_SIZE + 'px' : null;
          })
          .style('padding-right', function(d) {
            return (props.orientation(d) === 'right') ? TIP_SIZE + 'px' : null;
          })
          .style('padding-bottom', function(d) {
            return (props.orientation(d) === 'bottom') ? TIP_SIZE + 'px' : null;
          })
          .style('padding-left', function(d) {
            return (props.orientation(d) === 'left') ? TIP_SIZE + 'px' : null;
          })
          .classed('sszvis-tooltip', true);


        // Enter: tooltip background

        var enterBackground = enterTooltip.append('svg')
          .attr('class', 'sszvis-tooltip__background')
          .attr('height', 0)
          .attr('width', 0);

        var filter = enterBackground.append('defs')
          .append('filter')
          .attr('id', 'sszvis-tooltip-shadow-filter')
          .attr('height', '150%');

        filter.append('feGaussianBlur')
          .attr('in', 'SourceAlpha')
          .attr('stdDeviation', 2);

        filter.append('feComponentTransfer')
          .append('feFuncA')
          .attr('type', 'linear')
          .attr('slope', 0.2);

        filter.append('feOffset')
          .attr('dx', 0)
          .attr('dy', 0)
          .attr('result', 'offsetblur');

        var merge = filter.append('feMerge');
        merge.append('feMergeNode')
          .attr('in', 'offsetblur'); // Contains the blurred image
        merge.append('feMergeNode')  // Contains the element that the filter is applied to
          .attr('in', 'SourceGraphic');

        enterBackground.append('path')
          .style('filter', 'url(#sszvis-tooltip-shadow-filter)');


        // Enter: tooltip content

        var enterContent = enterTooltip.append('div')
          .classed('sszvis-tooltip__content', true);

        enterContent.append('div')
          .classed('sszvis-tooltip__header', true);

        enterContent.append('div')
          .classed('sszvis-tooltip__body', true);


        // Update: content

        tooltip.select('.sszvis-tooltip__header')
          .datum(sszvis.fn.prop('datum'))
          .html(props.header);

        tooltip.select('.sszvis-tooltip__body')
          .datum(sszvis.fn.prop('datum'))
          .html(props.body);

        selection.selectAll('.sszvis-tooltip')
          .classed('sszvis-tooltip--centered', props.centered)
          .each(function(d) {
            var tip = d3.select(this);
            var dimensions = tip.node().getBoundingClientRect();
            var orientation = props.orientation.apply(this, arguments);


            // Position tooltip element

            switch (orientation) {
              case 'top':
                tip.style({
                  left: (d.x - this.offsetWidth / 2) + 'px',
                  top:  d.y + props.dy + 'px'
                });
                break;
              case 'bottom':
                tip.style({
                  left: (d.x - this.offsetWidth / 2) + 'px',
                  top:  (d.y - props.dy - this.offsetHeight) + 'px'
                });
                break;
              case 'left':
                tip.style({
                  left: d.x + props.dx + 'px',
                  top:  (d.y - this.offsetHeight / 2) + 'px'
                });
                break;
              case 'right':
                tip.style({
                  left: (d.x - props.dx - this.offsetWidth) + 'px',
                  top:  (d.y - this.offsetHeight / 2) + 'px'
                });
                break;
            }


            // Position background element

            var bgHeight = dimensions.height + 2 * BLUR_PADDING;
            var bgWidth =  dimensions.width  + 2 * BLUR_PADDING;
            tip.select('.sszvis-tooltip__background')
              .attr('height', bgHeight)
              .attr('width',  bgWidth)
              .style('left', -BLUR_PADDING + 'px')
              .style('top',  -BLUR_PADDING + 'px')
              .select('path')
                .attr('d', tooltipBackgroundGenerator(
                  [BLUR_PADDING, BLUR_PADDING],
                  [bgWidth - BLUR_PADDING, bgHeight - BLUR_PADDING],
                  orientation
                ));
          });
      });
   };


  /**
   * Tooltip background generator
   *
   * Generates a path description with a tip on the specified side.
   *
   *           top
   *         ________
   *   left |        | right
   *        |___  ___|
   *            \/
   *          bottom
   *
   * @param  {Vector} a           Top-left corner of the tooltip rectangle (x, y)
   * @param  {Vector} b           Bottom-right corner of the tooltip rectangle (x, y)
   * @param  {String} orientation The tip will point in this direction (top, right, bottom, left)
   *
   * @return {Path}               SVG path description
   */
  function tooltipBackgroundGenerator(a, b, orientation) {
    switch (orientation) {
      case 'top':
        a[1] = a[1] + TIP_SIZE;
        break;
      case 'bottom':
        b[1] = b[1] - TIP_SIZE;
        break;
      case 'left':
        a[0] = a[0] + TIP_SIZE;
        break;
      case 'right':
        b[0] = b[0] - TIP_SIZE;
        break;
    }

    function x(d){ return d[0]; }
    function y(d){ return d[1]; }
    function side(cx, cy, x0, y0, x1, y1, showTip) {
      var mx = x0 + (x1 - x0) / 2;
      var my = y0 + (y1 - y0) / 2;

      var corner = ['Q', cx, cy, x0, y0];

      var tip = [];
      if (showTip && y0 === y1) {
        if (x0 < x1) {
          // Top
          tip = [
            'L', mx - TIP_SIZE, my,
            'L', mx,            my - TIP_SIZE,
            'L', mx + TIP_SIZE, my
          ];
        } else {
          // Bottom
          tip = [
            'L', mx + TIP_SIZE, my,
            'L', mx,            my + TIP_SIZE,
            'L', mx - TIP_SIZE, my
          ];
        }
      } else if (showTip && x0 === x1) {
        if (y0 < y1) {
          // Right
          tip = [
            'L', mx,            my - TIP_SIZE,
            'L', mx + TIP_SIZE, my,
            'L', mx,            my + TIP_SIZE
          ];
        } else {
          // Left
          tip = [
            'L', mx,            my + TIP_SIZE,
            'L', mx - TIP_SIZE, my,
            'L', mx,            my - TIP_SIZE
          ];
        }
      }

      var end = ['L', x1, y1];

      return [].concat(corner, tip, end);
    }

    return [
      // Start
      ['M', x(a), y(a) + RADIUS],
      // Top side
      side(x(a), y(a), x(a) + RADIUS, y(a), x(b) - RADIUS, y(a), (orientation === 'top')),
      // Right side
      side(x(b), y(a), x(b), y(a) + RADIUS, x(b), y(b) - RADIUS, (orientation === 'right')),
      // Bottom side
      side(x(b), y(b), x(b) -RADIUS, y(b), x(a) + RADIUS, y(b), (orientation === 'bottom')),
      // Left side
      side(x(a), y(b), x(a), y(b) - RADIUS, x(a), y(a) + RADIUS, (orientation === 'left'))
    ].map(function(d){ return d.join(' '); }).join(' ');
  }

});
