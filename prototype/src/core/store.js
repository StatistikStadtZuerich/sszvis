var Immutable = require('immutable');
var d3 = require('d3');

module.exports = function(initial) {
  var dispatch = d3.dispatch('change')
  var store = Immutable.fromJS(initial);

  return {
    get: function(key) {
      return store.get(key);
    },
    set: function(key, value) {
      var prev = store.toJS();
      store = store.set(key, value);
      dispatch.change(store.toJS(), prev);
    },
    change: function(handler) {
      dispatch.on('change', handler);
    },
    toJS: function() {
      return store.toJS();
    }
  }
}
