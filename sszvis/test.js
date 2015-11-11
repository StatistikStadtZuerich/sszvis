sszvis_namespace('sszvis.test', function(module) {
  'use strict';

  module.exports.assert = function assert(assertion, test) {
    if (test) {
      sszvis.logger.log('assertion passed: ' + assertion);
    } else {
      sszvis.logger.error('assertion failed: ' + assertion);
    }
  }

  /* Test Suite */
  module.exports.runTests = function() {
    runFormatTests();
  };

  var assert = module.exports.assert;

  function runFormatTests() {
    /* sszvis.format.number */
    var nfmt = sszvis.format.number;

    // Note: this uses an mdash 
    assert('NaN is mdash –', nfmt(NaN) === '–');
    assert('0, without precision', nfmt(0) === '0');
    assert('0, with precision', nfmt(0, 3) === '0.000');

    // Note: tests for numbers > 10000 expect a 'narrow space' as the thousands separator
    assert('abs >10000, uses a thin space thousands separator', nfmt(10250) === '10 250');
    assert('abs >10000, with decimal precision supplied', nfmt(10250, 5) === '10 250.00000');
    assert('abs >10000, with precision and decimals', nfmt(10250.12345, 2) === '10 250.12');
    assert('abs >10000, with precision, decimals, and needing to be rounded', nfmt(10250.16855, 3) === '10 250.169');
    assert('(negative number) abs >10000, with precision, decimals, and needing to be rounded', nfmt(-10250.16855, 3) === '-10 250.169');
    assert('abs 100 - 10000, has no seprator', nfmt(6578) === '6578');
    assert('abs 100 - 10000, with decimal but no precision rounds to 1 point', nfmt(1234.5678) === '1234.6');
    assert('abs 100 - 10000, with precision', nfmt(1234, 2) === '1234.00');
    assert('abs 100 - 10000, with precision and decimals', nfmt(1234.12345678, 3) === '1234.123');
    assert('abs 100 - 10000, with precision, decimals, and rounding', nfmt(1234.9876543, 3) === '1234.988');
    assert('(negative number) abs 100 - 10000, with precision, decimals, and rounding', nfmt(-1234.9876543, 3) === '-1234.988');
    assert('abs 0 - 100, no decimals, no precision', nfmt(42) === '42');
    assert('(negative number) abs 0 - 100, no decimals, no precision', nfmt(-42) === '-42');
    assert('abs 0 - 100, 1 decimal, no precision, rounds to 1', nfmt(42.2) === '42.2');
    assert('abs 0 - 100, 2 decimals, no precision, rounds to 2', nfmt(42.45) === '42.45');
    assert('(negative number) abs 0 - 100, >2 decimals, no precision, rounds to 2', nfmt(-42.1234) === '-42.12');
    assert('abs 0 - 100, no decimals, with precision', nfmt(42, 3) === '42.000');
    assert('abs 0 - 100, 1 decimals, with precision', nfmt(42.2, 3) === '42.200');
    assert('abs 0 - 100, 2 decimals, with precision', nfmt(42.26, 3) === '42.260');
    assert('abs 0 - 100, >2 decimals, with precision', nfmt(42.987654, 4) === '42.9877');
    assert('abs 0 - 100, leading zeroes, with precision', nfmt(20.000042, 4) === '20.0000');
    assert('abs 0 - 100, leading zeroes, precision causes rounding', nfmt(20.000088, 4) === '20.0001');
    assert('abs 0 - 1, 1 decimal, no precision, rounds to 1', nfmt(0.1) === '0.1');
    assert('abs 0 - 1, 2 decimals, no precision, rounds to 2', nfmt(0.12) === '0.12');
    assert('abs 0 - 1, >2 decimals, no precision, rounds to 2', nfmt(0.8765) === '0.88');
    assert('(negative number) abs 0 - 1, >2 decimals, no precision, rounds to 2', nfmt(-0.8765) === '-0.88');
    assert('abs 0 - 1, 1 decimal, with precision', nfmt(0.2, 2) === '0.20');
    assert('abs 0 - 1, 2 decimals, with precision', nfmt(0.34, 3) === '0.340');
    assert('abs 0 - 1, >2 decimals, with 2 precision', nfmt(0.98765432, 2) === '0.99');
    assert('abs 0 - 1, >2 decimals, with 4 precision', nfmt(0.98765432, 4) === '0.9877');
    assert('abs 0 - 1, >2 decimals, with 6 precision', nfmt(0.98765432, 6) === '0.987654');
    assert('(negative number) abs 0 - 1, >2 decimals, with 6 precision', nfmt(-0.98765432, 6) === '-0.987654');
    assert('abs 0 - 1, leading zeroes', nfmt(-0.000124, 6) === '-0.000124');
    assert('abs 0 - 1, leading zeroes, all digits cut off', nfmt(0.00000556, 3) === '0.000');
    // This one's a little weird - the negative sign is currently defined behavior
    assert('(negative number) abs 0 - 1, leading zeroes, all digits cut off', nfmt(-0.000124, 3) === '-0.000');
    assert('raw numbers with explicit zero decimals lose those decimals because of Javascript', nfmt(42.000) === '42');
    assert('to add zeroes to a raw number with explicit zero decimals, pass a precision value', nfmt(42.000, 3) === '42.000');
  }

});
