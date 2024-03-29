/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

var queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: function (width) {
      var innerHeight = sszvis.aspectRatioSquare(width);
      return {
        top: 90,
        bottom: 30,
        height: 90 + innerHeight + 30,
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
  })
  .prop("control", {
    palm: function (width) {
      return sszvis.selectMenu;
    },
    _: function (width) {
      return sszvis.buttonGroup;
    },
  })
  .prop("controlWidth", {
    _: function (width) {
      return Math.min(width, sszvis.aspectRatioSquare.MAX_HEIGHT);
    },
  });

function parseRow(d) {
  return {
    id: sszvis.parseNumber(d["statistischeZoneId"]),
    year: sszvis.parseNumber(d["Jahr"]),
    gender: d["Geschlecht"],
    births: sszvis.parseNumber(d["Geburten"]),
    zonename: d["statistischeZoneName"],
  };
}

var datumAcc = sszvis.prop("datum");
var idAcc = sszvis.propOr("id", null);
var yearAcc = sszvis.prop("year");
var genderAcc = sszvis.prop("gender");
var birthsAcc = sszvis.propOr("births", 0);
var zoneNameAcc = sszvis.propOr("zonename", "--");

// Application state
// -----------------------------------------------
var state = {
  data: null,
  mapData: null,
  filteredData: [],
  selection: [],
  currentFilter: "Weiblich 1993",
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareData: function (data) {
    state.data = data;
    state.birthsRange = [0, d3.max(state.data, birthsAcc)];

    actions.setFilter(state.currentFilter);
  },

  prepareMapData: function (topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.statistische_zonen),
      borders: topojson.mesh(topo, topo.objects.statistische_zonen),
    };
    render(state);
  },

  setFilter: function (filterValue) {
    state.currentFilter = filterValue;
    var filter = filterValue.toLowerCase().split(" ");
    var gender = filter[0];
    var year = parseInt(filter[1]);

    state.filteredData = state.data.filter(function (d) {
      return genderAcc(d) === gender && yearAcc(d) === year;
    });

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
d3.csv("data/births_year_statisticalZones.csv", parseRow)
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
  var radiusScale = d3.scaleSqrt().domain(state.birthsRange).range([0, props.radiusMax]);

  // Layers

  var chartLayer = sszvis
    .createSvgLayer("#sszvis-chart", bounds, {
      key: "chartlayer",
    })
    .datum(state.filteredData);

  var tooltipLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds).datum(state.selection);

  // Components

  var bubbleMap = sszvis
    .mapRendererBubble()
    .fill(sszvis.scaleQual6()(0))
    .radius(function (d) {
      return !sszvis.defined(d) ? 0 : radiusScale(birthsAcc(d));
    })
    .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width));

  var choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .keyName("id")
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill(function (d) {
      return isSelected(d) ? sszvis.scaleDimGry()(0) : sszvis.scaleGry()(0);
    })
    .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
    .transitionColor(false)
    .anchoredShape(bubbleMap);

  var tooltipHeader = sszvis.modularTextHTML().plain(function (geod) {
    return birthsAcc(geod.datum) + " Geburten";
  });

  var tooltipBody = sszvis.modularTextHTML().plain(function (geod) {
    return zoneNameAcc(geod.datum);
  });

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(tooltipHeader)
    .body(tooltipBody)
    .visible(sszvis.compose(isSelected, datumAcc));

  var control = props
    .control()
    .values(["Männlich 1993", "Weiblich 1993", "Männlich 2014", "Weiblich 2014"])
    .current(state.currentFilter)
    .width(props.controlWidth)
    .change(actions.setFilter);

  var radiusLegend = sszvis
    .legendRadius()
    .scale(radiusScale)
    .tickFormat(sszvis.formatPreciseNumber(1));

  // Rendering

  chartLayer.call(choroplethMap);

  chartLayer
    .selectGroup("radiusLegend")
    .attr("transform", sszvis.translateString(props.legendX, bounds.innerHeight - 65))
    .call(radiusLegend);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  tooltipLayer
    .selectDiv("controls")
    .style("left", (bounds.innerWidth - control.width()) / 2 + "px")
    .style("top", 20 - bounds.padding.top + "px")
    .call(control);

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
