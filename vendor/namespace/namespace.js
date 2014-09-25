(function(global){

  global.namespace = function(path, body) {
    var segments = path.split('.');
    var ancestors = segments.slice(0, segments.length - 1);
    var target = segments[segments.length - 1];
    var ns = ancestors.reduce(function(root, part) {
      if (typeof root[part] === 'undefined') root[part] = {};
      return root[part];
    }, global);

    var module = {exports: {}};
    body(module);

    return ns[target] = module.exports;
  }

}(window));
