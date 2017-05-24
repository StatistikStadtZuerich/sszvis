/**
 * Modular map component for a map of the Zurich Statistische Quartiere.
 */

import * as zurichStatistischeQuartiereMapData from '../sszvis/map/zurichStatistischeQuartiereMapData';
sszvis_namespace('sszvis.map.zurichStatistischeQuartiereMapData', function(module) {
  module.exports = zurichStatistischeQuartiereMapData;
});

import zurichStatistischeQuartiereBaseMap from '../sszvis/map/zurichStatistischeQuartiereBaseMap';
sszvis_namespace('sszvis.map.zurichStatistischeQuartiereBaseMap', function(module) {
  module.exports = zurichStatistischeQuartiereBaseMap;
});

import zurichStatistischeQuartiere from '../sszvis/map/zurichStatistischeQuartiere';
sszvis_namespace('sszvis.map.zurichStatistischeQuartiere', function(module) {
  module.exports = zurichStatistischeQuartiere;
});
