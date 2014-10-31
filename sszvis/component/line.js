/**
 * Line component
 *
 * The line component is a general-purpose component used to render lines.
 * The input data should be an array of arrays, where each inner array
 * contains the data points necessary to render a line. The line is then
 * composed of x- and y- values extracted from these data objects
 * using the xValue and yValue accessor functions.
 *
 * Each data object in a line's array is passed to the x- and y- accessors, along with
 * that data object's index in the array. For more information, see the documentation for
 * d3.svg.line.
 *
 * @property {function} yValue            An accessor function for getting the y-value of the line
 * @property {function} xValue            An accessor function for getting the x-value of the line
 * @property {string, function} [stroke]  Either a string specifying the stroke color of the line or lines,
 *                                        or a function which, when passed the entire array representing the line,
 *                                        returns a value for the stroke. If left undefined, the stroke is black.
 * @property {string, function} [stroke] Either a number specifying the stroke-width of the lines,
 *                                       or a function which, when passed the entire array representing the line,
 *                                       returns a value for the stroke-width. The default value is 1.
 *
 * @return {d3.component}
 */
namespace('sszvis.component.line', function(module) {

  module.exports = function() {

    return d3.component()
      .prop('xValue')
      .prop('yValue')
      .prop('stroke')
      .prop('strokeWidth')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();


        // Layouts

        var line = d3.svg.line()
          .defined(sszvis.fn.compose(sszvis.fn.not(isNaN), props.yValue))
          .x(props.xValue)
          .y(props.yValue);


        // Rendering

        var path = selection.selectAll('.sszvis-line')
          .data(data);

        path.enter()
          .append('path')
          .classed('sszvis-line', true)
          .attr('stroke', props.stroke);

        path.exit().remove();

        path
          .transition()
          .call(sszvis.transition)
          .attr('d', line)
          .attr('stroke', props.stroke)
          .attr('stroke-width', props.strokeWidth);
      });
  }

});
