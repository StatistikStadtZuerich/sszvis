sszvis_namespace('sszvis.map.projection', function(module) {

  module.exports.zurichStadtKreise = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichStadtKreiseMapData.featureData(), 'zurichStadtKreise');
  };

  module.exports.zurichStatistischeQuartiere = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichStatistischeQuartiereMapData.featureData(), 'zurichStatistischeQuartiere');
  };

  module.exports.zurichWahlKreise = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichWahlKreiseMapData.featureData(), 'zurichWahlKreise');
  };

  module.exports.zurichAgglomeration2012 = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.zurichAgglomeration2012MapData.featureData(), 'zurichAgglomeration2012');
  };

  module.exports.switzerland = function(width, height) {
    return sszvis.map.utils.swissMapProjection(width, height, sszvis.map.switzerlandMapData.featureData(), 'switzerland');
  };

});
