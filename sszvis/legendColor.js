/**
 * Legend component
 *
 * @module sszvis/legend
 */
namespace('sszvis.legend.color', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('width')
      .prop('rows').rows(3)
      .prop('columns').columns(3)
      .prop('orientation')
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var domain = props.scale.domain();

        var rows, cols;
        if (props.orientation === 'horizontal') {
          rows = props.rows;
          cols = Math.ceil(domain.length / rows);
        } else if (props.orientation === 'vertical') {
          cols = props.columns;
          rows = Math.ceil(domain.length / cols);
        }

        var colWidth = props.width / cols,
            rowHeight = 20;

        var groups = selection.selectAll('.sszvis-legend--entry')
          .data(domain);

        groups.enter()
          .append('g')
          .classed('sszvis-legend--entry', true);

        groups.attr('transform', function(d, i) {
          if (props.orientation === 'horizontal') {
            return 'translate(' + ((i % cols) * colWidth) + ',' + (Math.floor(i / cols) * rowHeight) + ')';
          } else if (props.orientation === 'vertical') {
            return 'translate(' + (Math.floor(i / rows) * colWidth) + ',' + ((i % rows) * rowHeight) + ')';
          }
        });

        groups.exit().remove();

        var marks = groups.selectAll('.sszvis-legend--mark')
          .data(function(d) { return [d]; });

        marks.enter()
          .append('circle')
          .classed('sszvis-legend--mark', true);

        marks.exit().remove();

        marks
          .attr('cx', 7)
          .attr('cy', rowHeight / 2 - 1) // magic number adjustment for nice alignment with text
          .attr('r', 6)
          .attr('fill', function(d) { return props.scale(d); });

        var labels = groups.selectAll('.sszvis-legend--label')
          .data(function(d) { return [d]; });

        labels.enter()
          .append('text')
          .classed('sszvis-legend--label', true);

        labels.exit().remove();

        labels
          .text(function(d) { return d; })
          .attr('alignment-baseline', 'central')
          .attr('transform', 'translate(18, ' + (rowHeight / 2) + ')');
      });
  };

});