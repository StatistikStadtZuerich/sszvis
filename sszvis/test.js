/**
 * @module sszvis/test
 *
 * A module for tests. Exposes an assert function for running a single test, and a runTests function
 * for running all available tests of the library. As features are added or changed, especially for functions
 * with a variety of input, output, and expected behavior, it is a good idea to write tests for those
 * features or functions, to check that future changes don't cause regressions or errors.
 *
 */
sszvis_namespace('sszvis.test', function(module) {
  'use strict';

  /**
   * sszvis.test.assert
   *
   * Assert a boolean. Provide a message and a boolean value. The boolean should be
   * the evaluation of a statement which is something you want to test.
   *
   * @param  {String} assertion      A string descriptor for the test
   * @param  {Boolean} test          The value of the test
   */
  module.exports.assert = function assert(assertion, test) {
    if (test) {
      sszvis.logger.log('assertion passed: ' + assertion);
    } else {
      sszvis.logger.error('assertion failed: ' + assertion);
    }
  }

  /**
   * sszvis.test.runTests
   *
   * The test suite. Call this function to run all tests of the library. You'll get a lot of console output.
   * 
   */
  module.exports.runTests = function() {
    runFormatTests();
  };

  // Just a shortcut alias
  var assert = module.exports.assert;

  // Tests for format functions
  function runFormatTests() {
    /* sszvis.format.number */
    var nfmt = sszvis.format.number;
    var precNfmt = sszvis.format.preciseNumber;

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

});
