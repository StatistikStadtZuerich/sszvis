/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

var queryProps = sszvis
  .responsiveProps()
  .prop("bottomPadding", {
    lap: 150,
    _: 100,
  })
  .prop("numLegendRows", {
    lap: 4,
    _: 2,
  });

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
var stackAcc = sszvis.prop("group");
var womenAcc = sszvis.prop("0");
var menAcc = sszvis.prop("1");

// Application state
// -----------------------------------------------
var state = {
  data: [],
  ages: d3.range(0, 101), // [0 ... 100]
  groups: [],
  populations: {},
  maxStackedValue: 0,
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState: function (data) {
    state.data = data;
    state.groups = sszvis.set(state.data, groupAndStackAcc);

    state.stackedPyramidData = sszvis.stackedPyramidData(gAcc, aAcc, stackAcc, vAcc)(data);

    state.maxStackedValue = state.stackedPyramidData.maxValue;

    render(state);
  },

  resize: function () {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  var chartDimensions = sszvis.measureDimensions(config.id);

  var props = queryProps(chartDimensions);
  var pyramidDimensions = sszvis.layoutPopulationPyramid(
    chartDimensions.width - 2,
    state.ages.length
  );

  var chartPadding = { top: 25, bottom: props.bottomPadding };

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
    .domain([0, state.maxStackedValue])
    .range([0, pyramidDimensions.maxBarLength]);

  var positionScale = d3.scaleOrdinal().domain(state.ages).range(pyramidDimensions.positions);

  var colorScale = sszvis.scaleQual12().domain(state.groups);

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.stackedPyramidData);

  // Components

  var pyramid = sszvis
    .stackedPyramid()
    .barFill(sszvis.compose(colorScale, groupAndStackAcc))
    .barPosition(positionScale)
    .barHeight(pyramidDimensions.barHeight)
    .barWidth(lengthScale)
    .leftAccessor(womenAcc)
    .rightAccessor(menAcc);

  var xAxis = sszvis.axisX
    .pyramid()
    .scale(lengthScale)
    .orient("bottom")
    .title("Anzahl")
    .titleAnchor("middle")
    .titleCenter(true);

  var yAxis = sszvis.axisY
    .ordinal()
    .scale(positionScale)
    .orient("right")
    .tickFormat(function (d) {
      return d === 0 ? "" : sszvis.formatAge(d);
    })
    .ticks(5)
    .title("Alter in Jahren")
    .dyTitle(-18);

  var colorLegend = sszvis
    .legendColorOrdinal()
    .scale(colorScale)
    .orientation("vertical")
    .rows(props.numLegendRows)
    .columnWidth(Math.min(bounds.innerWidth / 2, 300));

  // Rendering

  chartLayer
    .selectGroup("populationPyramid")
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

// Helper functions
// -----------------------------------------------
function groupAndStackAcc(d) {
  return gAcc(d) + " (" + stackAcc(d) + ")";
}
