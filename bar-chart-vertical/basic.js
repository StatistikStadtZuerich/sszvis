/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const MAX_WIDTH = 800;
const queryProps = sszvis
  .responsiveProps()
  .prop("barPadding", {
    palm: 0.4,
    _: 0.2,
  })
  .prop("bottomPadding", {
    palm: 140,
    _: 60,
  })
  .prop("leftPadding", {
    _: null,
  })
  .prop("slant", {
    palm: "vertical",
    _: "horizontal",
  })
  .prop("yLabelFormat", {
    _: () => sszvis.formatNumber,
  });

function parseRow(d) {
  return {
    category: d["Sektor"],
    yValue: sszvis.parseNumber(d["Anzahl"]),
  };
}
const xAcc = sszvis.prop("category");
const yAcc = sszvis.prop("yValue");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  categories: [],
  selection: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.categories = state.data.map(xAcc);
    render();
  },

  showTooltip(e, category) {
    state.selection = state.data.filter((d) => xAcc(d) === category);
    render();
  },

  hideTooltip() {
    state.selection = [];
    render();
  },

  resize() {
    render();
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render() {
  const yMax = d3.max(state.data, yAcc);

  const props = queryProps(sszvis.measureDimensions(config.id));
  const bounds = sszvis.bounds(
    {
      top: 3,
      bottom: props.bottomPadding,
      left:
        props.leftPadding == null
          ? sszvis.measureAxisLabel(props.yLabelFormat(yMax))
          : props.leftPadding,
    },
    config.id
  );
  const chartDimensions = sszvis.dimensionsVerticalBarChart(
    Math.min(MAX_WIDTH, bounds.innerWidth),
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

  const cScale = sszvis.scaleQual12();
  const cScaleDark = cScale.darker();

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

  // Components

  const barGen = sszvis
    .bar()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(nanFallback(yPosScale.range()[0]), yPosScale, yAcc))
    // Because we use sszvis.move in this example, we need to make
    // sure that bars have the exact same size as the scale's rangeBand. This
    // will result in slightly narrower bars than the default.
    .width(xScale.bandwidth())
    .height(sszvis.compose(heightScale, yAcc))
    .centerTooltip(true)
    .fill((d) => (isSelected(d) ? cScaleDark(d) : cScale(d)));

  const xAxis = sszvis.axisX.ordinal().scale(xScale).orient("bottom").slant(props.slant);

  if (props.slant === "horizontal") {
    xAxis.textWrap(xScale.step());
  }

  const yAxis = sszvis.axisY().scale(yPosScale).orient("right");

  const tooltipHeader = sszvis
    .modularTextHTML()
    .bold((d) => {
      const yValue = yAcc(d);
      return Number.isNaN(yValue) ? "keine" : sszvis.formatNumber(yValue);
    })
    .plain("Beschäftigte");

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .header(tooltipHeader)
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

  // Use the move behavior to provide tooltips in the absence of a bar, i.e.
  // when we have missing data.
  const interactionLayer = sszvis
    .move()
    .xScale(xScale)
    .yScale(yPosScale)
    .on("move", actions.showTooltip)
    .on("end", actions.hideTooltip);

  bars.selectGroup("interaction").call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
function isSelected(d) {
  return sszvis.contains(state.selection, d);
}

function nanFallback(fallbackyValue) {
  return (d) => (d == undefined || Number.isNaN(d) ? fallbackyValue : d);
}
