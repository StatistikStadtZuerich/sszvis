/* global d3, sszvis, config */

/* Configuration
  ----------------------------------------------- */
var SLIDER_CONTROL_HEIGHT = 60;
var queryProps = sszvis.responsiveProps().prop("xLabelFormat", {
  _: function () {
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
var xAcc = sszvis.prop("xValue");
var yAcc = sszvis.prop("yValue");
var cAcc = sszvis.prop("city");
var qAcc = sszvis.prop("quarter");

/* Application state
  ----------------------------------------------- */
var state = {
  data: [],
  xExtent: [0, 0],
  yExtent: [0, 0],
  tExtent: [0, 0],
  cities: [],
  quarters: [],
  activeQuarter: new Date(),
};

/* State transitions
  ----------------------------------------------- */
var actions = {
  prepareState: function (data) {
    state.data = data;
    state.xExtent = d3.extent(state.data, xAcc);
    state.yMax = d3.max(state.data, yAcc);
    state.tExtent = d3.extent(state.data, qAcc);
    state.cities = sszvis.set(state.data, cAcc);
    state.quarters = sszvis.set(state.data, qAcc);

    actions.setQuarter(d3.max(state.quarters));
  },

  setQuarter: function (inputQ) {
    state.activeQuarter = closestDatum(state.quarters, sszvis.identity, inputQ);

    render(state);
  },

  resize: function () {
    render(state);
  },
};

/* Data initialization
  ----------------------------------------------- */
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

/* Render
  ----------------------------------------------- */
function render(state) {
  var props = queryProps(sszvis.measureDimensions(config.id));

  var legendLayout = sszvis.colorLegendLayout(
    {
      axisLabels: state.xExtent.map(props.xLabelFormat),
      legendLabels: state.cities,
    },
    config.id
  );

  var cScale = legendLayout.scale;
  var colorLegend = legendLayout.legend;

  var bounds = sszvis.bounds(
    { top: 20, bottom: SLIDER_CONTROL_HEIGHT + legendLayout.bottomPadding },
    config.id
  );

  // Scales

  var xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

  var yScale = d3.scaleLinear().domain([0, state.yMax]).range([bounds.innerHeight, 0]);

  var tScale = d3.scaleTime().domain(state.tExtent).range([0, bounds.innerWidth]);

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(
    state.data.filter(function (d) {
      return sszvis.stringEqual(qAcc(d), state.activeQuarter);
    })
  );

  // Components

  var dots = sszvis
    .dot()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .radius(4)
    .fill(sszvis.compose(cScale, cAcc))
    // use white outlines in scatterplots to assist in identifying distinct circles
    .stroke("#FFFFFF");

  var slider = sszvis
    .slider()
    .scale(tScale)
    .value(state.activeQuarter)
    .minorTicks(state.quarters)
    // Be aware that this uses fn.derivedSet instead of fn.set
    .majorTicks(
      sszvis.derivedSet(state.quarters, function (d) {
        return d.getYear();
      })
    )
    .tickLabels(sszvis.formatAxisTimeFormat)
    .label(sszvis.formatMonth)
    .onchange(actions.setQuarter);

  var xAxis = sszvis.axisX().scale(xScale).tickFormat(props.xLabelFormat).orient("bottom");

  var yAxis = sszvis.axisY().scale(yScale).orient("right").contour(true);

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

/* Helper functions
  ----------------------------------------------- */
function closestDatum(data, accessor, datum) {
  var i = d3.bisector(accessor).left(data, datum, 1);
  var d0 = data[i - 1];
  var d1 = data[i] || d0;
  return datum - accessor(d0) > accessor(d1) - datum ? d1 : d0;
}
