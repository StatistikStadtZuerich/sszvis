/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------
// these are the internal edges of the bins used for the color scale
// IMPORTANT: because of the way d3.scale.threshold works,
// do not specify fixed upper and lower bounds
// anything less than or equal to the first element in BIN_EDGES will be grouped in the first bin,
// and anything greater than or equal to the last element will be grouped in the last bin
const BIN_EDGES = d3.range(100, 1000, 100);
const queryProps = sszvis.responsiveProps().prop("legendWidth", {
  _: (width) => Math.min(width * 0.8, 260),
});

function parseRow(d) {
  return {
    g1: d["Group1"],
    g2: d["Group2"],
    value: sszvis.parseNumber(d["Value"]),
  };
}

const xAcc = sszvis.prop("g1");
const yAcc = sszvis.prop("g2");
const cAcc = sszvis.prop("value");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  g1List: [],
  g2List: [],
  valueDomain: [0, 0],
  selection: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.g1List = sszvis.set(state.data, xAcc);
    state.g2List = sszvis.set(state.data, yAcc);
    state.valueDomain = d3.extent(state.data, cAcc);

    render(state);
  },

  showTooltip(e, datum) {
    state.selection = [datum];
    render(state);
  },

  hideTooltip() {
    state.selection = [];
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
  const containerWidth = sszvis.measureDimensions(config.id).width;
  const squarePadding = 2;
  const tablePadding = {
    top: 40,
    right: 0,
    bottom: 60,
    left: 40,
  };
  // heatTableDimensions calculates a set of useful properties for configuring the heat table.
  // give it the targeted width (final width will not necessarily match this), the padding between squares, and the number of squares
  // in each dimension (x, then y)
  const tableDimensions = sszvis.dimensionsHeatTable(
    containerWidth,
    squarePadding,
    state.g1List.length,
    state.g2List.length,
    tablePadding
  );

  // construct the bounds as usual, but add the left and right padding to the width, and the top and bottom padding to the height
  // This is because, when bounds are being constructed, the padding is subtracted from width and height to provide innerWidth and innerHeight, but we want these values to represent the table's dimensions
  const bounds = sszvis.bounds(
    {
      height: tablePadding.top + tableDimensions.height + tablePadding.bottom,
      left: tablePadding.left,
      right: tablePadding.right,
      top: tablePadding.top,
      bottom: tablePadding.bottom,
    },
    config.id
  );
  const props = queryProps(bounds);

  // Scales

  const xScale = d3
    .scaleBand()
    .padding(tableDimensions.padRatio)
    .paddingOuter(0)
    .rangeRound([0, tableDimensions.width])
    .domain(state.g1List);

  const yScale = d3
    .scaleBand()
    .padding(tableDimensions.padRatio)
    .paddingOuter(0)
    .rangeRound([0, tableDimensions.height])
    .domain(state.g2List);

  // create a linear color interpolator for generating the output range of bin colors
  const interpolateColor = sszvis.scaleDivVal().domain(state.valueDomain);

  // the color bins are created by taking samples at equal spots along the data domain
  // binColors.length must equal BIN_EDGES.length + 1
  const binColors = d3.range(0, 10_001, 110).map(interpolateColor);
  // for the threshold scale, the number of values in the range must be one greater than the
  // number of values in the domain.

  const colorScale = d3.scaleThreshold().domain(BIN_EDGES).range(binColors);

  const xValue = sszvis.compose(xScale, xAcc);
  const yValue = sszvis.compose(yScale, yAcc);
  const cValue = sszvis.compose(colorScale, cAcc);

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

  // Components

  const barGen = sszvis
    .bar()
    .x(xValue)
    .y(yValue)
    .width(tableDimensions.side)
    .height(tableDimensions.side)
    .fill(cValue)
    .stroke((d) =>
      sszvis.contains(state.selection, d) ? sszvis.slightlyDarker(cValue(d)) : "none"
    );

  const xAxis = sszvis.axisX
    .ordinal()
    .scale(xScale)
    .orient("top")
    .tickSize(0, 0)
    .tickPadding(0)
    .title("Group 1")
    .titleAnchor("middle")
    .titleCenter(true)
    .dyTitle(-20)
    .highlightTick((tickValue) => state.selection.some((d) => xAcc(d) === tickValue));

  const yAxis = sszvis.axisY
    .ordinal()
    .scale(yScale)
    .orient("left")
    .title("Group 2")
    .titleVertical(true)
    .titleAnchor("middle")
    .titleCenter(true)
    .dxTitle(-20)
    .highlightTick((tickValue) => state.selection.some((d) => yAcc(d) === tickValue));

  const legend = sszvis
    .legendColorBinned()
    .scale(colorScale)
    .displayValues(BIN_EDGES)
    .endpoints(state.valueDomain)
    .width(props.legendWidth)
    .labelFormat(sszvis.formatNumber);

  const tooltipHeaderText = sszvis.modularTextHTML().bold("Units");

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(tooltipHeaderText)
    .body((d) => [
      ["Group 1", xAcc(d)],
      ["Group 2", yAcc(d)],
      ["Wert", cAcc(d)],
    ])
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .visible(isSelected);

  // Rendering

  const bars = chartLayer
    .selectGroup("bars")
    .attr("transform", sszvis.translateString(tableDimensions.centeredOffset, 0))
    .call(barGen);

  bars.selectAll("[data-tooltip-anchor]").call(tooltip);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(tableDimensions.centeredOffset, -10))
    .call(xAxis);

  chartLayer
    .selectGroup("yAxis")
    .attr("transform", sszvis.translateString(tableDimensions.centeredOffset - 10, 0))
    .call(yAxis);

  chartLayer
    .selectGroup("legend")
    .attr(
      "transform",
      sszvis.translateString(
        tableDimensions.centeredOffset + (tableDimensions.width - props.legendWidth) / 2,
        bounds.innerHeight + 16
      )
    )
    .call(legend);

  // Interaction

  const interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-bar")
    .on("start", actions.showTooltip)
    .on("pan", actions.showTooltip)
    .on("end", actions.hideTooltip);

  bars.call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
function isSelected(d) {
  return sszvis.contains(state.selection, d);
}
