/**
 * A collection of functional helper functions
 *
 * @module sszvis/fn
 */
namespace('sszvis.fn', function(module) {
  'use strict';

  module.exports = {
    /**
     * fn.arity
     *
     * Wraps a function of any arity (including nullary) in a function that
     * accepts exactly `n` parameters. Any extraneous parameters will not be
     * passed to the supplied function.
     *
     * @param {number} n The desired arity of the new function.
     * @param {Function} fn The function to wrap.
     * @return {Function} A new function wrapping `fn`. The new function is
     * guaranteed to be of arity `n`.
     */
    arity: function(n, fn) {
      switch (n) {
        case 0: return function() {return fn.call(this);};
        case 1: return function(a0) {return fn.call(this, a0);};
        case 2: return function(a0, a1) {return fn.call(this, a0, a1);};
        case 3: return function(a0, a1, a2) {return fn.call(this, a0, a1, a2);};
        case 4: return function(a0, a1, a2, a3) {return fn.call(this, a0, a1, a2, a3);};
        case 5: return function(a0, a1, a2, a3, a4) {return fn.call(this, a0, a1, a2, a3, a4);};
        case 6: return function(a0, a1, a2, a3, a4, a5) {return fn.call(this, a0, a1, a2, a3, a4, a5);};
        case 7: return function(a0, a1, a2, a3, a4, a5, a6) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6);};
        case 8: return function(a0, a1, a2, a3, a4, a5, a6, a7) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);};
        case 9: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);};
        case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);};
        default: return fn;
      }
    },

    /**
     * fn.compose
     *
     * Returns the composition of a set of functions, in arguments order.
     * For example, if functions F, G, and H are passed as arguments:
     *
     * A = fn.compose(F, G, H)
     *
     * A will be a function which returns F(G(H(...arguments to A...)))
     * so that A(x) === F(G(H(x)))
     *
     * Note: all composed functions but the last should be of arity 1.
     *
     * @param {Function...} ... Accepts any number of functions as arguments
     * @return {Function} returns a function which is the composition of the passed functions
     */
    compose: function() {
      var fns = arguments,
          start = arguments.length - 1;
      return function() {
        var i = start;
        var result = fns[i].apply(this, arguments);
        while (i--) result = fns[i].call(this, result);
        return result;
      };
    },

    /**
     * fn.contains
     *
     * Checks whether an item is present in the given list (by strict equality).
     *
     * @param  {array} list List of items
     * @param  {any}   d    Item that might be in list
     * @return {boolean}
     */
    contains: function(list, d) {
      return list.indexOf(d) >= 0;
    },

    /**
     * fn.defined
     *
     * determines if the passed value is defined.
     *
     * @param  {*} val the value to check
     * @return {Boolean}     true if the value is defined, false if the value is undefined
     */
    defined: function(val) {
      return typeof val !== 'undefined';
    },

    /**
     * fn.derivedSet
     *
     * fn.derivedSet is used to create sets of objects from an input array. The objects are
     * first passed through an accessor function, which should produce a value. The set is calculated
     * using that value, but the actual members of the set are the input objects. This allows you
     * to use .derivedSet to create a group of obejcts, where the values of some derived property
     * of those objects forms a set. This is distinct from other set functions in this toolkit because
     * in the other set functions, the set of derived properties is returned, whereas this function
     * returns a set of objects from the input array.
     *
     * @param  {array} arr        The array of elements from which the set is calculated
     * @param  {function} acc     An accessor function which calculates the set determiner.
     * @return {array}            An array of objects from the input array.
     */
    derivedSet: function(arr, acc) {
      acc || (acc = sszvis.fn.identity);
      var seen = [], sValue, cValue, result = [];
      for (var i = 0, l = arr.length; i < l; ++i) {
        sValue = arr[i];
        cValue = acc(sValue, i, arr);
        if (seen.indexOf(cValue) < 0) {
          seen.push(cValue);
          result.push(sValue);
        }
      }
      return result;
    },

    /**
     * fn.find
     *
     * given a predicate function and a list, returns the first value
     * in the list such that the predicate function returns true
     * when passed that value.
     *
     * @param  {Function} predicate A predicate function to be called on elements in the list
     * @param  {Array} list      An array in which to search for a truthy predicate value
     * @return {*}           the first value in the array for which the predicate returns true.
     */
    find: function(predicate, list) {
      var idx = -1;
      var len = list.length;
      while (++idx < len) {
        if (predicate(list[idx])) return list[idx];
      }
    },

    /**
     * fn.first
     *
     * Returns the first value in the passed array, or undefined if the array is empty
     *
     * @param  {Array} arr an array
     * @return {*}     the first value in the array
     */
    first: function(arr) {
      return arr[0];
    },

    /**
     * fn.getElementPageOffset
     *
     * Gets the element's offset from the page, which means adjusted for current scroll position
     * @param  {node} el       The element for which to calculate the offset
     * @return {array}         An array which is [xOffset, yOffset]
     */
    getElementPageOffset: function(el) {
        // here, we need to adjust for the window scroll position, since getBoundingClientRect returns viewport-relative coordinates, not document-relative ones
        var bounds = el.getBoundingClientRect(),
            windowX = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft,
            windowY = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
        return [bounds.left + windowX, bounds.top + windowY];
    },

    /**
     * fn.horizontalBarChartDimensions
     *
     * This function calculates dimensions for the horizontal bar chart. It encapsulates the
     * layout algorithm for sszvis horizontal bar charts. The object it returns contains several
     * properties which can be used in other functions and components for layout purposes.
     *
     *
     * @param  {number} numBars     the number of bars in the horizontal bar chart
     * @return {object}             an object containing properties used for layout:
     *                                 {
     *                                  barHeight: the height of an individual bar
     *                                  padHeight: the height of the padding between each bar
     *                                  padRatio: the ratio of padding to barHeight + padding.
     *                                            this can be passed as the second argument to d3.scale.ordinal().rangeBands
     *                                  outerRatio: the ratio of outer padding to barHeight + padding.
     *                                              this can be passed as the third parameter to d3.scale.ordinal().rangeBands
     *                                  axisOffset: the amount by which to vertically offset the y-axis of the horizontal bar chart
     *                                              in order to ensure that the axis labels are visible. This can be used as the y-component
     *                                              of a call to sszvis.fn.translateString.
     *                                  barGroupHeight: the combined height of all the bars and their inner padding.
     *                                  totalHeight: barGroupHeight plus the height of the outerPadding. This distance can be used
     *                                               to translate scales below the bars.
     *                                 }
     */
    horizontalBarChartDimensions: function(numBars) {
      var DEFAULT_HEIGHT = 24, // the default bar height
          MIN_PADDING = 20, // the minimum padding size
          barHeight = DEFAULT_HEIGHT, // the bar height
          numPads = numBars - 1,
          padding = MIN_PADDING,
          // compute other information
          padRatio = 1 - (barHeight / (barHeight + padding)),
          computedBarSpace = barHeight * numBars + padding * numPads,
          outerRatio = 0; // no outer padding

      return {
        barHeight: barHeight,
        padHeight: padding,
        padRatio: padRatio,
        outerRatio: outerRatio,
        axisOffset: -(barHeight / 2) - 10,
        barGroupHeight: computedBarSpace,
        totalHeight: computedBarSpace + (outerRatio * (barHeight + padding) * 2)
      };
    },

    /**
     * fn.hashableSet
     *
     * takes an array of elements and returns the unique elements of that array, optionally
     * after passing them through an accessor function.
     * the returned array is ordered according to the elements' order of appearance
     * in the input array. This function differs from fn.set in that the elements
     * in the input array (or the values returned by the accessor function)
     * MUST be "hashable" - convertible to unique keys of a JavaScript object.
     * As payoff for obeying this restriction, the algorithm can run much faster.
     *
     * @param  {Array} arr the Array of source elements
     * @param {Function} [acc(element, index, array)=(v) -> v] - an accessor function which
     * is called on each element of the Array. Defaults to the identity function.
     * The result is equivalent to calling array.map(acc) before computing the set.
     * When the accessor function is invoked, it is passed the element from the input array,
     * the element's index in the input array, and the input array itself.
     * @return {Array} an Array of unique elements
     */
    hashableSet: function(arr, acc) {
      acc || (acc = sszvis.fn.identity);
      var seen = {}, value, result = [];
      for (var i = 0, l = arr.length; i < l; ++i) {
        value = acc(arr[i], i, arr);
        if (!seen[value]) {
          seen[value] = true;
          result.push(value);
        }
      }
      return result;
    },

    /**
     * Utility function for calculating different demensions in the heat table
     * @param  {Number} spaceWidth   the total available width for the heat table within its container
     * @param  {Number} padding the padding, in pixels, between squares in the heat table
     * @param  {Number} numX     The number of columns that need to fit within the heat table width
     * @param {Number} numY The number of rows in the table
     * @return {object}         An object with dimension information about the heat table:
     *                          {
     *                              side: the length of one side of a table box
     *                              paddedSide: the length of the side plus padding
     *                              padRatio: the ratio of padding to paddedSide (used for configuring d3.scale.ordinal.rangeBands as the second parameter)
     *                              width: the total width of all table boxes plus padding in between
     *                              height: the total height of all table boxes plus padding in between
     *                              centeredOffset: the left offset required to center the table horizontally within spaceWidth
     *                          }
     */
    heatTableDimensions: function(spaceWidth, padding, numX, numY) {
      // this includes the default side length for the heat table
      var DEFAULT_SIDE = 30,
          side = Math.min((spaceWidth - padding * (numX - 1)) / numX, DEFAULT_SIDE),
          paddedSide = side + padding,
          padRatio = 1 - (side / paddedSide),
          tableWidth = numX * paddedSide - padding, // subtract the padding at the end
          tableHeight = numY * paddedSide - padding; // subtract the padding at the end
      return {
        side: side,
        paddedSide: paddedSide,
        padRatio: padRatio,
        width: tableWidth,
        height: tableHeight,
        centeredOffset: (spaceWidth - tableWidth) / 2
      };
    },

    /**
     * fn.identity
     *
     * The identity function. It returns the first argument passed to it.
     * Useful as a default where a function is required.
     *
     * @param  {*} value any value
     * @return {*}       returns its argument
     */
    identity: function(value) {
      return value;
    },

    /**
     * fn.last
     *
     * Returns the last value in the passed array, or undefined if the array is empty
     *
     * @param  {Array} arr an array
     * @return {*}     the last value in the array
     */
    last: function(arr) {
      return arr[arr.length - 1];
    },

    /**
     * fn.not
     *
     * Takes as argument a function f and returns a new function
     * which calls f on its arguments and returns the
     * boolean opposite of f's return value.
     *
     * @param  {Function} f the argument function
     * @return {Function}   a new function which returns the boolean opposite of the argument function
     */
    not: function (f) {
      return function(){ return !f.apply(this, arguments); };
    },

    /**
     * fn.populationPyramidLayout
     *
     * This function is used to compute the layout parameters for the population pyramid
     *
     * @property {number} defaultHeight   The default height of the chart. This is used as a base for calculating rounded bar heights.
     *                                    however, the returned total height will not necessarily be the same as this value.
     * @property {number} numBars         The number of bars in the population pyramid. In other words, the number of ages or age groups in the dataset.
     *
     * @return {object}                   An object containing configuration information for the population pyramid:
     *                                    {
     *                                      barHeight: the height of one bar in the population pyramid
     *                                      padding: the height of the padding between bars in the pyramid
     *                                      totalHeight: the total height of all bars plus the padding between them. This should be the basis for the bounds calculation
     *                                      positions: an array of positions, which go from the bottom of the chart (lowest age) to the top. These positions should
     *                                      be set as the range of a d3.scale.ordinal scale, where the domain is the list of ages or age groups that will be displayed
     *                                      in the chart. The domain ages or age groups should be sorted in ascending order, so that the positions will match up. If everything
     *                                      has gone well, the positions array's length will be numBars
     *                                    }
     */
    populationPyramidLayout: function(defaultHeight, numBars) {
      var padding = 1;
      var numPads = numBars - 1;
      var totalPadding = padding * numPads;

      var roundedBarHeight = Math.round((defaultHeight - totalPadding) / numBars);
      roundedBarHeight = Math.max(roundedBarHeight, 2); // bars no shorter than 2

      var totalHeight = numBars * roundedBarHeight + totalPadding;

      var barPos = totalHeight - roundedBarHeight,
          step = roundedBarHeight + padding,
          positions = [];
      while (barPos >= 0) {
        positions.push(barPos);
        barPos -= step;
      }

      return {
        barHeight: roundedBarHeight,
        padding: padding,
        totalHeight: totalHeight,
        positions: positions
      };
    },

    /**
     * fn.prop
     *
     * takes the name of a property and returns a property accessor function
     * for the named property. When the accessor function is called on an object,
     * it returns that object's value for the named property. (or undefined, if the object
     * does not contain the property.)
     *
     * @param  {String} key the name of the property for which an accessor function is desired
     * @return {Function}     A property-accessor function
     *
     */
    prop: function(key) {
      return function(object) {
        return object[key];
      };
    },

    /**
     * fn.roundPixelCrisp
     *
     * To ensure SVG elements are rendered crisply and without anti-aliasing
     * artefacts, they must be placed on a half-pixel grid.
     *
     * @param  {number} pos A pixel position
     * @return {number}     A pixel position snapped to the pixel grid
     */
    roundPixelCrisp: function(pos) {
      return Math.floor(pos) + 0.5;
    },

    /**
     * fn.roundTransformString
     *
     * Takes an SVG transform string 'translate(12.3,4.56789) rotate(3.5)' and
     * rounds all translate coordinates to integers: 'translate(12,5) rotate(3.5)'.
     *
     * A valid translate instruction has the form 'translate(<x> [<y>])' where
     * x and y can be separated by a space or comma. We normalize this to use
     * spaces because that's what Internet Explorer uses.
     *
     * @param  {string} transformStr A valid SVG transform string
     * @return {string}              An SVG transform string with rounded values
     */
    roundTransformString: function(transformStr) {
      var roundNumber = sszvis.fn.compose(Math.floor, Number);
      return transformStr.replace(/(translate\()\s*([0-9., ]+)\s*(\))/i, function(_, left, vecStr, right) {
        var roundVec = vecStr
          .replace(',', ' ')
          .replace(/\s+/, ' ')
          .split(' ')
          .map(roundNumber)
          .join(',');
        return left + roundVec + right;
      });
    },

    /**
     * fn.scaleExtent
     *
     * Used to determine the extent of an array. Mimics a function found in d3 source code.
     *
     * @param  {array} domain     an array, sorted in either ascending or descending order
     * @return {array}            the extent of the array, with the smaller term first.
     */
    scaleExtent: function(domain) { // borrowed from d3 source - svg.axis
      var start = domain[0], stop = domain[domain.length - 1];
      return start < stop ? [ start, stop ] : [ stop, start ];
    },

    /**
     * f.scaleRange
     *
     * Used to determine the extent of a scale's range. Mimics a function found in d3 source code.
     *
     * @param  {array} scale    The scale to be measured
     * @return {array}          The extent of the scale's range. Useful for determining how far
     *                          a scale stretches in its output dimension.
     */
    scaleRange: function(scale) { // borrowed from d3 source - svg.axis
      return scale.rangeExtent ? scale.rangeExtent() : sszvis.fn.scaleExtent(scale.range());
    },

    /**
     * fn.set
     *
     * takes an array of elements and returns the unique elements of that array, optionally
     * after passing them through an accessor function.
     * the returned array is ordered according to the elements' order of appearance
     * in the input array, e.g.:
     *
     * [2,1,1,6,8,6,5,3] -> [2,1,6,8,5,3]
     * ["b", a", "b", "b"] -> ["b", "a"]
     * [{obj1}, {obj2}, {obj1}, {obj3}] -> [{obj1}, {obj2}, {obj3}]
     *
     * @param {Array} arr - the Array of source elements
     * @param {Function} [acc(element, index, array)=(v) -> v] - an accessor function which
     * is called on each element of the Array. Defaults to the identity function.
     * The result is equivalent to calling array.map(acc) before computing the set.
     * When the accessor function is invoked, it is passed the element from the input array,
     * the element's index in the input array, and the input array itself.
     * @return {Array} an Array of unique elements
     */
    set: function(arr, acc) {
      acc || (acc = sszvis.fn.identity);
      return arr.reduce(function(m, value, i) {
        var computed = acc(value, i, arr);
        return m.indexOf(computed) < 0 ? m.concat(computed) : m;
      }, []);
    },

    /**
     * fn.stringEqual
     *
     * Determines whether two values are equal when converted to strings. Useful for comparing
     * date objects, because two different date objects are not considered equal, even if they
     * represent the same date.
     *
     * @param  {any} a        the first value
     * @param  {any} b        the second value
     * @return {boolean}      Whether the provided values are equal when converted to strings.
     */
    stringEqual: function(a, b) {
      return a.toString() === b.toString();
    },

    /**
     * fn.stackedAreaMultipelsLayout
     *
     * This function is used to compute layout parameters for the area multiples chart.
     *
     * @param  {number} height      The available height of the chart
     * @param  {number} num         The number of individual stacks to display
     * @param  {number} pct         the planned-for ratio between the space allotted to each area and the amount of space + area.
     *                              This value is used to compute the baseline positions for the areas, and how much vertical space to leave
     *                              between the areas.
     *
     * @return {object}             An object containing configuration properties for use in laying out the stacked area multiples.
     *                              {
     *                                range:          This is an array of baseline positions, counting from the top of the stack downwards.
     *                                                It should be used to configure a d3.scale.ordinal(). The values passed into the ordinal
     *                                                scale will be given a y-value which descends from the top of the stack, so that the resulting
     *                                                scale will match the organization scheme of sszvis.stacked.area. Use the ordinal scale to
     *                                                configure the sszvis.stacked.areaMultiples component.
     *                                bandHeight:     The height of each multiples band. This can be used to configure the within-area y-scale.
     *                                                This height represents the height of the y-axis of the individual area multiple.
     *                                padHeight:      This is the amount of vertical padding between each area multiple.
     *                              }
     */
    stackedAreaMultiplesLayout: function(height, num, pct) {
      pct || (pct = 0.1);
      var step = height / (num - pct),
          bandHeight = step * (1 - pct),
          level = bandHeight, // count from the top, and start at the bottom of the first band
          range = [];
      while (level - height < 1) {
        range.push(level);
        level += step;
      }
      return {
        range: range,
        bandHeight: bandHeight,
        padHeight: step * pct
      };
    },

    /**
     * fn.transformTranslateSubpixelShift
     *
     * This helper function takes a transform string and returns a vector that
     * tells us how much to shift an element in order to place it on a half-pixel
     * grid.
     *
     * @param  {string} transformStr A valid SVG transform string
     * @return {vecor}               Two-element array ([dx, dy])
     */
    transformTranslateSubpixelShift: function(transformStr) {
      var roundNumber = sszvis.fn.compose(Math.floor, Number);
      var m = transformStr.match(/(translate\()\s*([0-9.,\- ]+)\s*(\))/i);
      var vec = m[2]
        .replace(',', ' ')
        .replace(/\s+/, ' ')
        .split(' ')
        .map(Number);

      if (vec.length === 1) vec.push([0]);

      var vecRound = vec.map(roundNumber);
      return [vec[0] - vecRound[0], vec[1] - vecRound[1]];
    },

    /**
     * fn.translateString
     *
     * Pass an x and a y component, and this returns a translate string, which can be set as the 'transform' property of
     * an svg element.
     *
     * @param  {number} x     The x-component of the transform
     * @param  {number} y     The y-component of the transform
     * @return {string}       The translate string
     */
    translateString: function(x, y) {
      return 'translate(' + x + ',' + y + ')';
    },

    /**
     * fn.verticalBarDimension
     *
     * Generates a dimension configuration object to be used for laying out the vertical bar chart.
     *
     * @param  {number} width         the total width available to the horizontal bar chart. The computed chart layout is not guaranteed
     *                                to fit inside this width.
     * @param  {number} numBars       The number of bars in the bar chart.
     * @return {object}               An object containing configuration properties for use in laying out the vertical bar chart.
     *                                {
     *                                  barWidth:             the width of each bar in the bar chart
     *                                  padWidth:             the width of the padding between the bars in the bar chart
     *                                  padRatio:             the ratio between the padding and the step (barWidth + padding). This can be passed
     *                                                        as the second parameter to d3.scale.ordinal().rangeBands().
     *                                  outerRatio:           the outer ratio between the outer padding and the step. This can be passed as the
     *                                                        third parameter to d3.scale.ordinal().rangeBands().
     *                                  barGroupWidth:        the width of all the bars plus all the padding between the bars.
     *                                  totalWidth:           The total width of all bars, plus all inner and outer padding.
     *                                }
     */
    verticalBarChartDimensions: function(width, numBars) {
      var MAX_BAR_WIDTH = 48, // the maximum width of a bar
          MIN_PADDING = 2, // the minimum padding value
          MAX_PADDING = 100, // the maximum padding value
          TARGET_BAR_RATIO = 0.70, // the ratio of width to width + padding used to compute the initial width and padding
          TARGET_PADDING_RATIO = 1 - TARGET_BAR_RATIO, // the inverse of the bar ratio, this is the ratio of padding to width + padding
          numPads = numBars - 1, // the number of padding spaces
          // compute the target size of the padding
          // the derivation of this equation is available upon request
          padding = (width * TARGET_PADDING_RATIO) / ((TARGET_PADDING_RATIO * numPads) + (TARGET_BAR_RATIO * numBars)),
          // based on the computed padding, calculate the bar width
          barWidth = (width - (padding * numPads)) / numBars;

      // adjust for min and max bounds
      if (barWidth > MAX_BAR_WIDTH) {
        barWidth = MAX_BAR_WIDTH;
        // recompute the padding value where necessary
        padding = (width - (barWidth * numBars)) / numPads;
      }
      if (padding < MIN_PADDING) padding = MIN_PADDING;
      if (padding > MAX_PADDING) padding = MAX_PADDING;

      // compute other information
      var padRatio = 1 - (barWidth / (barWidth + padding)),
          computedBarSpace = barWidth * numBars + padding * numPads,
          outerRatio = (width - computedBarSpace) / 2 / (barWidth + padding);

      return {
        barWidth: barWidth,
        padWidth: padding,
        padRatio: padRatio,
        outerRatio: outerRatio,
        barGroupWidth: computedBarSpace,
        totalWidth: width
      };
    }

  };

});
