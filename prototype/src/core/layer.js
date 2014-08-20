var _ = require('underscore');
var uuid = require('uuid');
var d3 = require('d3');
var accessor = require('../utils/accessor');
var translate = require('../utils/translate');


/*
  Layers define a context with individual dimensions
  Layers can contain nested children
  By default there is one layer at full height and width

      L0
    +----+------------+
    | L1 | L2         |
    |    |            |
    |    +------------+
    |    | L3         |
    +----+------------+
*/


module.exports = function() {

  var props = {
    key: null,
    className: '',
    x: function(){return 0},
    y: function(){return 0},
    component: null
  }

  function layer(selection, context) {
    selection.each(function() {
      var el = d3.select(this)
        .classed(props.className, true)
        .attr('transform', translate(props.x(this, context), props.y(this, context)));

      props.component(el, context);
    });
  }

  layer.key = accessor(props, 'key').bind(layer);
  layer.className = accessor(props, 'className').bind(layer);
  layer.x = accessor(props, 'x').bind(layer);
  layer.y = accessor(props, 'y').bind(layer);
  layer.render = accessor(props, 'component').bind(layer);

  return layer;
}
