/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

function parseRow(d) {
  return {
    age: sszvis.parseNumber(d["Alter"]),
    gender: d["Geschlecht"],
    group: d["Ausbildung"],
    value: sszvis.parseNumber(d["Anzahl"]),
  };
}

var vAcc = sszvis.prop("value");
var gAcc = sszvis.prop("gender");
var aAcc = sszvis.prop("age");
var refAcc = sszvis.prop("group");
var womenAcc = sszvis.prop("Frauen");
var menAcc = sszvis.prop("Männer");
var collegeAcc = sszvis.prop("Hochschulabschluss");
var otherAcc = sszvis.prop("Andere");

// Application state
// -----------------------------------------------
var state = {
  data: [],
  ages: d3.range(0, 101), // [0 ... 100]
  groups: [],
  maxValue: 0,
  populations: {},
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState(data) {
    state.data = data;
    state.groups = sszvis.set(state.data, gAcc).reverse();
    state.maxValue = d3.max(state.data, vAcc);
    state.populations = sszvis.cascade().objectBy(refAcc).objectBy(gAcc).apply(state.data);

    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  var pyramidWidth = sszvis.measureDimensions(config.id).width - 2;
  var pyramidDimensions = sszvis.layoutPopulationPyramid(pyramidWidth, state.ages.length);
  var chartPadding = { top: 25, bottom: 86 };
  var bounds = sszvis.bounds(
    {
      height: chartPadding.top + pyramidDimensions.totalHeight + chartPadding.bottom,
      top: chartPadding.top,
      bottom: chartPadding.bottom,
      left: pyramidDimensions.chartPadding,
      right: pyramidDimensions.chartPadding,
    },
    config.id
  );

  // Scales

  var lengthScale = d3
    .scaleLinear()
    .domain([0, state.maxValue])
    .range([0, pyramidDimensions.maxBarLength]);

  var positionScale = d3.scaleOrdinal().domain(state.ages).range(pyramidDimensions.positions);

  var colorScale = sszvis.scaleQual6().domain(state.groups);

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.populations);

  // Components

  var pyramid = sszvis
    .pyramid()
    .barFill(sszvis.compose(colorScale, gAcc))
    .barPosition(sszvis.compose(positionScale, aAcc))
    .barHeight(pyramidDimensions.barHeight)
    .barWidth(sszvis.compose(lengthScale, vAcc))
    .leftAccessor(sszvis.compose(womenAcc, collegeAcc))
    .rightAccessor(sszvis.compose(menAcc, collegeAcc))
    .leftRefAccessor(sszvis.compose(womenAcc, otherAcc))
    .rightRefAccessor(sszvis.compose(menAcc, otherAcc));

  var xAxis = sszvis.axisX
    .pyramid()
    .scale(lengthScale)
    .orient("bottom")
    .ticks(5)
    .title("Anzahl Frauen und Männer mit Hochschulabschluss")
    .titleAnchor("middle")
    .titleCenter(true);

  var yAxis = sszvis.axisY
    .ordinal()
    .scale(positionScale)
    .orient("right")
    .tickFormat((d) => (d === 0 ? "" : sszvis.formatAge(d)))
    .ticks(5)
    .title("Alter in Jahren")
    .dyTitle(-18);

  var colorLegend = sszvis
    .legendColorOrdinal()
    .scale(colorScale)
    .reverse(true)
    .horizontalFloat(true);

  // Rendering

  chartLayer
    .selectGroup("populationPyramid")
    .datum(state.populations)
    .attr("transform", sszvis.translateString(bounds.innerWidth / 2, 0))
    .call(pyramid);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(bounds.innerWidth / 2, bounds.innerHeight))
    .call(xAxis);

  chartLayer.selectGroup("yAxis").attr("transform", sszvis.translateString(0, 0)).call(yAxis);

  chartLayer
    .selectGroup("colorLegend")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight + 60))
    .call(colorLegend);

  sszvis.viewport.on("resize", actions.resize);
}
