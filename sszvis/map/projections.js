/**
 * A collection of functions which return map projection functions.
 *
 * These functions abstract the use of sszvis.map.utils.swissMapProjection with the correct cache key.
 * One exists for each of the map types. Note that these functions only work if the correct map module has been loaded.
 *
 * Used in the examples inside map-extended for cases where a projection function is required.
 *
 * @param {Number} width            The width of the map to be rendered
 * @param {Number} height           The height of the map to be rendered
 */

import { swissMapProjection, constants } from './mapUtils.js';

export var zurichStadtKreise = function(width, height) {
  return swissMapProjection(width, height, window.sszvis.map.zurichStadtKreiseMapData.featureData(), constants.STADT_KREISE_KEY);
};

export var zurichStatistischeQuartiere = function(width, height) {
  return swissMapProjection(width, height, window.sszvis.map.zurichStatistischeQuartiereMapData.featureData(), constants.STATISTISCHE_QUARTIERE_KEY);
};

export var zurichWahlKreise = function(width, height) {
  return swissMapProjection(width, height, window.sszvis.map.zurichWahlKreiseMapData.featureData(), constants.WAHL_KREISE_KEY);
};

export var zurichStatistischeZonen = function(width, height) {
  return swissMapProjection(width, height, window.sszvis.map.zurichStatistischeZonenMapData.featureData(), constants.STATISTISCHE_ZONEN_KEY);
};

export var zurichAgglomeration2012 = function(width, height) {
  return swissMapProjection(width, height, window.sszvis.map.zurichAgglomeration2012MapData.featureData(), constants.AGGLOMERATION_2012_KEY);
};

export var switzerland = function(width, height) {
  return swissMapProjection(width, height, window.sszvis.map.switzerlandMapData.featureData(), constants.SWITZERLAND_KEY);
};
