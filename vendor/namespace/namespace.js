(function(global){

  function isUndefined(value) {
    return typeof value == 'undefined';
  }

  function isPlainObject(value) {
    // this isPlainObject implementation is taken from jQuery ~2.1.2
    // Not plain objects:
    // - Any object or value whose internal [[Class]] property is not "[object Object]"
    // - DOM nodes
    // - window
    if ( value == null || Object.prototype.toString.call(value) !== "[object Object]" || value.nodeType || value === value.window ) {
      return false;
    }

    if ( value.constructor && !Object.prototype.hasOwnProperty.call( value.constructor.prototype, "isPrototypeOf" ) ) {
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
  }

}(window));

if (false) {

  // simple test suite for the namespace component
  namespace('sszvis.nsTest.func', function(module) {
    module.exports = function() { console.log('test success: module as function'); };
  });
  sszvis.nsTest.func();

  try {
    namespace('sszvis.nsTest.func', function(module) {
      module.exports = function() { console.log('test failed: no module overwrite');};
    })
    sszvis.nsTest.func();
  } catch(e) {
    console.log('test succeeded: no module overwrite');
  }

  try {
    namespace('sszvis.nsTest.func.extend', function(module) {
      module.exports = function() { console.log('test failed: no function extending');};
    });
    sszvis.nsTest.func.extend();
  } catch (e) {
    console.log('test succeeded: no function extending');
  }

  try {
    namespace('sszvis.nsTest.func.extend.extended', function(module) {
      module.exports = function() {console.log('test failed: deep nested extension of a function');}
    })
    sszvis.nsTest.func.extend.extended();
  } catch (e) {
    console.log('test succeeded: deep nested extension of a function');
  }

  try {
    namespace('sszvis.nsTest.func', function(module) {
      module.exports.coolprop = "1";
      module.exports.newprop = "2";
    })
    console.log('test failed: no in-module function extending using assignment');
  } catch (e) {
    console.log('test succeeded: no in-module function extending using assignment');
  }

  namespace('sszvis.nsTest.obj', function(m) {
    m.exports = {
      func: function() { console.log('test succeeded: define module as object'); },
      b: 2,
      c: 3
    }
  })
  sszvis.nsTest.obj.func();

  namespace('sszvis.nsTest.obj.extend', function(m) {
    m.exports = function() {}
  })
  console.log('test succeeded: extend object module');

  namespace('sszvis.nsTest.obj', function(m) {
    m.exports.aprop = 1
    m.exports.twoprop = 2
  })
  console.log('test succeded: in-module object extending using assignment');

  namespace('sszvis.nsTest.obj', function(m) {
    m.exports = {
      extension: 6,
      newthing: 10
    }
  })
  console.log('test succeeded: in-module object extending using an object');

}
