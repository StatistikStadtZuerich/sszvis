/* global d3, sszvis */

// Configuration
// -----------------------------------------------

const HIGHLIGHTED_DATES = [new Date(2013, 10, 10)];

function parseRow(d) {
  return {
    date: sszvis.parseDate(d["Datum"]),
    value: sszvis.parseNumber(d["Regen"]),
  };
}

const xAcc = sszvis.prop("date");
const yAcc = sszvis.prop("value");

sszvis.app({
  init: (state) =>
    d3.csv("data/SL_daily.csv", parseRow).then((data) => {
      state.data = data;
      state.dates = d3.extent(state.data, xAcc);
      state.lineData = [state.data];
      state.annotatedData = state.data.filter((d) =>
        sszvis.contains(HIGHLIGHTED_DATES.map(String), String(xAcc(d)))
      );
    }),
  render(state) {
    const bounds = sszvis.bounds({ top: 30, bottom: 45 }, "#sszvis-chart");

    // Scales

    const xScale = d3.scaleTime().domain(state.dates).range([0, bounds.innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(state.data, yAcc)])
      .range([bounds.innerHeight, 0]);

    // Layers
    const chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.lineData);

    // Components

    const line = sszvis
      .line()
      .x(sszvis.compose(xScale, xAcc))
      .y(sszvis.compose(yScale, yAcc))
      .stroke(sszvis.scaleQual12());

    const xAxis = sszvis.axisX.time().scale(xScale).orient("bottom").title("Datum");

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .contour(true)
      .title("Regen")
      .dyTitle(-20);

    const annotation = sszvis
      .annotationCircle()
      .x(sszvis.compose(xScale, xAcc))
      .y(sszvis.compose(yScale, yAcc))
      .r(20)
      .dy(-30)
      .caption((d) => "Referenzwert A (" + yAcc(d) + ")");

    // Rendering

    chartLayer.selectGroup("annotation").datum(state.annotatedData).call(annotation);

    chartLayer.selectGroup("line").call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);
  },
});
