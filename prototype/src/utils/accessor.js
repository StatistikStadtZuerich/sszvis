var _ = require('underscore');


module.exports = function(props, attr, setter) {
  setter || (setter = _.identity);
  return function(val) {
    if (!arguments.length) return props[attr];
    props[attr] = setter(val, props[attr]);
    return this;
  }
}
