/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------
var MAX_CONTROL_WIDTH = 300;
var queryProps = sszvis.responsiveProps().prop("controlWidth", {
  _: function (width) {
    return Math.min(width, MAX_CONTROL_WIDTH);
  },
});

function parseRow(d) {
  return {
    category: d["Sektor"],
    value: sszvis.parseNumber(d["Zupendler"]),
    year: sszvis.parseNumber(d["Jahr"]),
  };
}

var xAcc = sszvis.prop("value");
var yAcc = sszvis.prop("category");
var jAcc = sszvis.prop("year");

// Application state
// -----------------------------------------------
var state = {
  data: [],
  categories: [],
  years: [],
  selectedYear: null,
  selectedData: [],
  selected: [],
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState: function (data) {
    state.data = data;
    state.categories = sszvis.set(state.data, yAcc);
    state.years = sszvis.set(state.data, jAcc);
    actions.selectYear(null, d3.max(state.years));
  },

  selectYear: function (e, year) {
    state.selectedYear = year;
    state.selectedData = state.data.filter(function (d) {
      return jAcc(d) === year;
    });
    render(state);
  },

  showTooltip: function (_, category) {
    state.selected = state.data.filter(function (d) {
      return yAcc(d) === category;
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
  var chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
  var bounds = sszvis.bounds(
    { height: 80 + chartDimensions.totalHeight + 33, top: 80, bottom: 25 },
    config.id
  );
  var props = queryProps(bounds);
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

  var cScale = sszvis.scaleQual12();
  var cScaleDark = cScale.darker();

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.selectedData);

  var controlLayer = sszvis.createHtmlLayer(config.id, bounds);

  var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selected);

  // Components

  var barGen = sszvis
    .bar()
    .x(0)
    .y(sszvis.compose(yScale, yAcc))
    .width(sszvis.compose(widthScale, xAcc))
    .height(chartDimensions.barHeight)
    .centerTooltip(true)
    .fill(function (d) {
      return isSelected(d) ? cScaleDark(d) : cScale(d);
    });

  var xAxis = sszvis.axisX().scale(widthScale).orient("bottom").alignOuterLabels(true);

  var yAxis = sszvis.axisY
    .ordinal()
    .scale(yScale)
    .orient("right")
    .highlightTick(function (d) {
      return sszvis.contains(state.selected.map(sszvis.compose(String, yAcc)), String(d));
    });

  var buttonGroup = sszvis
    .buttonGroup()
    .values(state.years)
    .width(props.controlWidth)
    .current(state.selectedYear)
    .change(actions.selectYear);

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

  controlLayer
    .selectDiv("controls")
    .style("left", Math.max(0, (bounds.innerWidth - buttonGroup.width()) / 2) + "px")
    .style("top", 20 - bounds.padding.top + "px")
    .call(buttonGroup);

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
    return jAcc(d) === state.selectedYear && yAcc(d) === category;
  }, state.data);
  return sszvis.util.testBarThreshold(xValue, barDatum, xAcc, 2000);
}

function isSelected(d) {
  return state.selected.includes(d);
}
