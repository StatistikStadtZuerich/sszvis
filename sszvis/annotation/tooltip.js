/**
 * Tooltip annotation
 *
 * Use this component to add a tooltip to the document. The tooltip component should be
 * called on a selection of [data-tooltip-anchor], which contain the information necessary to
 * position the tooltip and provide it with data. The tooltip's visibility should be toggled
 * using the .visible property, passing a predicate function. Tooltips will be displayed
 * when .visible returns true.
 *
 * @module sszvis/annotation/tooltip
 *
 * @property {seletion} renderInto      Provide a selection container into which to render the tooltip.
 *                                      Unlike most other components, the tooltip isn't rendered directly into the selection
 *                                      on which it is called. Instead, it's rendered into whichever selection is
 *                                      passed to the renderInto option
 * @property {function} visible         Provide a predicate function which accepts a datum and determines whether the associated
 *                                      tooltip should be visible. (default: false)
 * @property {function} header          A function accepting a datum. The result becomes the header of the tooltip.
 *                                      This function can return:
 *                                      - a plain string
 *                                      - an HTML string to be used as innerHTML
 * @property {function} body            A function accepting a datum. The result becomes the body of the tooltip.
 *                                      This function can return:
 *                                      - a plain string
 *                                      - an HTML string to be used as innerHTML
 *                                      - an array of arrays, which produces a tabular layout where each
 *                                      sub-array is one row in the table.
 * @property {function} orientation     A string or function returning a string which determines the orientation. This determines
 *                                      which direction the tooltip sits relative to its point.
 *                                      Possible values are: "bottom" (points down), "top" (points upward), "left" (points left), and "right" (points right).
 *                                      Default is "bottom".
 * @property {number} dx                A number for the x-offset of the tooltip
 * @property {number} dy                A number for the y-offset of the tooltip
 * @property {function} opacity         A function or number which determines the opacity of the tooltip. Default is 1.
 *
 * @return {d3.component}
 *
 * @function sszvis.annotation.tooltip.fit
 *
 * This is a useful default function for making a tooltip fit within a horizontal space.
 * You provide a default orientation for the tooltip, but also provide the bounds of the
 * space within which the tooltip should stay. When the tooltip is too close to the left
 * or right edge of the bounds, it is oriented away from the edge. Otherwise the default
 * is used.
 *
 * @param {String} defaultValue         The default value for the tooltip orientation
 * @param {Object} bounds               The bounds object within which the tooltip should stay.
 *
 * @returns {Function}                  A function for calculating the orientation of the tooltips.
 */

import d3 from 'd3';

import * as fn from '../fn.js';

/* Configuration
----------------------------------------------- */
var SMALL_CORNER_RADIUS = 3;
var LARGE_CORNER_RADIUS = 4;
var TIP_SIZE = 6;
var BLUR_PADDING = 5;


/* Exported module
----------------------------------------------- */
export default function() {

  var renderer = tooltipRenderer();

  return d3.component()
    .delegate('header', renderer)
    .delegate('body', renderer)
    .delegate('orientation', renderer)
    .delegate('dx', renderer)
    .delegate('dy', renderer)
    .delegate('opacity', renderer)
    .prop('renderInto')
    .prop('visible', fn.functor).visible(false)
    .renderSelection(function(selection) {
      var props = selection.props();
      var intoBCR = props.renderInto.node().getBoundingClientRect();

      var tooltipData = [];
      selection.each(function(d) {
        if (props.visible(d)) {
          var thisBCR = this.getBoundingClientRect();
          var pos = [thisBCR.left - intoBCR.left, thisBCR.top - intoBCR.top];
          tooltipData.push({
            datum: d,
            x: pos[0],
            y: pos[1]
          });
        }
      });

      props.renderInto
        .datum(tooltipData)
        .call(renderer);
    });
};

/**
 * tooltip.fit
 *
 * We don't have access to the tooltip dimensions, so we introduce
 * a safe area that is likely to work.
 */
export var fit = function(defaultVal, bounds) {
  var lo = Math.min(bounds.innerWidth * 1 / 4, 100);
  var hi = Math.max(bounds.innerWidth * 3 / 4, bounds.innerWidth - 100);
  return function(d) {
    var x = d.x;
    return x > hi ? 'right' : x < lo ? 'left' : defaultVal;
  };
};


/**
 * Tooltip renderer
 * @private
 */
