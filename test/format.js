/**
 * Test sszvis/format.js
 */
(function() {
  'use strict';

  var assertEqual = sszvis.assertEqual('sszvis.format');

  [
    [10250, '10 250'],
    [10250.91, '10 251'],
    [2350, '2350'],
    [2350.29 , '2350.3'],
    [209.00005, '209'],
    [41, '41'],
    [41.329, '41.33'],
    [20, '20'],
    [1.329, '1.33'],
    [0.00034, '0.00034'],
    [0.5, '0.5'],
    [-0.5000000000000001, '-0.5'],
    [0, '0']
  ].forEach(function(pair){
    assertEqual(sszvis.format.number(pair[0]), pair[1]);
  });

}());
