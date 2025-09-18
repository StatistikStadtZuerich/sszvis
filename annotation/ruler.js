import { select, ascending } from 'd3';
import { component } from '../d3-component.js';
import { functor, compose, find } from '../fn.js';
import { halfPixel } from '../svgUtils/crisp.js';
import translateString from '../svgUtils/translateString.js';

/**
 * Ruler annotation
 *
 * The ruler component can be used to create a vertical line which highlights data at a certain
 * x-value, for instance in a line chart or area chart. The ruler expects data to be bound to
 * the layer it renders into, and it will generate a small dot for each data point it finds.
 *
 * @module sszvis/annotation/ruler
 *
 * @property {number} top                 A number which is the y-position of the top of the ruler line
 * @property {number} bottom              A number which is the y-position of the bottom of the ruler line
 * @property {function} x                 A number or function returning a number for the x-position of the ruler line.
 * @property {function} y                 A function for determining the y-position of the ruler dots. Should take a data
 *                                        value as an argument and return a y-position.
 * @property {function} label             A function for determining the labels of the ruler dots. Should take a
 *                                        data value as argument and return a label.
 * @property {string, function} color     A string or function to specify the color of the ruler dots.
 * @property {function} flip              A boolean or function which returns a boolean that specifies
 *                                        whether the labels on the ruler dots should be flipped. (they default to the right side)
 * @property {function} labelId           An id accessor function for the labels. This is used to match label data to svg elements,
 *                                        and it is used by the reduceOverlap algorithm to match calculated bounds and positions with
 *                                        labels. The default implementation uses the x and y positions of each label, but when labels
 *                                        overlap, these positions are the same (and one will be removed!). It's generally a good idea
 *                                        to provide your own function here, but you should especially use this when multiple labels
 *                                        could overlap with each other. Usually this will be some kind of category accessor function.
 * @property {boolean} reduceOverlap      Use an iterative relaxation algorithm to adjust the positions of the labels (when there is more
 *                                        than one label) so that they don't overlap. This can be computationally expensive, when there are
 *                                        many labels that need adjusting. This is turned off by default.
 *
 * @return {sszvis.component}
 */

const annotationRuler = () => component().prop("top").prop("bottom").prop("x", functor).prop("y", functor).prop("label").label(functor("")).prop("color").prop("flip", functor).flip(false).prop("labelId", functor).prop("reduceOverlap").reduceOverlap(true).render(function (data) {
  const selection = select(this);
  const props = selection.props();
  const labelId = props.labelId || (d => props.x(d) + "_" + props.y(d));
  const ruler = selection.selectAll(".sszvis-ruler__rule").data(data, labelId).join("line").classed("sszvis-ruler__rule", true);
  ruler.attr("x1", compose(halfPixel, props.x)).attr("y1", props.y).attr("x2", compose(halfPixel, props.x)).attr("y2", props.bottom);
  const dot = selection.selectAll(".sszvis-ruler__dot").data(data, labelId).join("circle").classed("sszvis-ruler__dot", true);
  dot.attr("cx", compose(halfPixel, props.x)).attr("cy", compose(halfPixel, props.y)).attr("r", 3.5).attr("fill", props.color);
  selection.selectAll(".sszvis-ruler__label-outline").data(data, labelId).join("text").classed("sszvis-ruler__label-outline", true);
  const label = selection.selectAll(".sszvis-ruler__label").data(data, labelId).join("text").classed("sszvis-ruler__label", true);

  // Update both label and labelOutline selections

  const crispX = compose(halfPixel, props.x);
  const crispY = compose(halfPixel, props.y);
  const textSelection = selection.selectAll(".sszvis-ruler__label, .sszvis-ruler__label-outline").attr("transform", d => {
    const x = crispX(d);
    const y = crispY(d);
    const dx = props.flip(d) ? -10 : 10;
    const dy = y < props.top ? 2 * y : y > props.bottom ? 0 : 5;
    return translateString(x + dx, y + dy);
  }).style("text-anchor", d => props.flip(d) ? "end" : "start").html(props.label);
  if (props.reduceOverlap) {
    const THRESHOLD = 2;
    let ITERATIONS = 10;
    const labelBounds = [];
    // Optimization for the lookup later
    const labelBoundsIndex = {};

    // Reset vertical shift (set by previous renders)
    textSelection.attr("y", "");

    // Create bounds objects
    label.each(function (d) {
      const bounds = this.getBoundingClientRect();
      const item = {
        top: bounds.top,
        bottom: bounds.bottom,
        dy: 0
      };
      labelBounds.push(item);
      labelBoundsIndex[labelId(d)] = item;
    });

    // Sort array in place by vertical position
    // (only supports labels of same height)
    labelBounds.sort((a, b) => ascending(a.top, b.top));

    // Using postfix decrement means the expression evaluates to the value of the variable
    // before the decrement takes place. In the case of 10 iterations, this means that the
    // variable gets to 0 after the truthiness of the 10th iteration is tested, and the
    // expression is false at the beginning of the 11th, so 10 iterations are executed.
    // If you use prefix decrement (--ITERATIONS), the variable gets to 0 at the beginning of
    // the 10th iteration, meaning that only 9 iterations are executed.
    while (ITERATIONS--) {
      // Calculate overlap and correct position
      for (const [index, firstLabel] of labelBounds.entries()) {
        for (const secondLabel of labelBounds.slice(index + 1)) {
          const overlap = firstLabel.bottom - secondLabel.top;
          if (overlap >= THRESHOLD) {
            const offset = overlap / 2;
            firstLabel.bottom -= offset;
            firstLabel.top -= offset;
            firstLabel.dy -= offset;
            secondLabel.bottom += offset;
            secondLabel.top += offset;
            secondLabel.dy += offset;
          }
        }
      }
    }

    // Shift vertically to remove overlap
    textSelection.attr("y", d => {
      const textLabel = labelBoundsIndex[labelId(d)];
      return textLabel.dy;
    });
  }
});
const rulerLabelVerticalSeparate = cAcc => g => {
  const THRESHOLD = 2;
  const labelBounds = [];

  // Reset vertical shift
  g.selectAll("text").each(function () {
    select(this).attr("y", "");
  });

  // Calculate bounds
  g.selectAll(".sszvis-ruler__label").each(function (d) {
    const bounds = this.getBoundingClientRect();
    labelBounds.push({
      category: cAcc(d),
      top: bounds.top,
      bottom: bounds.bottom,
      dy: 0
    });
  });

  // Sort by vertical position (only supports labels of same height)
  labelBounds.sort((a, b) => ascending(a.top, b.top));

  // Calculate overlap and correct position
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < labelBounds.length; j++) {
      for (let k = j + 1; k < labelBounds.length; k++) {
        if (j === k) continue;
        const firstLabel = labelBounds[j];
        const secondLabel = labelBounds[k];
        const overlap = firstLabel.bottom - secondLabel.top;
        if (overlap >= THRESHOLD) {
          firstLabel.bottom -= overlap / 2;
          firstLabel.top -= overlap / 2;
          firstLabel.dy -= overlap / 2;
          secondLabel.bottom += overlap / 2;
          secondLabel.top += overlap / 2;
          secondLabel.dy += overlap / 2;
        }
      }
    }
  }

  // Shift vertically to remove overlap
  g.selectAll("text").each(function (d) {
    const label = find(l => l.category === cAcc(d), labelBounds);
    if (label) {
      select(this).attr("y", label.dy);
    }
  });
};

export { annotationRuler, rulerLabelVerticalSeparate };
//# sourceMappingURL=ruler.js.map
