/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("targetNumColumns", {
    palm: 1,
    _: 2,
  })
  .prop("bottomPadding", {
    _: null,
  })
  .prop("xLabel", {
    _: "Prozent",
  })
  .prop("xLabelFormat", {
    _: () => sszvis.formatText,
  })
  .prop("xSlant", {
    _: null,
  })
  .prop("ticks", {
    _: 4,
  });

function parseRow(d) {
  return {
    category: d["Branche"],
    yValue: d["Gebiet"],
    xValue: sszvis.parseNumber(d["BIP"]),
  };
}

const xAcc = sszvis.prop("xValue");
const yAcc = sszvis.prop("yValue");
const cAcc = sszvis.prop("category");
const dataAcc = sszvis.prop("data");

// Application state
// -----------------------------------------------

const state = {
  data: [],
  yValues: [],
  categories: [],
  stackedData: [],
  maxStacked: 0,
  selection: [],
};

// State transitions
// -----------------------------------------------

const actions = {
  prepareState(data) {
    state.data = data;
    state.yValues = sszvis.set(state.data, yAcc);
    state.categories = sszvis.set(state.data, cAcc);

    state.stackedData = sszvis.stackedBarHorizontalData(yAcc, cAcc, xAcc)(data);
    state.maxStacked = state.stackedData.maxValue;

    render(state);
  },

  showTooltip(datum) {
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
  const props = queryProps(sszvis.measureDimensions(config.id));

  const legendLayout = sszvis.colorLegendLayout(
    {
      axisLabels: props.xLabelFormat(state.maxStacked),
      legendLabels: state.categories,
      slant: props.xSlant,
    },
    config.id
  );

  const cScale = legendLayout.scale;
  const colorLegend = legendLayout.legend;

  //the height and the bottom padding need to be calculated
  const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.yValues.length);
  const paddingTop = 20;
  const bottomPadding =
    props.bottomPadding == null ? legendLayout.bottomPadding : props.bottomPadding;
  const bounds = sszvis.bounds(
    {
      height: paddingTop + chartDimensions.totalHeight + bottomPadding,
      top: paddingTop,
      bottom: bottomPadding,
    },
    config.id
  );
  const chartWidth = Math.min(bounds.innerWidth, 800);

  // Scales

  const xScale = d3.scaleLinear().domain([0, state.maxStacked]).range([0, chartWidth]);

  const yScale = d3
    .scaleBand()
    .domain(state.yValues)
    .padding(chartDimensions.padRatio)
    .paddingOuter(chartDimensions.outerRatio)
    .range([0, chartDimensions.totalHeight]);

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.stackedData);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

  // Components

  const horizontalBars = sszvis
    .stackedBarHorizontal()
    .xScale(xScale)
    .height(chartDimensions.barHeight)
    .yScale(yScale)
    .fill(sszvis.compose(cScale, cAcc, dataAcc));

  const xAxis = sszvis
    .axisX()
    .scale(xScale)
    .orient("bottom")
    .slant(props.xSlant)
    .tickFormat(props.xLabelFormat)
    .title(props.xLabel)
    .alignOuterLabels(true);

  if (props.ticks) {
    xAxis.ticks(props.ticks);
  }

  const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

  const tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(cAcc, dataAcc));

  const tooltipText = sszvis
    .modularTextHTML()
    .plain(sszvis.compose(sszvis.formatPercent, xAcc, dataAcc));

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .header(tooltipHeader)
    .body(tooltipText)
    .visible(isSelected);

  // Rendering

  chartLayer.attr(
    "transform",
    sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top)
  );

  const bars = chartLayer.selectGroup("barchart").call(horizontalBars);

  bars.selectAll("[data-tooltip-anchor]").call(tooltip);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, chartDimensions.totalHeight))
    .call(xAxis);

  chartLayer
    .selectGroup("yAxis")
    .attr("transform", sszvis.translateString(0, chartDimensions.axisOffset))
    .call(yAxis);

  chartLayer
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(0, chartDimensions.totalHeight + legendLayout.axisLabelPadding)
    )
    .call(colorLegend);

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
