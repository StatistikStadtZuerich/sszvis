(function() {

  d3.component = function(def) {
    var props = {};
    var renderer = identity;

    function component(selection) {
      selection.each(function() {
        this.__props__ = clone(props);
        renderer.apply(this, Array.prototype.slice.call(arguments));
      });
    }

    component.prop = function(prop, setter) {
      setter || (setter = identity);
      component[prop] = accessor(props, prop, setter.bind(component)).bind(component);
      return component;
    }

    component.render = function(callback) {
      renderer = callback;
      return component;
    }

    return component;
  }

  d3.selection.prototype.props = function() {
    // It would be possible to make this work exactly like
    // d3.selection.data(), but it would need some test cases,
    // so we currently simplify to the most common use-case:
    // getting props.
    if (arguments.length) throw new Error("selection.props() does not accept any arguments");
    if (this.length != 1) throw new Error("only one group is supported");
    if (this[0].length != 1) throw new Error("only one node is supported");

    var group = this[0];
    var node  = group[0];
    return node.__props__ || {};
  }

  function accessor(props, attr, setter) {
    return function() {
      if (!arguments.length) return props[attr];

      props[attr] = setter.apply(setter, slice(arguments));
      return this;
    }
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

}());
