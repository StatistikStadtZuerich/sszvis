/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
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

const xAcc = sszvis.prop("xValue");
const cAcc = sszvis.prop("category");

// Application state
// -----------------------------------------------

const state = {
  data: [],
  categories: [],
  selected: [],
};

// State transitions
// -----------------------------------------------

const actions = {
  prepareState(data) {
    state.data = data;
    state.categories = sszvis.set(state.data, cAcc);
    render(state);
  },

  showTooltip(e, category) {
    state.selected = state.data.filter((d) => cAcc(d) === category);
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
  const props = queryProps(sszvis.measureDimensions(config.id));
  const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
  const bounds = sszvis.bounds(
    {
      height: 30 + chartDimensions.totalHeight + 40,
      top: 30,
      bottom: 40,
    },
    config.id
  );
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

  // Layers
  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selected);

  // Components
  const barGen = sszvis
    .bar()
    .x(0)
    .y(sszvis.compose(yScale, cAcc))
    .width(sszvis.compose(widthScale, xAcc))
    .height(chartDimensions.barHeight)
    .centerTooltip(true)
    .fill(sszvis.scaleQual12());

  const xAxis = sszvis
    .axisX()
    .scale(widthScale)
    .orient("bottom")
    .alignOuterLabels(true)
    .title(props.yLabel);

  if (props.ticks) {
    xAxis.ticks(props.ticks);
  }

  const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

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
  const barDatum = sszvis.find((d) => cAcc(d) === category, state.data);
  return sszvis.util.testBarThreshold(xValue, barDatum, xAcc, 1000);
}

function isSelected(d) {
  return state.selected.includes(d);
}
