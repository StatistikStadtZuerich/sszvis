module.exports = function (d3, sszvis, config) {
  /* Configuration
  ----------------------------------------------- */
  function yLabelFormat(d) {
    return d === 0
      ? null
      : sszvis.foldPattern(config.scaleType, {
          time: function () {
            return sszvis.formatNumber(d);
          },
          ordinal: function () {
            return sszvis.formatFractionPercent(d);
          },
        });
  }

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
    .prop("xLabelFormat", {
      _: function () {
        return function (d) {
          return d === 0
            ? null
            : sszvis.foldPattern(config.scaleType, {
                time: function () {
                  return sszvis.formatYear(d);
                },
                ordinal: function () {
                  return sszvis.formatText(d);
                },
              });
        };
      },
    })
    .prop("yLabelFormat", {
      _: function () {
        return yLabelFormat;
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

  function parseRow(d) {
    return sszvis.foldPattern(config.scaleType, {
      time: function () {
        return {
          xValue: sszvis.parseDate(d["Datum"]),
          yValue: sszvis.parseNumber(d["Anzahl"]),
          category: d["Kategorie"],
        };
      },
      ordinal: function () {
        return {
          xValue: d["Jahr"],
          yValue: sszvis.parseNumber(d["Wert"]),
          category: null,
        };
      },
    });
  }

  var xAcc = sszvis.prop("xValue");
  var yAcc = sszvis.prop("yValue");
  var cAcc = sszvis.prop("category");

  /* Application State
  ----------------------------------------------- */

  var state = {
    data: [],
    lineData: [],
    xValues: [],
    categories: [],
    selection: [],
    maxY: 0,
  };

  /* State transitions
  ----------------------------------------------- */

  var actions = {
    prepareState: function (data) {
      state.data = data;
      state.xValues = sszvis.foldPattern(config.scaleType, {
        time: function () {
          return d3.extent(state.data, xAcc);
        },
        ordinal: function () {
          return sszvis.set(state.data, xAcc);
        },
      });
      state.categories = sszvis.set(state.data, cAcc);
      state.maxY = d3.max(state.data, yAcc);
      state.lineData = sszvis.cascade().arrayBy(cAcc, d3.ascending).apply(state.data);

      actions.resetDate();
    },

    changeDate: function (inputDate) {
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

      render(state);
    },

    resetDate: function () {
      // Find the most recent date in the data and set it as the selected date
      var mostRecentDate = d3.max(state.data, xAcc);
      actions.changeDate(mostRecentDate);
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
        axisLabels: state.xValues.map(props.xLabelFormat),
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

    var xScale = sszvis.foldPattern(config.scaleType, {
      time: function () {
        return d3.scaleTime();
      },
      ordinal: function () {
        return d3.scalePoint().padding(0);
      },
    });

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

    var xAxis = sszvis.foldPattern(config.scaleType, {
      time: function () {
        // Add the highlighted data as additional ticks to the xScale
        var xTickValues = props.ticks ? xScale.ticks(props.ticks) : xScale.ticks();
        xTickValues = xTickValues.concat(state.selection.map(xAcc));
        xTickValues = xTickValues.filter(function (v, i) {
          return xTickValues.map(String).indexOf(String(v)) === i;
        });
        return sszvis.axisX.time().tickValues(xTickValues);
      },
      ordinal: function () {
        return sszvis.axisX.ordinal();
      },
    });

    xAxis
      .title(props.xLabel)
      .scale(xScale)
      .orient("bottom")
      .tickFormat(props.xLabelFormat)
      .highlightTick(isSelected)
      .alignOuterLabels(true);

    var yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .tickFormat(props.yLabelFormat)
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

    sszvis.viewport.on("resize", actions.resize);
  }

  /* Helper functions
  ----------------------------------------------- */

  function showLegend(categories) {
    return categories != null && categories[0] != null && categories[0] !== "";
  }

  function closestDatum(data, accessor, datum) {
    return sszvis.foldPattern(config.scaleType, {
      time: function () {
        var i = d3.bisector(accessor).left(data, datum, 1);
        var d0 = data[i - 1];
        var d1 = data[i] || d0;
        return datum - accessor(d0) > accessor(d1) - datum ? d1 : d0;
      },
      ordinal: function () {
        return (
          sszvis.find(function (d) {
            return xAcc(d) === datum;
          }, data) || data[0]
        );
      },
    });
  }

  function isSelected(d) {
    return sszvis.contains(state.selection.map(xAcc).map(String), String(d));
  }
};
