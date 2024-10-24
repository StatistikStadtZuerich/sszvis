/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabelFormat", {
    _: () => sszvis.formatText,
  })
  .prop("yTicks", {
    _: null,
  })
  .prop("yAxisLabel", {
    _: "",
  })
  .prop("textDirection", {
    _: "diagonal",
  });

function parseRow(d) {
  return {
    xValue: d["Region"],
    category: d["Kategorie"],
    yValue: sszvis.parseNumber(d["Wert"]),
  };
}

const xAcc = sszvis.prop("xValue");
const yAcc = sszvis.prop("yValue");
const cAcc = sszvis.prop("category");

// Application state
// -----------------------------------------------

const state = {
  data: [],
  years: [],
  categories: [],
  valueExtent: [0, 0],
  groups: [],
  groupedData: [],
  longestGroup: 0,
  selection: [],
};

// State transitions
// -----------------------------------------------

const actions = {
  prepareState(data) {
    state.data = data;
    state.regions = sszvis.set(state.data, xAcc);
    state.valueExtent = zeroBasedAxisDomain(d3.extent(state.data, yAcc));
    state.groups = sszvis.set(state.data, cAcc);
    state.groupedData = sszvis.cascade().arrayBy(xAcc).apply(state.data);
    state.longestGroup = d3.max(state.groupedData, sszvis.prop("length"));
    state.categories = sszvis.set(state.data, cAcc);

    render(state);
  },

  showTooltip(e, x) {
    state.selection = state.groupedData.filter((d) => sszvis.contains(d.map(xAcc), x));
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
      axisLabels: state.regions.map(props.xLabelFormat),
      legendLabels: state.categories,
      slant: props.textDirection,
    },
    config.id
  );

  const cScale = legendLayout.scale;
  const colorLegend = legendLayout.legend;

  const bounds = sszvis.bounds(
    {
      top: 25,
      bottom: legendLayout.bottomPadding,
    },
    config.id
  );

  const chartWidth = Math.min(800, bounds.innerWidth);

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(state.regions)
    .padding(0.26)
    .paddingOuter(0.8)
    .rangeRound([0, chartWidth]);

  const yScale = d3.scaleLinear().domain(state.valueExtent).range([bounds.innerHeight, 0]);

  const yPosScale = (v) => (isNaN(v) ? yScale(0) : yScale(Math.max(v, 0)));

  const hScale = (v) =>
    // the size of the bar is distance from the y-position of the value to the y-position of 0
    Math.abs(yScale(v) - yScale(0));

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.groupedData);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

  // Components

  const barLayout = sszvis
    .groupedBars()
    .groupScale(sszvis.compose(xScale, xAcc))
    .groupWidth(xScale.bandwidth())
    .groupSize(state.longestGroup)
    .y(sszvis.compose(yPosScale, yAcc))
    .height(sszvis.compose(hScale, yAcc))
    .fill(sszvis.compose(cScale, cAcc))
    .defined(sszvis.compose(sszvis.not(isNaN), yAcc));

  const xAxis = sszvis.axisX
    .ordinal()
    .scale(xScale)
    .orient("bottom")
    .slant(props.textDirection)
    .tickFormat(props.xLabelFormat)
    .highlightTick((d) =>
      sszvis.contains(state.selection.map(sszvis.compose(xAcc, sszvis.first)), d)
    );
  if (!props.textDirection) {
    xAxis.textWrap(labelWrapWidth(xScale.range()));
  }

  const yAxis = sszvis
    .axisY()
    .scale(yScale)
    .showZeroY(isTwoSidedDomain(state.valueExtent))
    .orient("right")
    .ticks(props.yTicks)
    .title(props.yAxisLabel);

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .header(sszvis.modularTextHTML().plain((d) => xAcc(sszvis.first(d))))
    .body((d) =>
      // generates a row from each data element
      d.map((item) => {
        const v = yAcc(item);
        return [cAcc(item), isNaN(v) ? "–" : v];
      })
    )
    .visible((d) => state.selection.includes(d));

  // Rendering

  chartLayer.attr(
    "transform",
    sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top)
  );

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer.selectGroup("yAxis").call(yAxis);

  const bars = chartLayer.selectGroup("bars").call(barLayout);

  bars.selectAll("[data-tooltip-anchor]").call(tooltip);

  chartLayer
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding)
    )
    .call(colorLegend);

  sszvis.viewport.on("resize", actions.resize);

  // Interaction
  const interactionLayer = sszvis
    .move()
    .xScale(xScale)
    .yScale(yScale)
    .on("move", actions.showTooltip)
    .on("end", actions.hideTooltip);

  chartLayer.selectGroup("interactionLayer").call(interactionLayer);
}

// Helper functions
// -----------------------------------------------

function isTwoSidedDomain(extent) {
  return d3.min(extent) !== 0;
}

function zeroBasedAxisDomain(extent) {
  let min = extent[0];
  let max = extent[1];
  if (min < max) {
    if (min > 0) min = 0;
    if (max < 0) max = 0;
    return [min, max];
  } else {
    const flipped = zeroBasedAxisDomain([max, min]);
    return [flipped[1], flipped[0]];
  }
}

function labelWrapWidth(range) {
  return (d3.max(range) - d3.min(range)) / range.length;
}
