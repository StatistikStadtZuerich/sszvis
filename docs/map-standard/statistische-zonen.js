/* global d3, topojson, sszvis */

/* Configuration
  ----------------------------------------------- */

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
  return {
    geoId: sszvis.parseNumber(d["id"]),
    value: sszvis.parseNumber(d["value"]),
  };
}

var vAcc = sszvis.prop("value");

/* Application state
  ----------------------------------------------- */
var state = {
  data: null,
  mapData: null,
  valueDomain: [0, 0],
};

/* State transitions
  ----------------------------------------------- */
var actions = {
  prepareState: function (data) {
    state.data = data;
    state.valueDomain = [0, d3.max(state.data, vAcc)];

    render(state);
  },

  prepareMapData: function (topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.statistische_zonen),
      borders: topojson.mesh(topo, topo.objects.statistische_zonen),
    };
    render(state);
  },

  resize: function () {
    render(state);
  },
};

/* Data initialization
  ----------------------------------------------- */
d3.csv("data/M_statzone_fake.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);

d3.json("../topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

/* Render
  ----------------------------------------------- */
function render(state) {
  if (state.data === null || state.mapData === null) {
    // loading ...
    return true;
  }

  var props = queryProps(sszvis.measureDimensions("#sszvis-chart"));
  var bounds = sszvis.bounds(props.bounds, "#sszvis-chart");

  // Scales

  var colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

  // Layers

  var chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.data);

  // Components

  // You can optionally use .withLake(false) to hide the textured lake shape and reveal
  // the four lake zones underneath
  var choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill(sszvis.compose(colorScale, vAcc))
    .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
    .defined(sszvis.compose(sszvis.not(isNaN), vAcc));

  // Rendering

  chartLayer.call(choroplethMap);

  sszvis.viewport.on("resize", actions.resize);
}
