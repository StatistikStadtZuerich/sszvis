/**
 * @module sszvis/test
 *
 * A module for tests. Exposes an assert function for running a single test, and a runTests function
 * for running all available tests of the library. As features are added or changed, especially for functions
 * with a variety of input, output, and expected behavior, it is a good idea to write tests for those
 * features or functions, to check that future changes don't cause regressions or errors.
 *
 */
'use strict';

import * as fn from './fn.js';
import * as logger from './logger.js';
import format from './format.js';
import * as breakpoint from './breakpoint.js';
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
  runFormatTests(assert('runFormatTests'));
  runBreakpointTests(assert('runBreakpointTests'));
  runPropsQueryTests(assert('runPropsQueryTests'));
};

// Tests for format functions
function runFormatTests(assert) {
  /* sszvis.format.number */
  var nfmt = format.number;
  var precNfmt = format.preciseNumber;

  // Note: this uses an mdash
  assert('NaN is mdash –', nfmt(NaN) === '–');
  assert('0, without precision', nfmt(0) === '0');
  assert('0, with precision', precNfmt(3, 0) === '0.000');
  assert('test that currying works, 0', precNfmt(3)(0) === '0.000');
  assert('test that currying works, 123.456789', precNfmt(3)(123.123456) === '123.123');

  // Note: tests for numbers > 10000 expect a 'narrow space' as the thousands separator
  assert('abs >10000, uses a thin space thousands separator', nfmt(10250) === '10 250');
  assert('abs >10000, with decimal precision supplied', precNfmt(5, 10250) === '10 250.00000');
  assert('abs >10000, with precision and decimals', precNfmt(2, 10250.12345) === '10 250.12');
  assert('abs >10000, with precision, decimals, and needing to be rounded', precNfmt(3, 10250.16855) === '10 250.169');
  assert('(negative number) abs >10000, with precision, decimals, and needing to be rounded', precNfmt(3, -10250.16855) === '-10 250.169');
  assert('abs 100 - 10000, has no seprator', nfmt(6578) === '6578');
  assert('abs 100 - 10000, with decimal but no precision rounds to 1 point', nfmt(1234.5678) === '1234.6');
  assert('abs 100 - 10000, with precision', precNfmt(2, 1234) === '1234.00');
  assert('abs 100 - 10000, with precision and decimals', precNfmt(3, 1234.12345678) === '1234.123');
  assert('abs 100 - 10000, with precision, decimals, and rounding', precNfmt(3, 1234.9876543) === '1234.988');
  assert('(negative number) abs 100 - 10000, with precision, decimals, and rounding', precNfmt(3, -1234.9876543) === '-1234.988');
  assert('abs 0 - 100, no decimals, no precision', nfmt(42) === '42');
  assert('(negative number) abs 0 - 100, no decimals, no precision', nfmt(-42) === '-42');
  assert('abs 0 - 100, 1 decimal, no precision, rounds to 1', nfmt(42.2) === '42.2');
  assert('abs 0 - 100, 2 decimals, no precision, rounds to 2', nfmt(42.45) === '42.45');
  assert('(negative number) abs 0 - 100, >2 decimals, no precision, rounds to 2', nfmt(-42.1234) === '-42.12');
  assert('abs 0 - 100, no decimals, with precision', precNfmt(3, 42) === '42.000');
  assert('abs 0 - 100, 1 decimals, with precision', precNfmt(3, 42.2) === '42.200');
  assert('abs 0 - 100, 2 decimals, with precision', precNfmt(3, 42.26) === '42.260');
  assert('abs 0 - 100, >2 decimals, with precision', precNfmt(4, 42.987654) === '42.9877');
  assert('abs 0 - 100, leading zeroes, with precision', precNfmt(4, 20.000042) === '20.0000');
  assert('abs 0 - 100, leading zeroes, precision causes rounding', precNfmt(4, 20.000088) === '20.0001');
  assert('abs 0 - 1, 1 decimal, no precision, rounds to 1', nfmt(0.1) === '0.1');
  assert('abs 0 - 1, 2 decimals, no precision, rounds to 2', nfmt(0.12) === '0.12');
  assert('abs 0 - 1, >2 decimals, no precision, rounds to 2', nfmt(0.8765) === '0.88');
  assert('(negative number) abs 0 - 1, >2 decimals, no precision, rounds to 2', nfmt(-0.8765) === '-0.88');
  assert('abs 0 - 1, 1 decimal, with precision', precNfmt(2, 0.2) === '0.20');
  assert('abs 0 - 1, 2 decimals, with precision', precNfmt(3, 0.34) === '0.340');
  assert('abs 0 - 1, >2 decimals, with 2 precision', precNfmt(2, 0.98765432) === '0.99');
  assert('abs 0 - 1, >2 decimals, with 4 precision', precNfmt(4, 0.98765432) === '0.9877');
  assert('abs 0 - 1, >2 decimals, with 6 precision', precNfmt(6, 0.98765432) === '0.987654');
  assert('(negative number) abs 0 - 1, >2 decimals, with 6 precision', precNfmt(6, -0.98765432) === '-0.987654');
  assert('abs 0 - 1, leading zeroes', precNfmt(6, -0.000124) === '-0.000124');
  assert('abs 0 - 1, leading zeroes, all digits cut off', precNfmt(3, 0.00000556) === '0.000');
  // This one's a little weird - the negative sign is currently defined behavior
  assert('(negative number) abs 0 - 1, leading zeroes, all digits cut off', precNfmt(3, -0.000124) === '-0.000');
  assert('raw numbers with explicit zero decimals lose those decimals because of Javascript', nfmt(42.000) === '42');
  assert('to add zeroes to a raw number with explicit zero decimals, pass a precision value', precNfmt(3, 42.000) === '42.000');
}


// FIXME: more tests
function runBreakpointTests(assert) {
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




  var bps = breakpoint.spec([
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


function runPropsQueryTests(assert) {
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
