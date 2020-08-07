/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

var MAX_LEGEND_WIDTH = 320;
var queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: function (width) {
      var innerHeight = Math.min(sszvis.aspectRatio4to3(width), 400);
      return {
        bottom: 40,
        height: innerHeight + 40,
      };
    },
  })
  .prop("legendWidth", {
    _: function (width) {
      return Math.min(width / 2, MAX_LEGEND_WIDTH);
    },
  });

function parseRow(d) {
  return {
    geoId: sszvis.parseNumber(d["KantonNr"]),
    value: sszvis.parseNumber(d["Wert"]),
  };
}

var vAcc = sszvis.prop("value");

// Application state
// -----------------------------------------------
var state = {
  data: null,
  mapData: null,
  valueDomain: [0, 0],
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState: function (data) {
    state.data = data;
    state.valueDomain = [0, d3.max(state.data, vAcc)];

    render(state);
  },

  prepareMapData: function (topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.cantons),
      borders: topojson.mesh(topo, topo.objects.cantons),
    };
    render(state);
  },

  resize: function () {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv("data/M_swiss_fake.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);

d3.json("../topo/switzerland.json").then(actions.prepareMapData).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  if (state.data === null || state.mapData === null) {
    // loading ...
    return true;
  }

  var props = queryProps(sszvis.measureDimensions("#sszvis-chart"));
  var bounds = sszvis.bounds(props.bounds, "#sszvis-chart");

  // Scales

  var colorScale = sszvis.scaleDivNtrGry().domain(state.valueDomain);

  // Layers

  var chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.data);

  // Components

  var choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill(sszvis.compose(colorScale, vAcc))
    .defined(sszvis.compose(sszvis.not(isNaN), vAcc));

  var legend = sszvis
    .legendColorLinear()
    .scale(colorScale)
    .width(props.legendWidth)
    .labelText(["Frauen", "Männer"]);

  // Rendering

  chartLayer
    .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
    .call(choroplethMap);

  chartLayer
    .selectGroup("legend")
    .attr(
      "transform",
      sszvis.translateString(bounds.width / 2 - props.legendWidth / 2, bounds.innerHeight + 25)
    )
    .call(legend);

  sszvis.viewport.on("resize", actions.resize);
}
