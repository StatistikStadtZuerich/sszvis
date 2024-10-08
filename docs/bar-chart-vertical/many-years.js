/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("barPadding", {
    palm: 0.2,
    _: 0.1,
  })
  .prop("leftPadding", {
    _: null,
  })
  .prop("yLabelFormat", {
    _: () => sszvis.formatNumber,
  });

function parseRow(d) {
  return {
    year: sszvis.parseNumber(d["Jahr"]),
    value: sszvis.parseNumber(d["Hotelübernachtungen"]),
  };
}

const xAcc = sszvis.prop("year");
const yAcc = sszvis.prop("value");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  categories: [],
  yearRange: [],
  selection: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.categories = sszvis.set(state.data, xAcc);
    state.yearRange = d3.extent(state.data, xAcc);
    render(state);
  },

  changeDate(e, selectedDate) {
    const selectedYear = Math.round(selectedDate);
    state.selection = state.data.filter((v) => xAcc(v) === selectedYear);
    render(state);
  },

  resetDate() {
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
  const props = queryProps(sszvis.measureDimensions(config.id));
  const yMax = d3.max(state.data, yAcc);
  const bounds = sszvis.bounds(
    {
      top: 3,
      bottom: 25,
      left:
        props.leftPadding == null
          ? sszvis.measureAxisLabel(props.yLabelFormat(yMax)) + 10
          : props.leftPadding,
    },
    config.id
  );

  const chartDimensions = sszvis.dimensionsVerticalBarChart(
    bounds.innerWidth,
    state.categories.length
  );

  // Scales

  const xScale = d3
    .scaleBand()
    .domain(state.categories)
    .padding(chartDimensions.padRatio)
    .paddingOuter(props.barPadding)
    .range([0, chartDimensions.totalWidth]);

  const heightScale = d3.scaleLinear().domain([0, yMax]).range([0, bounds.innerHeight]);

  const yPosScale = heightScale.copy().range([...heightScale.range()].reverse());

  const xValue = sszvis.compose(xScale, xAcc);
  // rounding the y-values and the height prevents the bars from jumping around
  const yValue = sszvis.compose(Math.round, yPosScale, yAcc);
  const hValue = sszvis.compose(Math.round, heightScale, yAcc);

  const cScale = sszvis.scaleQual12();
  const cScaleDark = cScale.darker();

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

  // Components

  const barGen = sszvis
    .bar()
    .x(xValue)
    .y(yValue)
    .width(xScale.bandwidth())
    .height(hValue)
    .fill((d) => (isSelected(d) ? cScaleDark(d) : cScale(d)));

  const xAxis = sszvis.axisX
    .ordinal()
    .scale(xScale)
    .orient("bottom")
    .alignOuterLabels(true)
    .ticks(5);

  const yAxis = sszvis.axisY().scale(yPosScale).orient("right");

  const tooltipTitle = sszvis.modularTextHTML().bold(yAcc).plain("Hotelübernachtungen");

  const tooltip = sszvis
    .tooltip()
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .renderInto(tooltipLayer)
    .header(tooltipTitle)
    .body((d) => "Im Jahr " + xAcc(d))
    .visible(isSelected);

  // Rendering

  chartLayer.attr(
    "transform",
    sszvis.translateString(
      bounds.innerWidth / 2 - chartDimensions.totalWidth / 2,
      bounds.padding.top
    )
  );

  const bars = chartLayer
    .selectGroup("bars")
    .attr("transform", sszvis.translateString(bounds.padding.left, 0))
    .call(barGen);

  bars.selectAll("[data-tooltip-anchor]").call(tooltip);

  bars
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer.selectGroup("yAxis").call(yAxis);

  // Interaction

  const interactionLayer = sszvis
    .move()
    .xScale(xScale)
    .yScale(yPosScale)
    .on("move", actions.changeDate)
    .on("end", actions.resetDate);

  bars.selectGroup("interaction").call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
function isSelected(d) {
  return sszvis.contains(state.selection, d);
}
