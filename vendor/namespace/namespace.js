(function(global){

  function ns_extend(nsname, obj) {
    var source;
    for (var i = 2, l = arguments.length; i < l; ++i) {
      source = arguments[i];
      for (var name in source) {
        if (source.hasOwnProperty(name)) {
          if (typeof obj[name] !== 'undefined') throwNSOverwriteError(nsname, name);
          obj[name] = source[name];
        }
      }
    }
    return obj;
  }

  function throwNSOverwriteError(nsName, nsTarget) {
    throw new Error('in namespace: ' + nsName + ' - attempting to overwrite an existing name: ' + nsTarget);
  }

  global.namespace = function(path, body) {
    var segments = path.split('.');
    var ancestors = segments.slice(0, segments.length - 1);
    var target = segments[segments.length - 1];
    var ns = ancestors.reduce(function(root, part) {
      if (typeof root[part] === 'undefined') root[part] = {};
      return root[part];
    }, global);

    var originalExports = {};
    var module = { exports: originalExports };
    body(module);

    var moduleExports = module.exports;
    if (moduleExports === originalExports) {
      if (typeof ns[target] === 'undefined') ns[target] = {};
      ns_extend(path, ns[target], moduleExports);
    } else {
      if (typeof ns[target] !== 'undefined') throwNSOverwriteError(ancestors.join('.'), target);
      ns[target] = moduleExports;
    }

    return ns[target];
  }

}(window));
