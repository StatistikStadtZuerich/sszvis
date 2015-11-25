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
sszvis_namespace('sszvis.map.projection', function(module) {

  module.exports.zurichStadtKreise = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichStadtKreiseMapData.featureData(), sszvis.map.utils.constants.STADT_KREISE_KEY);
  };

  module.exports.zurichStatistischeQuartiere = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichStatistischeQuartiereMapData.featureData(), sszvis.map.utils.constants.STATISTISCHE_QUARTIERE_KEY);
  };

  module.exports.zurichWahlKreise = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichWahlKreiseMapData.featureData(), sszvis.map.utils.constants.WAHL_KREISE_KEY);
  };

  module.exports.zurichStatistischeZonen = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichStatistischeZonenMapData.featureData(), sszvis.map.utils.constants.STATISTISCHE_ZONEN_KEY);
  };

  module.exports.zurichAgglomeration2012 = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichAgglomeration2012MapData.featureData(), sszvis.map.utils.constants.AGGLOMERATION_2012_KEY);
  };

  module.exports.switzerland = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.switzerlandMapData.featureData(), sszvis.map.utils.constants.SWITZERLAND_KEY);
  };

});
