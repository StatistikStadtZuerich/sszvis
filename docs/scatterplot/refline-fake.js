/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("xFormat", {
    _: () => sszvis.formatFractionPercent,
  })
  .prop("yFormat", {
    _: () => sszvis.formatNumber,
  })
  .prop("xAxisLabel", {
    _: "Prozent",
  })
  .prop("yAxisLabel", {
    _: "Wert",
  })
  .prop("xTicks", {
    _: null,
  })
  .prop("yTicks", {
    _: 4,
  });

function parseRow(d) {
  return {
    xPosition: sszvis.parseNumber(d["Prozent"]),
    yPosition: sszvis.parseNumber(d["Wert"]),
    category: d["Stadt"],
  };
}

const xAcc = sszvis.prop("xPosition");
const yAcc = sszvis.prop("yPosition");
const cAcc = sszvis.prop("category");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  highlightData: [],
  xExtent: [0, 1], // 0% - > 100%
  yExtent: [],
  cExtent: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;

    // for the voronoi component to work, the data must first be filtered such that no two vertices
    // fall at exactly the same point.
    state.voronoiFiltered = sszvis.derivedSet(state.data, (d) => xAcc(d) + "__" + yAcc(d));

    state.xExtent = d3.extent(state.data, xAcc);
    state.yExtent = d3.extent(state.data, yAcc);
    state.cExtent = sszvis.set(state.data, cAcc);

    state.categories = sszvis.set(state.data, cAcc);

    render(state);
  },

  setHighlight(e, d) {
    state.highlightData = [d];
    render(state);
  },

  resetHighlight() {
    state.highlightData = [];
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
      axisLabels: state.cExtent.map(props.xFormat),
      legendLabels: state.categories,
    },
    config.id
  );

  const cScale = legendLayout.scale;
  const colorLegend = legendLayout.legend;

  const bounds = sszvis.bounds(
    {
      top: 20,
      bottom: legendLayout.bottomPadding,
    },
    config.id
  );

  // Scales

  const xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

  const xValue = sszvis.compose(xScale, xAcc);

  const yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

  const yValue = sszvis.compose(yScale, yAcc);

  // Layers
  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.highlightData);

  // Components

  const dots = sszvis
    .dot()
    .x(xValue)
    .y(yValue)
    .radius(4)
    .fill(sszvis.compose(cScale, cAcc))
    // use white outlines in scatterplots to assist in identifying distinct circles
    .stroke("#FFFFFF");

  const xAxis = sszvis
    .axisX()
    .scale(xScale)
    .ticks(props.xTicks)
    .orient("bottom")
    .alignOuterLabels(true)
    .tickFormat(props.xFormat)
    .title(props.xAxisLabel);

  const yAxis = sszvis
    .axisY()
    .scale(yScale)
    .ticks(props.yTicks)
    .orient("right")
    .contour(true)
    .showZeroY(true)
    .tickFormat(props.yFormat)
    .title(props.yAxisLabel);

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(cAcc)
    .body((d) => [
      [props.xAxisLabel, props.xFormat(xAcc(d))],
      [props.yAxisLabel, props.yFormat(yAcc(d))],
    ])
    .visible((d) => sszvis.contains(state.highlightData, d))
    .orientation((d) => (xValue(d.datum) <= bounds.innerWidth / 2 ? "left" : "right"));

  // Rendering

  chartLayer.selectGroup("dots").call(dots);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer
    .selectGroup("yAxis")
    .call(yAxis)
    .call(removeOverlappingYTickLabels(bounds.innerHeight));

  chartLayer
    .selectGroup("cScale")
    .attr(
      "transform",
      sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding)
    )
    .call(colorLegend);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  sszvis.viewport.on("resize", actions.resize);

  // Interaction
  const mouseOverlay = sszvis
    .voronoi()
    .x(xValue)
    .y(yValue)
    .bounds([0, 0, bounds.innerWidth, bounds.innerHeight])
    .on("over", actions.setHighlight)
    .on("out", actions.resetHighlight);

  chartLayer.selectGroup("voronoiMouse").datum(state.voronoiFiltered).call(mouseOverlay);
}

// Helper functions
// -----------------------------------------------
function removeOverlappingYTickLabels(maxBottom) {
  return function (g) {
    g.selectAll("text").each(function () {
      const bottom = this.getBoundingClientRect().bottom;
      if (bottom >= maxBottom) d3.select(this.parentNode).style("display", "none");
    });
  };
}
