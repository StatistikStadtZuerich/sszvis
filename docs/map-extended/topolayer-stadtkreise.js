/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

var queryProps = sszvis.responsiveProps().prop("bounds", {
  _(width) {
    // The calculation of the rastermap bounds is a bit more complex due to the fact
    // that we have to deal with a raster image in the background that has a bigger
    // size than the vector map.
    //
    // At the maximum map size (420x420px) the raster image overlaps the image by
    // the magic padding numbers below. At smaller sizes, we apply a scale factor
    // to calculate the respective paddings.
    var scale = width / (sszvis.aspectRatioSquare.MAX_HEIGHT + 49 + 42);

    var padding = {
      top: Math.min(36 * scale, 36),
      right: 49 * scale,
      bottom: Math.min(31 * scale, 31),
      left: 42 * scale,
    };

    var innerWidth = width - padding.left - padding.right;
    var innerHeight = sszvis.aspectRatioSquare(innerWidth);

    // We always want a 1:1 ratio, so we restrict the innerWidth to the max height
    // by increasing the horizontal padding.
    if (innerHeight < innerWidth) {
      var excessPadding = innerWidth - innerHeight;
      padding.right = padding.right + excessPadding / 2;
      padding.left = padding.left + excessPadding / 2;
    }

    return {
      top: padding.top,
      bottom: padding.bottom,
      left: padding.left,
      right: padding.right,
      height: padding.top + innerHeight + padding.bottom,
    };
  },
});

// Application state
// -----------------------------------------------
var state = {
  mapData: null,
};

var actions = {
  resize() {
    render(state);
  },

  prepareMapData(topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.stadtkreise),
      borders: topojson.mesh(topo, topo.objects.stadtkreise),
      lakeFeatures: topojson.feature(topo, topo.objects.lakezurich),
      lakeBorders: topojson.mesh(topo, topo.objects.stadtkreis_lakebounds),
    };
    render(state);
  },
};

// Initialization
// -----------------------------------------------

d3.json("../static/topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  if (state.mapData === null) {
    // loading ...
    return true;
  }
  // NOTE: The bounds commented out here are used to generate screenshots for aligning the
  // topographic layer for clipping at a window width of 516px
  // var bounds = sszvis.bounds({ height: 1000, width: 991, top: 0, right: 96, bottom: 0, left: 81 });
  var props = queryProps(sszvis.measureDimensions("#sszvis-chart"));
  var bounds = sszvis.bounds(props.bounds, "#sszvis-chart");

  // Layers

  // It's important that this html layer comes first, so that it lies under the svg
  var htmlLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds);

  var chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds);

  // Components

  var choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .lakeFeatures(state.mapData.lakeFeatures)
    .lakeBorders(state.mapData.lakeBorders)
    .lakeFadeOut(true)
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill("none")
    .borderColor("#545454")
    .lakePathColor("#545454");

  var mapPath = sszvis.swissMapPath(
    bounds.innerWidth,
    bounds.innerHeight,
    state.mapData.features,
    "zurichStadtfeatures"
  );

  var projection = mapPath.projection();

  // Offset is applied for better alignment with the map data
  var geoOffset = -0.0011;

  var layerBounds = [
    [8.431_443 + geoOffset, 47.448_978 + geoOffset],
    [8.647_471 + geoOffset, 47.309_726 + geoOffset],
  ];

  // This example uses the map data modules containing base64-encoded clipped data
  var topoLayer = sszvis
    .mapRendererImage()
    .projection(projection)
    .src("data/topo_layer_280915-test-clipped.png")
    // Expects longitude, latitude
    .geoBounds(layerBounds)
    .opacity(0.8);

  // Rendering

  htmlLayer.call(topoLayer);

  chartLayer.call(choroplethMap);

  sszvis.viewport.on("resize", actions.resize);
}
