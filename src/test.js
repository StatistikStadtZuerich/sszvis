/**
 * @module sszvis/test
 *
 * A module for tests. Exposes an assert function for running a single test, and a runTests function
 * for running all available tests of the library. As features are added or changed, especially for functions
 * with a variety of input, output, and expected behavior, it is a good idea to write tests for those
 * features or functions, to check that future changes don't cause regressions or errors.
 *
 */

import * as breakpoint from './breakpoint.js';
import * as fn from './fn.js';
import * as logger from './logger.js';
import responsiveProps from './responsiveProps.js';

/**
 * sszvis.test.assert
 *
 * Assert a boolean. Provide a message and a boolean value. The boolean should be
 * the evaluation of a statement which is something you want to test.
 *
 * @param  {String} context        The name of the context the assertion is operating in
 * @param  {String} assertion      A string descriptor for the test
 * @param  {Boolean} test          The value of the test
 */
export var assert = function(context) {
  return function(message, test) {
    if (test) {
      logger.log('[' + context + '] ✔ ' + message);
    } else {
      logger.error('[' + context + '] ✘ ' + message);
    }
  };
};

/**
 * sszvis.test.runTests
 *
 * The test suite. Call this function to run all tests of the library. You'll get a lot of console output.
 *
 */
export var runTests = function() {
  runBreakpointTests(assert('runBreakpointTests'));
  runPropsQueryTests(assert('runPropsQueryTests'));
};

// FIXME: more tests
function runBreakpointTests(assert) { // eslint-disable-line no-shadow
  var accName = fn.prop('name');

  // sszvis.breakpoint([...])
  // sszvis.breakpoint(measurement)
  // sszvis.breakpoint()

  // sszvis.breakpoint.parseSpec([{}])
  // sszvis.breakpoint.createSpec([{}])
  // sszvis.breakpoint.createSpec() -> Default spec???
  // sszvis.breakpoint.define({...})
  // sszvis.breakpoint.match({...})
  // sszvis.breakpoint.palm({...})

  // find

  // test

  // match




  var bps = breakpoint.breakpointCreateSpec([
    {name: 's', width: 10},
    {name: 'l', width: 20}
  ]);


  /*
   var bps = sszvis.breakpoint.spec([{name: 's', width: 300}])
   bps(measurement)
   bps()
   */
  // Selection
  assert('select breakpoints "s", "l", and "_"', arraysEqual(bps({width: 1}).map(accName), ['s', 'l', '_']));
  assert('select breakpoints "s", "l", and "_"', arraysEqual(bps({width: 10}).map(accName), ['s', 'l', '_']));
  assert('select breakpoint "l" and "_"', arraysEqual(bps({width: 11}).map(accName), ['l', '_']));
  assert('select catch all breakpoint "_"', arraysEqual(bps({width: 21}).map(accName), ['_']));
}


function runPropsQueryTests(assert) { // eslint-disable-line no-shadow
  var pqT1 = responsiveProps()
    .prop('test', {
      small: 2,
      large: 4,
      _: 8
    });

  assert('responsiveProps works as expected for small', pqT1(breakpoint.SMALL - 1).test === 2);
  assert('responsiveProps works as expected for large', pqT1(breakpoint.WIDE - 1).test === 32);
  assert('responsiveProps works as expected for _', pqT1(breakpoint.WIDE + 20).test === 64);
  assert('responsiveProps works as expected when width is exactly on the breakpoint', pqT1(breakpoint.WIDE).test === 64);

  var pqT2 = responsiveProps()
    .breakpoints({
      small: 30,
      medium: 50,
      large: 70
    })
    .prop('test', {
      small: 2,
      medium: 4,
      large: 8,
      _: 16
    });

  assert('responsiveProps works for user-defined breakpoints (small)', pqT2(10).test === 2);
  assert('responsiveProps works for user-defined breakpoints (medium)', pqT2(40).test === 4);
  assert('responsiveProps works for user-defined breakpoints (large)', pqT2(60).test === 8);
  assert('responsiveProps works for user-defined breakpoints (_)', pqT2(90).test === 16);

  var pqT3 = responsiveProps()
    .prop('test', {
      small: 2
    });

  assert('responsiveProps should complain and return undefined when you do not provide a _ option', !fn.defined(pqT3(1000).test));

  var pqT4 = responsiveProps()
    .prop('test', {
      notvalidbp: 8,
      _: 16
    });

  assert('responsiveProps should complain and return undefined when you provide an invalid breakpoint', !fn.defined(pqT4(650).test));

  var pqT5 = responsiveProps()
    .breakpoints({
      small: 30,
      medium: 50,
      large: 70
    })
    .prop('first_test', {
      medium: 4,
      _: 64,
    })
    .prop('second_test', {
      large: 16,
      _: 32
    })
    .prop('third_test', {
      small: 2,
      _: 8
    });

  assert('responsiveProps behaves as expected even when not all breakpoints are provided - under', pqT5(40).first_test === 4);
  assert('responsiveProps behaves as expected even when not all breakpoints are provided - over', pqT5(60).first_test === 64);
  assert('responsiveProps behaves as expected even when not all breakpoints are provided - way over', pqT5(100).first_test === 64);
  assert('responsiveProps does the right thing with multiple props - under', pqT5(20).second_test === 16);
  assert('responsiveProps does the right thing with multiple props - still under', pqT5(60).second_test === 16);
  assert('responsiveProps does the right thing with multiple props - over', pqT5(100).second_test === 32);
  assert('responsiveProps multiple props - small', pqT5(20).third_test === 2);
  assert('responsiveProps multiple props - small over', pqT5(40).third_test === 8);
  assert('responsiveProps tests widths to be strictly less than the breakpoint - first', pqT5(50).first_test === 64);
  assert('responsiveProps tests widths to be strictly less than the breakpoint - second', pqT5(70).second_test === 32);
  assert('responsiveProps tests widths to be strictly less than the breakpoint - third', pqT5(30).third_test === 8);

}





function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
