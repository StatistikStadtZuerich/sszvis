/* global d3, sszvis */

// Configuration
// -----------------------------------------------

const queryProps = sszvis.responsiveProps().prop("yAxis2Label", {
  palm: "(schweizweit)",
  _: "Anzahl Arbeitslose (schweizweit)",
});

function parseRow(d) {
  return {
    date: sszvis.parseDate(d["Jahr"]),
    region: d["Region"],
    value: sszvis.parseNumber(d["Schweiz"]),
  };
}

const xAcc = sszvis.prop("date");
const yAcc = sszvis.prop("value");
const cAcc = sszvis.prop("region");

// a few helpers to distinguish between data that belongs on axis1 (left) and axis2 (right)
const axis2 = ["Schweiz"]; // the values for "Region" that go in axis2
const valueIsOnAxis2 = (d) => sszvis.contains(axis2, d);
const datumIsOnAxis2 = sszvis.compose(valueIsOnAxis2, cAcc);

sszvis.app({
  init: (state) =>
    d3.csv("data/S_2yAxis.csv", parseRow).then((data) => {
      state.data = data;
      state.dates = d3.extent(state.data, xAcc);
      state.lineData = sszvis.cascade().arrayBy(cAcc, d3.ascending).apply(state.data);

      // Compute two different maximum y values - one for each axis.
      // Multiply axis1maxY by a small number to ensure that the data for
      // category 1 doesn't overlap with category 2 data
      state.axis1maxY = d3.max(state.data.filter(sszvis.not(datumIsOnAxis2)), yAcc) * 1.2;
      state.axis2maxY = d3.max(state.data.filter(datumIsOnAxis2), yAcc);

      // Two different sets of categories for two color scales
      state.categories1 = sszvis.set(state.data.filter(sszvis.not(datumIsOnAxis2)), cAcc);
      state.categories2 = sszvis.set(state.data.filter(datumIsOnAxis2), cAcc);

      state.selection = [];
    }),
  actions: {
    changeDate(state, e, inputDate) {
      const closestDate = xAcc(closestDatum(state.data, xAcc, inputDate));
      const closestData = state.lineData.map((linePoints) =>
        sszvis.find((d) => sszvis.stringEqual(xAcc(d), closestDate), linePoints)
      );
      state.selection = closestData.filter(sszvis.compose(sszvis.not(isNaN), yAcc));
    },

    resetDate(state) {
      state.selection = [];
    },
  },
  render(state, actions) {
    const bounds = sszvis.bounds({ top: 30, bottom: 130 }, "#sszvis-chart");
    const props = queryProps(bounds);

    // Scales

    const xScale = d3.scaleTime().domain(state.dates).range([0, bounds.innerWidth]);

    const yScale1 = d3.scaleLinear().domain([0, state.axis1maxY]).range([bounds.innerHeight, 0]);

    const yScale2 = d3.scaleLinear().domain([0, state.axis2maxY]).range([bounds.innerHeight, 0]);

    const cScale1 = sszvis.scaleQual6a();
    const cScale2 = sszvis.scaleQual6b();

    // Layers

    const chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.lineData);

    // Components

    const line = sszvis
      .line()
      .x(sszvis.compose(xScale, xAcc))
      .y((d) => (datumIsOnAxis2(d) ? yScale2(yAcc(d)) : yScale1(yAcc(d))))
      // Access the first data point of the line to decide on the stroke color
      .stroke((lineData) => {
        const d = sszvis.first(lineData);
        return datumIsOnAxis2(d) ? cScale2(cAcc(d)) : cScale1(cAcc(d));
      });

    const rulerLabel = sszvis
      .modularTextSVG()
      .bold(sszvis.compose(sszvis.formatNumber, yAcc))
      .plain(cAcc);

    const ruler = sszvis
      .annotationRuler()
      .top(0)
      .bottom(bounds.innerHeight)
      .label(rulerLabel)
      .x(sszvis.compose(xScale, xAcc))
      .y((d) => (datumIsOnAxis2(d) ? yScale2(yAcc(d)) : yScale1(yAcc(d))))
      .flip((d) => xScale(xAcc(d)) >= bounds.innerWidth / 2)
      .color((d) => (datumIsOnAxis2(d) ? cScale2(cAcc(d)) : cScale1(cAcc(d))));

    const xTickValues = [...xScale.ticks(5), ...state.selection.map(xAcc)];

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      .tickValues(xTickValues)
      .alignOuterLabels(true)
      .highlightTick(isSelected(state))
      .title("Quartal")
      .titleCenter(true)
      .titleAnchor("middle");

    const yAxis1 = sszvis
      .axisY()
      .scale(yScale1)
      .orient("right")
      .contour(true)
      .title("Anzahl Arbeitslose (regional)")
      .dyTitle(-20);

    const yAxis2 = sszvis
      .axisY()
      .scale(yScale2)
      .orient("left")
      .contour(true)
      .title(props.yAxis2Label)
      .dyTitle(-20);

    const cLegend1 = sszvis.legendColorOrdinal().scale(cScale1).orientation("vertical");

    const cLegend2 = sszvis
      .legendColorOrdinal()
      .scale(cScale2)
      .orientation("vertical")
      .rightAlign(true);

    // Rendering

    chartLayer.selectGroup("line").call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis1").call(yAxis1);

    chartLayer
      .selectGroup("yAxis2")
      .attr("transform", sszvis.translateString(bounds.innerWidth, 0))
      .call(yAxis2);

    chartLayer
      .selectGroup("cScale1")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight + 60))
      .call(cLegend1);

    chartLayer
      .selectGroup("cScale2")
      .attr("transform", sszvis.translateString(bounds.innerWidth, bounds.innerHeight + 60))
      .call(cLegend2);

    chartLayer.selectGroup("rulerLayer").datum(state.selection).call(ruler);

    // Interaction

    const interactionLayer = sszvis
      .move()
      .xScale(xScale)
      .yScale(yScale1) // In this example, which scale you use for the y-dimension of the move component doesn't matter
      .on("move", actions.changeDate)
      .on("end", actions.resetDate);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions
// -----------------------------------------------

function closestDatum(data, accessor, datum) {
  const i = d3.bisector(accessor).left(data, datum, 1);
  const d0 = data[i - 1];
  const d1 = data[i] || d0;
  return datum - accessor(d0) > accessor(d1) - datum ? d1 : d0;
}

function isSelected(state) {
  return (d) => sszvis.contains(state.selection.map(xAcc).map(String), String(d));
}
