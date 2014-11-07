/**
 * Test vendor/namespace/namespace.js
 */
(function(){
  // simple test suite for the namespace component
  namespace('sszvis.nsTest.func', function(module) {
    module.exports = function() { console.log('test succeeded: module as function'); };
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
  console.log('test succeeded: in-module object extending using assignment');

  namespace('sszvis.nsTest.obj', function(m) {
    m.exports = {
      extension: 6,
      newthing: 10
    }
  })
  console.log('test succeeded: in-module object extending using an object');

}());
