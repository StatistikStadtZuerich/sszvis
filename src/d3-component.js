import { selection as d3Selection } from 'd3';

/**
 * d3 plugin to simplify creating reusable charts. Implements
 * the reusable chart interface and can thus be used interchangeably
 * with any other reusable charts.
 *
 * @example
 * var myAxis = sszvis.component()
 *   .prop('ticks').ticks(10)
 *   .render(function(data, i, j) {
 *     var selection = select(this);
 *     var props = selection.props();
 *     var axis = d3.svg.axis().ticks(props.ticks);
 *     selection.enter()
 *       .append('g')
 *       .call(axis);
 *   })
 * console.log(myAxis.ticks()); //=> 10
 * select('svg').call(myAxis.ticks(3));
 *
 * @see http://bost.ocks.org/mike/chart/
 *
 * @property {function} prop Define a property accessor
 * @property {function} render The chart's body
 *
 * @return {sszvis.component} A d3 reusable chart
 */
export function component() {
  var props = {};
  var selectionRenderer = null;
  var renderer = identity;

  /**
   * Constructor
   *
   * @param  {d3.selection} selection Passed in by d3
   */
  function sszvisComponent(selection) {
    if (selectionRenderer) {
      selection.props = function(){ return clone(props); };
      selectionRenderer.apply(selection, slice(arguments));
    }
    selection.each(function() {
      this.__props__ = clone(props);
      renderer.apply(this, slice(arguments));
    });
  }

  /**
   * Define a property accessor with an optional setter
   *
   * @param  {String} prop The property's name
   * @param  {Function} [setter] The setter's context will be bound to the
   *         sszvis.component. Sets the returned value to the given property
   * @return {sszvis.component}
   */
  sszvisComponent.prop = function(prop, setter) {
    setter || (setter = identity);
    sszvisComponent[prop] = accessor(props, prop, setter.bind(sszvisComponent)).bind(sszvisComponent);
    return sszvisComponent;
  };

  /**
   * Delegate a properties' accessors to a delegate object
   *
   * @param  {String} prop     The property's name
   * @param  {Object} delegate The target having getter and setter methods for prop
   * @return {sszvis.component}
   */
  sszvisComponent.delegate = function(prop, delegate) {
    sszvisComponent[prop] = function() {
      var result = delegate[prop].apply(delegate, slice(arguments));
      return (arguments.length === 0) ? result : sszvisComponent;
    };
    return sszvisComponent;
  };

  /**
   * Creates a render context for the given component's parent selection.
   * Use this, when you need full control over the rendering of the component
   * and you need access to the full selection instead of just the selection
   * of one datum.
   *
   * @param  {Function} callback
   * @return {[sszvis.component]}
   */
  sszvisComponent.renderSelection = function(callback) {
    selectionRenderer = callback;
    return sszvisComponent;
  };

  /**
   * Creates a render context for the given component. Implements the
   * d3.selection.each interface.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections#each
   *
   * @param  {Function} callback
   * @return {sszvis.component}
   */
  sszvisComponent.render = function(callback) {
    renderer = callback;
    return sszvisComponent;
  };

  return sszvisComponent;
};

/**
 * d3.selection plugin to get the properties of a sszvis.component.
 * Works similarly to d3.selection.data, but for properties.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @return {Object} An object of properties for the given component
 */
d3Selection.prototype.props = function() {
  // It would be possible to make this work exactly like
  // d3.selection.data(), but it would need some test cases,
  // so we currently simplify to the most common use-case:
  // getting props.
  if (arguments.length) throw new Error('selection.props() does not accept any arguments');
  if (this.size() != 1) throw new Error('only one group is supported');
  if (this._groups[0].length != 1) throw new Error('only one node is supported');

  var group = this._groups[0];
  var node  = group[0];
  return node.__props__ || {};
};

/**
 * Creates an accessor function that either gets or sets a value, depending
 * on whether or not it is called with arguments.
 *
 * @param  {Object} props The props to get from or set to
 * @param  {String} attr The property to be accessed
 * @param  {Function} [setter] Transforms the data on set
 * @return {Function} The accessor function
 */
function accessor(props, prop, setter) {
  setter || (setter = identity);
  return function() {
    if (!arguments.length) return props[prop];

    props[prop] = setter.apply(null, slice(arguments));
    return this;
  };
}

function identity(d) {
  return d;
}

function slice(array) {
  return Array.prototype.slice.call(array);
}

function clone(obj) {
  var copy = {};
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}