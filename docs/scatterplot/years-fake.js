/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------
const SLIDER_CONTROL_HEIGHT = 60;
const queryProps = sszvis.responsiveProps().prop("xLabelFormat", {
  _() {
    return sszvis.formatNumber;
  },
});

function parseRow(d) {
  return {
    xValue: sszvis.parseNumber(d["XValue"]),
    yValue: sszvis.parseNumber(d["YValue"]),
    city: d["City"],
    location: d["Location"],
    quarter: sszvis.parseDate(d["Quarter"]),
  };
}
const xAcc = sszvis.prop("xValue");
const yAcc = sszvis.prop("yValue");
const cAcc = sszvis.prop("city");
const qAcc = sszvis.prop("quarter");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  xExtent: [0, 0],
  yExtent: [0, 0],
  tExtent: [0, 0],
  cities: [],
  quarters: [],
  activeQuarter: new Date(),
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.xExtent = d3.extent(state.data, xAcc);
    state.yMax = d3.max(state.data, yAcc);
    state.tExtent = d3.extent(state.data, qAcc);
    state.cities = sszvis.set(state.data, cAcc);
    state.quarters = sszvis.set(state.data, qAcc);

    actions.setQuarter(null, d3.max(state.quarters));
  },

  setQuarter(e, inputQ) {
    state.activeQuarter = closestDatum(state.quarters, sszvis.identity, inputQ);

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
      axisLabels: state.xExtent.map(props.xLabelFormat),
      legendLabels: state.cities,
    },
    config.id
  );

  const cScale = legendLayout.scale;
  const colorLegend = legendLayout.legend;

  const bounds = sszvis.bounds(
    { top: 20, bottom: SLIDER_CONTROL_HEIGHT + legendLayout.bottomPadding },
    config.id
  );

  // Scales

  const xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

  const yScale = d3.scaleLinear().domain([0, state.yMax]).range([bounds.innerHeight, 0]);

  const tScale = d3.scaleTime().domain(state.tExtent).range([0, bounds.innerWidth]);

  // Layers

  const chartLayer = sszvis
    .createSvgLayer(config.id, bounds)
    .datum(state.data.filter((d) => sszvis.stringEqual(qAcc(d), state.activeQuarter)));

  // Components

  const dots = sszvis
    .dot()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .radius(4)
    .fill(sszvis.compose(cScale, cAcc))
    // use white outlines in scatterplots to assist in identifying distinct circles
    .stroke("#FFFFFF");

  const slider = sszvis
    .slider()
    .scale(tScale)
    .value(state.activeQuarter)
    .minorTicks(state.quarters)
    // Be aware that this uses fn.derivedSet instead of fn.set
    .majorTicks(sszvis.derivedSet(state.quarters, (d) => d.getYear()))
    .tickLabels(sszvis.formatAxisTimeFormat)
    .label(sszvis.formatMonth)
    .onchange(actions.setQuarter);

  const xAxis = sszvis.axisX().scale(xScale).tickFormat(props.xLabelFormat).orient("bottom");

  const yAxis = sszvis.axisY().scale(yScale).orient("right").contour(true);

  // Rendering

  chartLayer.selectGroup("dots").call(dots);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer.selectGroup("yAxis").call(yAxis);

  chartLayer
    .selectGroup("slider")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight + 46))
    .call(slider);

  chartLayer
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(
        0,
        bounds.innerHeight + SLIDER_CONTROL_HEIGHT + legendLayout.axisLabelPadding
      )
    )
    .call(colorLegend);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
function closestDatum(data, accessor, datum) {
  const i = d3.bisector(accessor).left(data, datum, 1);
  const d0 = data[i - 1];
  const d1 = data[i] || d0;
  return datum - accessor(d0) > accessor(d1) - datum ? d1 : d0;
}
