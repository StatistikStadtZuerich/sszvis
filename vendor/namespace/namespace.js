(function(global){
  'use strict';

  function isUndefined(value) {
    return typeof value == 'undefined';
  }

  function isPlainObject(value) {
    // this isPlainObject implementation is taken from jQuery ~2.1.2
    // Not plain objects:
    // - Any object or value whose internal [[Class]] property is not '[object Object]'
    // - DOM nodes
    // - window
    if ( value === null || Object.prototype.toString.call(value) !== '[object Object]' || value.nodeType || value === value.window ) {
      return false;
    }

    if ( value.constructor && !Object.prototype.hasOwnProperty.call( value.constructor.prototype, 'isPrototypeOf' ) ) {
      return false;
    }

    // If the function hasn't returned already, we're confident that
    // |value| is a plain object, created by {} or constructed with new Object
    return true;
  }

  function throwNSOverwriteError(nsName, nsTarget) {
    throw new Error('in namespace definition: ' + nsName + ' - attempting to overwrite an existing name: ' + nsTarget);
  }

  function throwNSExtendError(nsName, nsTarget) {
    throw new Error('in namespace definition: ' + nsName + ' - attempting to add properties to a non-module: ' + nsTarget);
  }

  function ensureExtendable(base, target, nsName) {
    if (isUndefined(base[target])) base[target] = {};
    if (!isPlainObject(base[target])) throwNSExtendError(nsName, target);
  }

  function ns_extend(nsname, obj, source) {
    for (var name in source) {
      if (source.hasOwnProperty(name)) {
        if (!isUndefined(obj[name])) throwNSOverwriteError(nsname, name);
        obj[name] = source[name];
      }
    }
    return obj;
  }

// NOTE does this correspond to some best practice. Can it be found somewhere?
  global.namespace = function(path, body) {
    var segments = path.split('.');
    var ancestors = segments.slice(0, segments.length - 1);
    var target = segments[segments.length - 1];
    var ns = ancestors.reduce(function(root, part) {
      ensureExtendable(root, part, path);
      return root[part];
    }, global);

    var module = { exports: {} };
    body(module);

    var moduleExports = module.exports;
    if (isPlainObject(moduleExports)) {
      // extend existing module with the values from the returned object
      ensureExtendable(ns, target, path);
      ns_extend(path, ns[target], moduleExports);
    } else {
      // overwrite existing module with the returned value
      if (!isUndefined(ns[target])) throwNSOverwriteError(path, target);
      ns[target] = moduleExports;
    }

    return ns[target];
  };

}(window));
