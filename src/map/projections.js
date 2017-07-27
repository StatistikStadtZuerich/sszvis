/**
 * A collection of functions which return map projection functions.
 *
 * These functions abstract the use of sszvis.swissMapProjection with the correct cache key.
 * One exists for each of the map types. Note that these functions only work if the correct map module has been loaded.
 *
 * Used in the examples inside map-extended for cases where a projection function is required.
 *
 * @param {Number} width            The width of the map to be rendered
 * @param {Number} height           The height of the map to be rendered
 */

import { swissMapProjection, STADT_KREISE_KEY, STATISTISCHE_QUARTIERE_KEY, WAHL_KREISE_KEY, STATISTISCHE_ZONEN_KEY, AGGLOMERATION_2012_KEY, SWITZERLAND_KEY } from './mapUtils.js';

export var zurichStadtKreiseProjection = function(width, height) {
  return swissMapProjection(width, height, zurichStadtKreiseMapData.featureData(), STADT_KREISE_KEY);
};

export var zurichStatistischeQuartiereProjection = function(width, height) {
  return swissMapProjection(width, height, zurichStatistischeQuartiereMapData.featureData(), STATISTISCHE_QUARTIERE_KEY);
};

export var zurichWahlKreiseProjection = function(width, height) {
  return swissMapProjection(width, height, zurichWahlKreiseMapData.featureData(), WAHL_KREISE_KEY);
};

export var zurichStatistischeZonenProjection = function(width, height) {
  return swissMapProjection(width, height, zurichStatistischeZonenMapData.featureData(), STATISTISCHE_ZONEN_KEY);
};

export var zurichAgglomeration2012Projection = function(width, height) {
  return swissMapProjection(width, height, zurichAgglomeration2012MapData.featureData(), AGGLOMERATION_2012_KEY);
};

export var switzerlandProjection = function(width, height) {
  return swissMapProjection(width, height, switzerlandMapData.featureData(), SWITZERLAND_KEY);
};
