/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

var queryProps = sszvis
  .responsiveProps()
  .prop("yLabel", {
    _: "Beschäftigte",
  })
  .prop("ticks", {
    _: 5,
  });

function parseRow(d) {
  return {
    category: d["Sektor"],
    xValue: sszvis.parseNumber(d["Zupendler"]),
  };
}

var xAcc = sszvis.prop("xValue");
var cAcc = sszvis.prop("category");

// Application state
// -----------------------------------------------

var state = {
  data: [],
  categories: [],
  selected: [],
};

// State transitions
// -----------------------------------------------

var actions = {
  prepareState: function (data) {
    state.data = data;
    state.categories = sszvis.set(state.data, cAcc);
    render(state);
  },

  showTooltip: function (_, category) {
    state.selected = state.data.filter(function (d) {
      return cAcc(d) === category;
    });
    render(state);
  },

  hideTooltip: function () {
    state.selected = [];
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
  var props = queryProps(sszvis.measureDimensions(config.id));
  var chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
  var bounds = sszvis.bounds(
    {
      height: 30 + chartDimensions.totalHeight + 40,
      top: 30,
      bottom: 40,
    },
    config.id
  );
  var chartWidth = Math.min(bounds.innerWidth, 800);

  // Scales

  var widthScale = d3
    .scaleLinear()
    .range([0, chartWidth])
    .domain([0, d3.max(state.data, xAcc)]);

  var yScale = d3
    .scaleBand()
    .padding(chartDimensions.padRatio)
    .paddingOuter(chartDimensions.outerRatio)
    .rangeRound([0, chartDimensions.totalHeight])
    .domain(state.categories);

  // Layers
  var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selected);

  // Components
  var barGen = sszvis
    .bar()
    .x(0)
    .y(sszvis.compose(yScale, cAcc))
    .width(sszvis.compose(widthScale, xAcc))
    .height(chartDimensions.barHeight)
    .centerTooltip(true)
    .fill(sszvis.scaleQual12());

  var xAxis = sszvis
    .axisX()
    .scale(widthScale)
    .orient("bottom")
    .alignOuterLabels(true)
    .title(props.yLabel);

  if (props.ticks) {
    xAxis.ticks(props.ticks);
  }

  var yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

  var tooltipHeader = sszvis.modularTextHTML().bold(
    sszvis.compose(function (d) {
      return isNaN(d) ? "k. A." : sszvis.formatNumber(d);
    }, xAcc)
  );

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .header(tooltipHeader)
    .visible(isSelected);

  // Rendering

  chartLayer.attr(
    "transform",
    sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top)
  );

  var bars = chartLayer.selectGroup("bars").call(barGen);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, chartDimensions.totalHeight))
    .call(xAxis);

  chartLayer
    .selectGroup("yAxis")
    .attr("transform", sszvis.translateString(0, chartDimensions.axisOffset))
    .call(yAxis);

  bars.selectAll("[data-tooltip-anchor]").call(tooltip);

  // Interaction
  // Use the move behavior to provide tooltips in the absence of a bar, i.e.
  // when we have missing data.
  var interactionLayer = sszvis
    .move()
    .xScale(widthScale)
    .yScale(yScale)
    .cancelScrolling(isWithinBarContour)
    .fireOnPanOnly(true)
    .on("move", actions.showTooltip)
    .on("end", actions.hideTooltip);

  chartLayer.selectGroup("interaction").call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

function isWithinBarContour(xValue, category) {
  var barDatum = sszvis.find(function (d) {
    return cAcc(d) === category;
  }, state.data);
  return sszvis.util.testBarThreshold(xValue, barDatum, xAcc, 1000);
}

function isSelected(d) {
  return state.selected.indexOf(d) >= 0;
}
