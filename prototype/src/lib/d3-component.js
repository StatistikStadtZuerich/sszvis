;(function() {

  d3.component = function(def) {
    var props = {};
    var renderer = identity;

    function component(selection) {
      selection.each(function(data) {
        renderer.apply(this, [data, props]);
      });
    }

    component.prop = function(prop, value, setter) {
      component[prop] = accessor(props, prop, setter).bind(component);
      component[prop](value);
      return component;
    }

    component.render = function(callback) {
      renderer = callback;
      return component;
    }

    return component;
  }

  function accessor(props, attr, setter) {
    setter || (setter = identity);
    return function(val) {
      if (!arguments.length) return props[attr];
      props[attr] = setter(val, props[attr]);
      return this;
    }
  }

  function identity(x) {
    return x;
  }

}());
