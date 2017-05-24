/**
 * Modular map component for a map of the cantons of Switzerland.
 */

import * as switzerlandMapData from '../sszvis/map/switzerlandMapData';
sszvis_namespace('sszvis.map.switzerlandMapData', function(module) {
  module.exports = switzerlandMapData;
});

import switzerlandBaseMap from '../sszvis/map/switzerlandBaseMap';
sszvis_namespace('sszvis.map.switzerlandBaseMap', function(module) {
  module.exports = switzerlandBaseMap;
});

import switzerland from '../sszvis/map/switzerland';
sszvis_namespace('sszvis.map.switzerland', function(module) {
  module.exports = switzerland;
});
