var _ = require('underscore');


module.exports = function(props, attr, writer) {
  writer || (writer = _.identity);
  return function(val) {
    if (!arguments.length) return props[attr];
    props[attr] = writer(val);
    return this;
  }
}
