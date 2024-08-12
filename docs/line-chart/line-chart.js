/* global d3, sszvis, config */
/* global parseRow, xLabelFormat, yLabelFormat, xValues, mkXAxis, closestDatum, mkXScale */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("rulerLabel", {
    _: () =>
      sszvis
        .modularTextSVG()
        .bold(sszvis.compose(yLabelFormat, yAcc))
        .plain((d) => (cAcc(d) == null ? "" : cAcc(d))),
  })
  .prop("xLabel", {
    _: "",
  })
  .prop("yLabel", {
    _: "",
  })
  .prop("ticks", {
    _: 5,
  });

const xAcc = sszvis.prop("xValue");
const yAcc = sszvis.prop("yValue");
const cAcc = sszvis.prop("category");

sszvis.app({
  fallback: {
    element: config.id,
    src: config.fallback,
  },

  // Init
  // -----------------------------------------------
  init: (state) =>
    d3.csv(config.data, parseRow).then((data) => {
      state.data = data;
      state.lineData = sszvis.cascade().arrayBy(cAcc, d3.ascending).apply(data);
      state.xValues = xValues(data, xAcc);
      state.categories = sszvis.set(data, cAcc);
      state.maxY = d3.max(data, yAcc);
      state.selection = [];
      return (dispatch) => dispatch("resetDate");
    }),

  // Actions
  // -----------------------------------------------
  actions: {
    resetDate(state) {
      // Find the most recent date in the data and set it as the selected date
      const mostRecentDate = d3.max(state.data, xAcc);
      return (dispatch) => {
        dispatch("changeDate", mostRecentDate);
      };
    },

    changeDate(state, inputDate) {
      // Find the date of the datum closest to the input date
      const closestDate = xAcc(closestDatum(state.data, xAcc, inputDate));
      // Find all data that have the same date as the closest datum
      const closestData = state.lineData.map((linePoints) =>
        // For each line pick the first datum that matches
        sszvis.find((d) => xAcc(d).toString() === closestDate.toString(), linePoints)
      );
      // Make sure that the selection has a value to display
      state.selection = closestData.filter(sszvis.compose(sszvis.not(Number.isNaN), yAcc));
    },
  },

  // Render
  // -----------------------------------------------
  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.xValues.map(xLabelFormat),
        legendLabels: state.categories,
      },
      config.id
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds(
      {
        top: typeof props.yLabel === "string" && props.yLabel.length > 0 ? 30 : 10,
        bottom: legendLayout.bottomPadding,
      },
      config.id
    );

    // Scales
    const xScale = mkXScale();

    xScale.domain(state.xValues).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain([0, state.maxY]).range([bounds.innerHeight, 0]);

    // Layers
    const highlightLayer = sszvis
      .annotationRuler()
      .top(0)
      .bottom(bounds.innerHeight)
      .x(sszvis.compose(xScale, xAcc))
      .y(sszvis.compose(yScale, yAcc))
      .label(props.rulerLabel)
      .flip((d) => xScale(xAcc(d)) >= bounds.innerWidth / 2)
      .color(sszvis.compose(cScale, cAcc));

    const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.lineData);

    // Components
    const line = sszvis
      .line()
      .x(sszvis.compose(xScale, xAcc))
      .y(sszvis.compose(yScale, yAcc))
      // Access the first data point of the line to decide on the stroke color
      .stroke(sszvis.compose(cScale, cAcc, sszvis.first));

    const xAxis = mkXAxis(props.ticks, state.selection, xScale, xAcc);

    xAxis
      .title(props.xLabel)
      .scale(xScale)
      .orient("bottom")
      .tickFormat(xLabelFormat)
      .highlightTick(isSelected)
      .alignOuterLabels(true);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .tickFormat(yLabelFormat)
      .contour(true)
      .title(props.yLabel)
      .dyTitle(-20);

    // Rendering
    chartLayer.selectGroup("line").call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    if (showLegend(state.categories)) {
      chartLayer
        .selectGroup("colorLegend")
        .attr(
          "transform",
          sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding)
        )
        .call(colorLegend);
    }

    chartLayer.selectGroup("highlight").datum(state.selection).call(highlightLayer);

    // Interaction
    const interactionLayer = sszvis
      .move()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.changeDate)
      .on("end", actions.resetDate);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions
// -----------------------------------------------

function showLegend(categories) {
  return categories != null && categories[0] != null && categories[0] !== "";
}

function isSelected(state) {
  return (d) => sszvis.contains(state.selection.map(xAcc).map(String), String(d));
}
