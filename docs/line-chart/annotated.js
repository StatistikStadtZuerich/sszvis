/* global d3, sszvis */

/* Configuration
  ----------------------------------------------- */

var HIGHLIGHTED_DATES = [new Date(2013, 10, 10)];

function parseRow(d) {
  return {
    date: sszvis.parseDate(d["Datum"]),
    value: sszvis.parseNumber(d["Regen"]),
  };
}

var xAcc = sszvis.prop("date");
var yAcc = sszvis.prop("value");

/* Application state
  ----------------------------------------------- */
var state = {
  data: [],
  dates: [0, 0],
  lineData: [],
  annotatedData: [],
};

/* State transitions
  ----------------------------------------------- */
var actions = {
  prepareState: function (data) {
    state.data = data;
    state.dates = d3.extent(state.data, xAcc);
    state.lineData = [state.data];
    state.annotatedData = state.data.filter(function (d) {
      return sszvis.contains(HIGHLIGHTED_DATES.map(String), String(xAcc(d)));
    });

    render(state);
  },

  resize: function () {
    render(state);
  },
};

/* Data initialization
  ----------------------------------------------- */
d3.csv("data/SL_daily.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);

/* Render
  ----------------------------------------------- */
function render(state) {
  var bounds = sszvis.bounds({ top: 30, bottom: 45 }, "#sszvis-chart");

  // Scales

  var xScale = d3.scaleTime().domain(state.dates).range([0, bounds.innerWidth]);

  var yScale = d3
    .scaleLinear()
    .domain([0, d3.max(state.data, yAcc)])
    .range([bounds.innerHeight, 0]);

  // Layers
  var chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.lineData);

  // Components

  var line = sszvis
    .line()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .stroke(sszvis.scaleQual12());

  var xAxis = sszvis.axisX.time().scale(xScale).orient("bottom").title("Datum");

  var yAxis = sszvis
    .axisY()
    .scale(yScale)
    .orient("right")
    .contour(true)
    .title("Regen")
    .dyTitle(-20);

  var annotation = sszvis
    .annotationCircle()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .r(20)
    .dy(-30)
    .caption(function (d) {
      return "Referenzwert A (" + yAcc(d) + ")";
    });

  // Rendering

  chartLayer.selectGroup("annotation").datum(state.annotatedData).call(annotation);

  chartLayer.selectGroup("line").call(line);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer.selectGroup("yAxis").call(yAxis);

  sszvis.viewport.on("resize", actions.resize);
}
