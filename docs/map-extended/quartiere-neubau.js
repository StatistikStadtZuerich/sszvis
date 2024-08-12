/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

var queryProps = sszvis.responsiveProps().prop("bounds", {
  _: function (width) {
    var innerHeight = sszvis.aspectRatioSquare(width);
    return {
      top: 30,
      bottom: 30,
      height: 30 + innerHeight + 30,
    };
  },
});

function parseRow(d) {
  var parsedYear = sszvis.parseNumber(d["bezugsjahr"]);
  parsedYear = parsedYear === 0 ? Number.NaN : parsedYear;
  return {
    id: sszvis.parseNumber(d["id"]),
    name: d["name"],
    ownership: d["traegerschaft"],
    year: parsedYear,
  };
}

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

d3.json("../static/topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

d3.json("data/neubausiedlungen.json")
  .then(actions.prepareAdditionalMapData)
  .catch(sszvis.loadError);

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

  var chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.data);

  var tooltipLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds).datum(state.selection);

  // Components

  var mapMaker = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .lakeFeatures(state.mapData.lakeFeatures)
    .lakeBorders(state.mapData.lakeBorders)
    .lakePathColor("#7C7C7C")
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill("none")
    .borderColor("#7C7C7C");

  var mapPath = sszvis.swissMapPath(
    bounds.innerWidth,
    bounds.innerHeight,
    state.mapData.features,
    "zurichStadtfeatures"
  );

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

  var tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(nameAcc, datumAcc));

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(tooltipHeader)
    .body(sszvis.compose(yearAcc, datumAcc))
    .visible(isSelected);

  // Rendering

  chartLayer.call(mapMaker);

  chartLayer.call(newBuildings);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  sszvis.viewport.on("resize", actions.resize);
}

function isSelected(d) {
  return state.selection.includes(d.datum);
}
