/* global d3, sszvis, config */
/* global parseRow, xLabelFormat, yLabelFormat, xValues, mkXAxis, closestDatum, mkXScale */

// Configuration
// -----------------------------------------------

var queryProps = sszvis
  .responsiveProps()
  .prop("rulerLabel", {
    _: function () {
      return sszvis
        .modularTextSVG()
        .bold(sszvis.compose(yLabelFormat, yAcc))
        .plain(function (d) {
          return cAcc(d) != null ? cAcc(d) : "";
        });
    },
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

var xAcc = sszvis.prop("xValue");
var yAcc = sszvis.prop("yValue");
var cAcc = sszvis.prop("category");

sszvis.app({
  fallback: {
    element: config.id,
    src: config.fallback,
  },

  // Init
  // -----------------------------------------------
  init: function () {
    return d3.csv(config.data, parseRow).then(function (data) {
      return {
        state: {
          data: data,
          lineData: sszvis.cascade().arrayBy(cAcc, d3.ascending).apply(data),
          xValues: xValues(data, xAcc),
          categories: sszvis.set(data, cAcc),
          maxY: d3.max(data, yAcc),
          selection: [],
        },
        effect: "resetDate",
      };
    });
  },

  // Actions
  // -----------------------------------------------
  actions: {
    resetDate: function (state) {
      // Find the most recent date in the data and set it as the selected date
      var mostRecentDate = d3.max(state.data, xAcc);
      return {
        state,
        effect: (dispatch) => {
          dispatch("changeDate", mostRecentDate);
        },
      };
    },

    changeDate: function (state, inputDate) {
      // Find the date of the datum closest to the input date
      var closestDate = xAcc(closestDatum(state.data, xAcc, inputDate));
      // Find all data that have the same date as the closest datum
      var closestData = state.lineData.map(function (linePoints) {
        // For each line pick the first datum that matches
        return sszvis.find(function (d) {
          return xAcc(d).toString() === closestDate.toString();
        }, linePoints);
      });
      // Make sure that the selection has a value to display
      state.selection = closestData.filter(sszvis.compose(sszvis.not(isNaN), yAcc));

      return { state };
    },
  },

  // Render
  // -----------------------------------------------
  render: function (state, actions) {
    var props = queryProps(sszvis.measureDimensions(config.id));

    var legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.xValues.map(xLabelFormat),
        legendLabels: state.categories,
      },
      config.id
    );

    var cScale = legendLayout.scale;
    var colorLegend = legendLayout.legend;

    var bounds = sszvis.bounds(
      {
        top: typeof props.yLabel === "string" && props.yLabel.length > 0 ? 30 : 10,
        bottom: legendLayout.bottomPadding,
      },
      config.id
    );

    // Scales

    var xScale = mkXScale();

    xScale.domain(state.xValues).range([0, bounds.innerWidth]);

    var yScale = d3.scaleLinear().domain([0, state.maxY]).range([bounds.innerHeight, 0]);

    // Layers

    var highlightLayer = sszvis
      .annotationRuler()
      .top(0)
      .bottom(bounds.innerHeight)
      .x(sszvis.compose(xScale, xAcc))
      .y(sszvis.compose(yScale, yAcc))
      .label(props.rulerLabel)
      .flip(function (d) {
        return xScale(xAcc(d)) >= bounds.innerWidth / 2;
      })
      .color(sszvis.compose(cScale, cAcc));

    var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.lineData);

    // Components

    var line = sszvis
      .line()
      .x(sszvis.compose(xScale, xAcc))
      .y(sszvis.compose(yScale, yAcc))
      // Access the first data point of the line to decide on the stroke color
      .stroke(sszvis.compose(cScale, cAcc, sszvis.first));

    var xAxis = mkXAxis(props.ticks, state.selection, xScale, xAcc);

    xAxis
      .title(props.xLabel)
      .scale(xScale)
      .orient("bottom")
      .tickFormat(xLabelFormat)
      .highlightTick(isSelected)
      .alignOuterLabels(true);

    var yAxis = sszvis
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

    var interactionLayer = sszvis
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
  return function (d) {
    return sszvis.contains(state.selection.map(xAcc).map(String), String(d));
  };
}
