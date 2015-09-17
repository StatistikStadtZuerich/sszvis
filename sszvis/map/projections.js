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

  module.exports.zurichAgglomeration2012 = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichAgglomeration2012MapData.featureData(), sszvis.map.utils.constants.AGGLOMERATION_2012_KEY);
  };

  module.exports.switzerland = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.switzerlandMapData.featureData(), sszvis.map.utils.constants.SWITZERLAND_KEY);
  };

});