var tooltipRenderer = function() {
  return d3.component()
    .prop('header')
    .prop('body')
    .prop('orientation', fn.functor).orientation('bottom')
    .prop('dx', fn.functor).dx(1)
    .prop('dy', fn.functor).dy(1)
    .prop('opacity', fn.functor).opacity(1)
    .renderSelection(function(selection) {
      var tooltipData = selection.datum();
      var props = selection.props();

      var isDef = fn.defined;
      var isSmall = (
        isDef(props.header) && !isDef(props.body)) || (!isDef(props.header) && isDef(props.body)
      );


      // Select tooltip elements

      var tooltip = selection.selectAll('.sszvis-tooltip')
        .data(tooltipData);

      tooltip.exit().remove();


      // Enter: tooltip

      var enterTooltip = tooltip.enter()
        .append('div');

      tooltip = tooltip.merge(enterTooltip);

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

      var enterBackgroundPath = enterBackground.append('path');

      if (supportsSVGFilters()) {
        var filter = enterBackground.append('filter')
          .attr('id', 'sszvisTooltipShadowFilter')
          .attr('height', '150%');

        filter.append('feGaussianBlur')
          .attr('in', 'SourceAlpha')
          .attr('stdDeviation', 2);

        filter.append('feComponentTransfer')
          .append('feFuncA')
          .attr('type', 'linear')
          .attr('slope', 0.2);

        var merge = filter.append('feMerge');
        merge.append('feMergeNode'); // Contains the blurred image
        merge.append('feMergeNode')  // Contains the element that the filter is applied to
          .attr('in', 'SourceGraphic');

        enterBackgroundPath
          .attr('filter', 'url(#sszvisTooltipShadowFilter)');
      } else {
        enterBackground.classed('sszvis-tooltip__background--fallback', true);
      }


      // Enter: tooltip content

      var enterContent = enterTooltip.append('div')
        .classed('sszvis-tooltip__content', true);

      enterContent.append('div')
        .classed('sszvis-tooltip__header', true);

      enterContent.append('div')
        .classed('sszvis-tooltip__body', true);


      // Update: content

      tooltip.select('.sszvis-tooltip__header')
        .datum(fn.prop('datum'))
        .html(props.header || fn.functor(''));

      tooltip.select('.sszvis-tooltip__body')
        .datum(fn.prop('datum'))
        .html(function(d) {
          var body = props.body ? fn.functor(props.body)(d) : '';
          return Array.isArray(body) ? formatTable(body) : body;
        });

      selection.selectAll('.sszvis-tooltip')
        .classed('sszvis-tooltip--small', isSmall)
        .each(function(d) {
          var tip = d3.select(this);
          // only using dimensions.width and dimensions.height here. Not affected by scroll position
          var dimensions = tip.node().getBoundingClientRect();
          var orientation = props.orientation.apply(this, arguments);


          // Position tooltip element

          switch (orientation) {
            case 'top':
              tip
                .style('left', (d.x - dimensions.width / 2) + 'px')
                .style('top', d.y + props.dy(d) + 'px');
              break;
            case 'bottom':
              tip
                .style('left', (d.x - dimensions.width / 2) + 'px')
                .style('top', (d.y - props.dy(d) - dimensions.height) + 'px');
              break;
            case 'left':
              tip
                .style('left', d.x + props.dx(d) + 'px')
                .style('top', (d.y - dimensions.height / 2) + 'px');
              break;
            case 'right':
              tip
                .style('left', (d.x - props.dx(d) - dimensions.width) + 'px')
                .style('top', (d.y - dimensions.height / 2) + 'px');
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
                orientation,
                isSmall ? SMALL_CORNER_RADIUS : LARGE_CORNER_RADIUS
              ));
        });
    });
};


/**
 * formatTable
 */
function formatTable(rows) {
  var tableBody = rows.map(function(row) {
    return '<tr>' + row.map(function(cell) {
      return '<td>' + cell + '</td>';
    }).join('') + '</tr>';
  }).join('');
  return '<table class="sszvis-tooltip__body__table">' + tableBody + '</table>';
}


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
function tooltipBackgroundGenerator(a, b, orientation, radius) {
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
    ['M', x(a), y(a) + radius],
    // Top side
    side(x(a), y(a), x(a) + radius, y(a), x(b) - radius, y(a), (orientation === 'top')),
    // Right side
    side(x(b), y(a), x(b), y(a) + radius, x(b), y(b) - radius, (orientation === 'right')),
    // Bottom side
    side(x(b), y(b), x(b) -radius, y(b), x(a) + radius, y(b), (orientation === 'bottom')),
    // Left side
    side(x(a), y(b), x(a), y(b) - radius, x(a), y(a) + radius, (orientation === 'left'))
  ].map(function(d){ return d.join(' '); }).join(' ');
}


/**
 * Detect whether the current browser supports SVG filters
 */
function supportsSVGFilters() {
  return window['SVGFEColorMatrixElement'] !== undefined &&
         SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE == 2;
}
