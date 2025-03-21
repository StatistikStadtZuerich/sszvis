/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
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

const vAcc = sszvis.prop("value");
const gAcc = sszvis.prop("gender");
const aAcc = sszvis.prop("age");
const stackAcc = sszvis.prop("group");
const womenAcc = sszvis.prop("0");
const menAcc = sszvis.prop("1");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  ages: d3.range(0, 101), // [0 ... 100]
  groups: [],
  populations: {},
  maxStackedValue: 0,
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.groups = sszvis.set(state.data, groupAndStackAcc);

    state.stackedPyramidData = sszvis.stackedPyramidData(gAcc, aAcc, stackAcc, vAcc)(data);

    state.maxStackedValue = state.stackedPyramidData.maxValue;

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
  const chartDimensions = sszvis.measureDimensions(config.id);

  const props = queryProps(chartDimensions);
  const pyramidDimensions = sszvis.layoutPopulationPyramid(
    chartDimensions.width - 2,
    state.ages.length
  );

  const chartPadding = { top: 25, bottom: props.bottomPadding };

  const bounds = sszvis.bounds(
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

  const lengthScale = d3
    .scaleLinear()
    .domain([0, state.maxStackedValue])
    .range([0, pyramidDimensions.maxBarLength]);

  const positionScale = d3.scaleOrdinal().domain(state.ages).range(pyramidDimensions.positions);

  const colorScale = sszvis.scaleGender6Origin().domain(state.groups);

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.stackedPyramidData);

  // Components

  const pyramid = sszvis
    .stackedPyramid()
    .barFill(sszvis.compose(colorScale, groupAndStackAcc))
    .barPosition(positionScale)
    .barHeight(pyramidDimensions.barHeight)
    .barWidth(lengthScale)
    .leftAccessor(womenAcc)
    .rightAccessor(menAcc);

  const xAxis = sszvis.axisX
    .pyramid()
    .scale(lengthScale)
    .orient("bottom")
    .title("Anzahl")
    .titleAnchor("middle")
    .titleCenter(true);

  const yAxis = sszvis.axisY
    .ordinal()
    .scale(positionScale)
    .orient("right")
    .tickFormat((d) => (d === 0 ? "" : sszvis.formatAge(d)))
    .ticks(5)
    .title("Alter in Jahren")
    .dyTitle(-18);

  const colorLegend = sszvis
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
