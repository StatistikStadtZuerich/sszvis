/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------
var TITLE = "Diagrammtitel";
var DESCRIPTION = "Kurze Beschreibung des Inhalts dieses Diagramms";
var queryProps = sszvis.responsiveProps().prop("bounds", {
  _: function (width) {
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

function parseRow(d) {
  var parsedYear = sszvis.parseNumber(d["bezugsjahr"]);
  parsedYear = parsedYear === 0 ? NaN : parsedYear;
  return {
    id: sszvis.parseNumber(d["id"]),
    name: d["name"],
    ownership: d["traegerschaft"],
    year: parsedYear,
  };
}

var idAcc = sszvis.prop("id");
var datumAcc = sszvis.prop("datum");
var nameAcc = sszvis.prop("name");
var yearAcc = sszvis.prop("year");

// Application state
// -----------------------------------------------
var state = {
  data: null,
  mapData: null,
  additionalMapData: null,
  selection: [],
  yearRange: [0, 0],
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareData: function (data) {
    state.data = data;
    state.yearRange = d3.extent(data, yearAcc);

    render(state);
  },

  prepareMapData: function (topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.statistische_quartiere),
      borders: topojson.mesh(topo, topo.objects.statistische_quartiere),
      lakeFeatures: topojson.feature(topo, topo.objects.lakezurich),
      lakeBorders: topojson.mesh(topo, topo.objects.statistische_quartiere_lakebounds),
    };
    render(state);
  },

  prepareAdditionalMapData: function (geojson) {
    state.additionalMapData = {
      features: geojson,
    };
    render(state);
  },

  selectHovered: function (d) {
    state.selection = [d];
    render(state);
  },

  deselectHovered: function () {
    state.selection = [];
    render(state);
  },

  resize: function () {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv("data/gemeinnuetzige.csv", parseRow).then(actions.prepareData).catch(sszvis.loadError);

d3.json("../topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

d3.json("data/gemeinnuetzige.json").then(actions.prepareAdditionalMapData).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  if (state.data === null || state.mapData === null || state.additionalMapData === null) {
    // loading ...
    return true;
  }

  var props = queryProps(sszvis.measureDimensions("#sszvis-chart"));
  var bounds = sszvis.bounds(props.bounds, "#sszvis-chart");

  // Scales
  var colorScale = sszvis.scaleSeqBlu().reverse().domain(state.yearRange);

  // Layers

  // It's important that this html layer comes first, so that it lies under the svg
  // For more information about the 'key' argument to the metadata object, see the
  // comment in the source code for createHtmlLayer
  var htmlLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds, {
    key: "topolayer",
  });

  var chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.data);

  var tooltipLayer = sszvis
    .createHtmlLayer("#sszvis-chart", bounds, {
      key: "tooltiplayer",
    })
    .datum(state.selection);

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

  var newBuildings = sszvis
    .mapRendererGeoJson()
    .dataKeyName("id")
    .geoJsonKeyName("OBJECTID")
    .geoJson(state.additionalMapData.features)
    .mapPath(mapPath)
    .defined(sszvis.compose(sszvis.defined, yearAcc))
    .fill(sszvis.compose(colorScale, yearAcc))
    .stroke(sszvis.compose(colorScale, yearAcc))
    .strokeWidth(1.25)
    .on("over", actions.selectHovered)
    .on("click", actions.selectHovered)
    .on("out", actions.deselectHovered);

  // Offset is applied for better alignment with the map data
  var geoOffset = -0.0011;

  var layerBounds = [
    [8.431443 + geoOffset, 47.448978 + geoOffset],
    [8.647471 + geoOffset, 47.309726 + geoOffset],
  ];

  var topoLayer = sszvis
    .mapRendererImage()
    .projection(projection)
    .src("data/topo_layer_280915.png")
    // Expects longitude, latitude
    .geoBounds(layerBounds)
    .opacity(0.4);

  var tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(nameAcc, datumAcc));

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(tooltipHeader)
    .body(sszvis.compose(yearAcc, datumAcc))
    .visible(isSelected);

  // Rendering

  htmlLayer.call(topoLayer);

  chartLayer.call(choroplethMap);

  chartLayer.call(newBuildings);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  sszvis.viewport.on("resize", actions.resize);
}

function isSelected(d) {
  return state.selection.indexOf(d.datum) >= 0;
}
