/**
 * Modular map component for a map of the Zurich Wahlkreise.
 */

import switzerlandMapData from '../sszvis/map/zurichWahlKreiseMapData';
sszvis_namespace('sszvis.map.zurichWahlKreiseMapData', function(module) {
  module.exports = switzerlandMapData;
});

import zurichWahlKreiseBaseMap from '../sszvis/map/zurichWahlKreiseBaseMap';
sszvis_namespace('sszvis.map.zurichWahlKreiseBaseMap', function(module) {
  module.exports = zurichWahlKreiseBaseMap;
});

import zurichWahlKreise from '../sszvis/map/zurichWahlKreise';
sszvis_namespace('sszvis.map.zurichWahlKreise', function(module) {
  module.exports = zurichWahlKreise;
});
