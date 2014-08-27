var f = require('./f');

module.exports = function(props, attr, setter) {
  setter || (setter = f.identity);
  return function(val) {
    if (!arguments.length) return props[attr];
    props[attr] = setter(val, props[attr]);
    return this;
  }
}
