/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

var queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: function (width) {
      var innerHeight = sszvis.aspectRatioSquare(width);
      return {
        top: 30,
        bottom: 30,
        height: 30 + innerHeight + 30,
      };
    },
  })
  .prop("legendX", {
    _: function (width) {
      return Math.max(width / 2 - 205, 5);
    },
  })
  .prop("radiusMax", {
    _: function (width) {
      return Math.min(14, Math.max(width / 28, 10));
    },
  });

function parseRow(d) {
  return {
    id: sszvis.parseNumber(d["zoneid"]),
    value: sszvis.parseNumber(d["value"]),
    zonename: d["zonename"],
  };
}

var datumAcc = sszvis.prop("datum");
var idAcc = sszvis.propOr("id", null);
var valueAcc = sszvis.propOr("value", 0);
var zoneNameAcc = sszvis.propOr("zonename", "--");

// Application state
// -----------------------------------------------
var state = {
  data: null,
  mapData: null,
  selection: [],
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareData: function (data) {
    state.data = data;
    state.valueRange = [0, d3.max(state.data, valueAcc)];

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
  selectHovered: function (d) {
    state.selection = [d.datum];
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
d3.csv("data/fake_statistical_quarters.csv", parseRow)
  .then(actions.prepareData)
  .catch(sszvis.loadError);

d3.json("../topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

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
  // Any time you visualize a quantity using a circle, you should make the total
  // area of the circle proportional to the data value. Be sure to avoid using the
  // radius or the diameter to encode the data value, because the consequent quadratic
  // scaling of the area affects the visual perception of the quantity in undesirable ways.
  // This scale takes the square root of the input and uses that to scale the radius. When the
  // result is used as the radius of a circle, the area of the circle will be linearly
  // proportional to the input quantity.
  var radiusScale = d3.scaleSqrt().domain(state.valueRange).range([0, props.radiusMax]);

  // Layers

  var chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.data);

  var tooltipLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds).datum(state.selection);

  // Components

  var bubbleMap = sszvis
    .mapRendererBubble()
    .fill(sszvis.scaleQual6()(0))
    .radius(function (d) {
      return !sszvis.defined(d) ? 0 : radiusScale(valueAcc(d));
    })
    .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width));

  var choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .lakeFeatures(state.mapData.lakeFeatures)
    .lakeBorders(state.mapData.lakeBorders)
    .keyName("id")
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill(function (d) {
      return isSelected(d) ? sszvis.scaleDimGry()(0) : sszvis.scaleGry()(0);
    })
    .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
    .transitionColor(false)
    .anchoredShape(bubbleMap);

  var tooltipHeader = sszvis
    .modularTextHTML()
    .plain(sszvis.compose(sszvis.formatNumber, valueAcc, datumAcc));

  var tooltipBody = sszvis.modularTextHTML().plain(sszvis.compose(zoneNameAcc, datumAcc));

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(tooltipHeader)
    .body(tooltipBody)
    .visible(sszvis.compose(isSelected, datumAcc));

  var radiusLegend = sszvis
    .legendRadius()
    .scale(radiusScale)
    .tickFormat(sszvis.formatPreciseNumber(1));

  // Rendering

  chartLayer
    .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
    .call(choroplethMap);

  chartLayer
    .selectGroup("radiusLegend")
    .attr("transform", sszvis.translateString(props.legendX, bounds.innerHeight - 65))
    .call(radiusLegend);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  // Interaction

  var interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-map__area--entering, .sszvis-anchored-circle--entering")
    .on("start", actions.selectHovered)
    .on("pan", actions.selectHovered)
    .on("end", actions.deselectHovered);

  chartLayer.call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

function isSelected(d) {
  return sszvis.defined(d) && state.selection.indexOf(d) !== -1;
}
