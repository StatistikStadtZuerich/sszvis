/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("xAxisLabel", {
    _: "NeubauAbs",
  })
  .prop("yAxisLabel", {
    _: "LeerZunRel",
  })
  .prop("rLabel", {
    _: "Radius",
  })
  .prop("xTicks", {
    _: null,
  })
  .prop("yTicks", {
    _: null,
  })
  .prop("legendTicks", {
    _: null,
  })
  .prop("legendPadding", {
    _: 60,
  });

// Shortcuts
// -----------------------------------------------
function parseRow(d) {
  return {
    xPosition: sszvis.parseNumber(d["NeubauAbs (x-Achse)"]),
    yPosition: sszvis.parseNumber(d["LeerZunRel (y-Achse) "]),
    radius: sszvis.parseNumber(d["Best13Radius (bubble)"]),
    label: d["QuName"],
  };
}

const xAcc = sszvis.prop("xPosition");
const yAcc = sszvis.prop("yPosition");
const rAcc = sszvis.prop("radius");
const cAcc = sszvis.prop("label");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  highlightData: [],
  xExtent: [0, 0],
  yExtent: [0, 0],
  rExtent: [0, 0],
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
    const radiusExtent = d3.extent(state.data, rAcc);
    state.rExtent = [Math.floor(radiusExtent[0]), Math.ceil(radiusExtent[1])];

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
  const bounds = sszvis.bounds({ top: 20, bottom: 110 }, config.id);

  // Scales

  const xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

  const xValue = sszvis.compose(xScale, xAcc);

  const yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

  const yValue = sszvis.compose(yScale, yAcc);

  const rScale = d3.scaleLinear().domain(state.rExtent).range([1, 20]);

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.highlightData);

  // Components

  const dots = sszvis
    .dot()
    .x(xValue)
    .y(yValue)
    .radius(sszvis.compose(rScale, rAcc))
    .fill(sszvis.scaleQual12())
    // use white outlines in scatterplots to assist in identifying distinct circles
    .stroke("#FFFFFF");

  const xAxis = sszvis
    .axisX()
    .scale(xScale)
    .orient("bottom")
    .contour(true)
    .ticks(props.xTicks)
    .tickFormat((d) => (d < 1 ? d.toPrecision(1) : d))
    .title(props.xAxisLabel);

  const yAxis = sszvis
    .axisY()
    .scale(yScale)
    .orient("right")
    .showZeroY(true)
    .contour(true)
    .ticks(props.yTicks)
    .title(props.yAxisLabel);

  const radiusLegend = sszvis
    .legendRadius()
    .scale(rScale)
    .tickValues(props.legendTicks)
    .tickFormat((d) => Math.round(d * 100) / 100);

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(cAcc)
    .body((d) => [
      [props.xAxisLabel, sszvis.formatNumber(xAcc(d))],
      [props.yAxisLabel, sszvis.formatNumber(yAcc(d))],
      [props.rLabel, sszvis.formatNumber(rAcc(d))],
    ])
    .visible((d) => sszvis.contains(state.highlightData, d))
    .orientation((d) => (xValue(d.datum) <= bounds.innerWidth / 2 ? "left" : "right"));

  // Rendering

  chartLayer.selectGroup("dots").call(dots);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  chartLayer
    .selectGroup("radiusLegend")
    .attr("transform", sszvis.translateString(1, bounds.innerHeight + props.legendPadding))
    .call(radiusLegend);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer
    .selectGroup("yAxis")
    .call(yAxis)
    .call(removeOverlappingYTickLabels(bounds.innerHeight));

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
