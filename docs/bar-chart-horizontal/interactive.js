/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------
const MAX_CONTROL_WIDTH = 300;
const queryProps = sszvis.responsiveProps().prop("controlWidth", {
  _: (width) => Math.min(width, MAX_CONTROL_WIDTH),
});

function parseRow(d) {
  return {
    category: d["Sektor"],
    value: sszvis.parseNumber(d["Zupendler"]),
    year: sszvis.parseNumber(d["Jahr"]),
  };
}

const xAcc = sszvis.prop("value");
const yAcc = sszvis.prop("category");
const jAcc = sszvis.prop("year");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  categories: [],
  years: [],
  selectedYear: null,
  selectedData: [],
  selected: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.categories = sszvis.set(state.data, yAcc);
    state.years = sszvis.set(state.data, jAcc);
    actions.selectYear(null, d3.max(state.years));
  },

  selectYear(_event, year) {
    state.selectedYear = year;
    state.selectedData = state.data.filter((d) => jAcc(d) === year);
    render(state);
  },

  showTooltip(_event, category) {
    state.selected = state.data.filter((d) => yAcc(d) === category);
    render(state);
  },

  hideTooltip() {
    state.selected = [];
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
  const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
  const bounds = sszvis.bounds(
    { height: 80 + chartDimensions.totalHeight + 33, top: 80, bottom: 25 },
    config.id
  );
  const props = queryProps(bounds);
  const chartWidth = Math.min(bounds.innerWidth, 800);

  // Scales

  const widthScale = d3
    .scaleLinear()
    .range([0, chartWidth])
    .domain([0, d3.max(state.data, xAcc)]);

  const yScale = d3
    .scaleBand()
    .padding(chartDimensions.padRatio)
    .paddingOuter(chartDimensions.outerRatio)
    .rangeRound([0, chartDimensions.totalHeight])
    .domain(state.categories);

  const cScale = sszvis.scaleQual12();
  const cScaleDark = cScale.darker();

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.selectedData);

  const controlLayer = sszvis.createHtmlLayer(config.id, bounds);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selected);

  // Components

  const barGen = sszvis
    .bar()
    .x(0)
    .y(sszvis.compose(yScale, yAcc))
    .width(sszvis.compose(widthScale, xAcc))
    .height(chartDimensions.barHeight)
    .centerTooltip(true)
    .fill((d) => (isSelected(d) ? cScaleDark(d) : cScale(d)));

  const xAxis = sszvis.axisX().scale(widthScale).orient("bottom").alignOuterLabels(true);

  const yAxis = sszvis.axisY
    .ordinal()
    .scale(yScale)
    .orient("right")
    .highlightTick((d) =>
      sszvis.contains(state.selected.map(sszvis.compose(String, yAcc)), String(d))
    );

  const buttonGroup = sszvis
    .buttonGroup()
    .values(state.years)
    .width(props.controlWidth)
    .current(state.selectedYear)
    .change(actions.selectYear);

  const tooltipHeader = sszvis
    .modularTextHTML()
    .bold(sszvis.compose((d) => (Number.isNaN(d) ? "k. A." : sszvis.formatNumber(d)), xAcc));

  const tooltip = sszvis
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

  const bars = chartLayer.selectGroup("bars").call(barGen);

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
  const interactionLayer = sszvis
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
  const barDatum = sszvis.find(
    (d) => jAcc(d) === state.selectedYear && yAcc(d) === category,
    state.data
  );
  return sszvis.util.testBarThreshold(xValue, barDatum, xAcc, 2000);
}

function isSelected(d) {
  return state.selected.includes(d);
}
