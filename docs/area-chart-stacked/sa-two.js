/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------
var queryProps = sszvis
  .responsiveProps()
  .prop("controlWidth", {
    _: function (width) {
      return Math.min(width, 300);
    },
  })
  .prop("xLabelFormat", {
    _: function () {
      return sszvis.formatYear;
    },
  });

function parseRow(d) {
  return {
    category: d["Nationalität"],
    year: sszvis.parseYear(d["Jahr"]),
    value: sszvis.parseNumber(d["Anzahl"]),
  };
}
var xAcc = sszvis.prop("year");
var yAcc = sszvis.prop("value");
var cAcc = sszvis.prop("category");

// Application state
// -----------------------------------------------
var state = {
  data: [],
  timeExtent: [0, 0],
  stackedData: [],
  maxStacked: 0,
  categories: [],
  isMultiples: false,
  highlightDate: new Date(),
  highlightData: [],
  totalHighlightValue: 0,
  mouseYValue: 0,
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState: function (data) {
    state.data = data;
    state.timeExtent = d3.extent(state.data, xAcc);
    state.categories = sszvis.set(state.data, cAcc);

    var stackLayout = d3.stack().keys(state.categories.slice().reverse());
    state.stackedData = stackLayout(
      sszvis
        .cascade()
        .arrayBy(xAcc)
        .objectBy(cAcc)
        .apply(state.data)
        .map(function (d) {
          var r = { year: d[Object.keys(d)[0]][0].year };
          state.categories.forEach(function (k) {
            r[k] = yAcc(d[k][0]);
          });
          return r;
        })
    );

    state.stackedData.forEach(function (stack, i) {
      stack.forEach(function (d) {
        d.key = state.categories.slice().reverse()[i];
      });
    });

    var dateValues = sszvis.cascade().objectBy(sszvis.compose(String, xAcc)).apply(state.data);

    state.maxValue = d3.max(state.data, yAcc);

    state.maxStacked = d3.max(d3.values(dateValues), function (s) {
      return d3.sum(s, yAcc);
    });

    state.dates = sszvis.set(state.data, xAcc);

    actions.resetDate();
  },

  toggleMultiples: function (g) {
    state.isMultiples = g === "Separiert";
    render(state);
  },

  changeDate: function (xValue, yValue) {
    var closest = findClosest(state.dates, xValue);
    state.highlightDate = closest;
    state.highlightData = state.stackedData.map(function (stack) {
      var datum = stack.filter(function (d) {
        return xAcc(d.data).toString() === closest.toString();
      })[0];
      var r = { data: datum.data, index: stack.index, key: stack.key };
      r[0] = datum[0];
      r[1] = datum[1];
      return r;
    });
    state.totalHighlightValue =
      state.highlightData.reduce(function (m, v) {
        return state.categories.reduce(function (m, category) {
          return v.data[category] + m;
        }, m);
      }, 0) / state.categories.length;
    state.mouseYValue = yValue;

    render(state);
  },

  resetDate: function () {
    var mostRecent = d3.max(state.data, xAcc);
    actions.changeDate(mostRecent, 0);
  },

  resize: function () {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  var props = queryProps(sszvis.measureDimensions(config.id));

  var legendLayout = sszvis.colorLegendLayout(
    {
      axisLabels: state.timeExtent.map(props.xLabelFormat),
      legendLabels: state.categories,
      slant: props.xSlant,
    },
    config.id
  );

  var cScale = legendLayout.scale;
  var colorLegend = legendLayout.legend;

  var bounds = sszvis.bounds({ top: 70, bottom: legendLayout.bottomPadding }, config.id);

  var multiplesLayout = sszvis.layoutStackedAreaMultiples(
    bounds.innerHeight,
    state.stackedData.length,
    0.1
  );

  // Scales

  var xScale = d3.scaleTime().domain(state.timeExtent).range([0, bounds.innerWidth]);

  var yScale = d3.scaleLinear().domain([0, state.maxStacked]).range([bounds.innerHeight, 0]);

  var yScaleMultiples = d3
    .scaleLinear()
    .domain([0, state.maxValue])
    .range([0, multiplesLayout.bandHeight]);

  var yPositionMultiples = d3.scaleOrdinal().domain(state.categories).range(multiplesLayout.range);

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.stackedData);

  var htmlLayer = sszvis.createHtmlLayer(config.id, bounds);

  // Components

  var stackedArea = sszvis
    .stackedArea()
    .key(sszvis.prop("key"))
    .x(
      sszvis.compose(xScale, xAcc, function (d) {
        return d.data;
      })
    )
    .y0(
      sszvis.compose(yScale, function (d) {
        return d[0];
      })
    )
    .y1(
      sszvis.compose(yScale, function (d) {
        return d[1];
      })
    )
    .fill(
      sszvis.compose(cScale, function (d) {
        return d.key;
      })
    );

  var stackedAreaMultiples = sszvis
    .stackedAreaMultiples()
    .key(sszvis.prop("key"))
    .x(
      sszvis.compose(xScale, xAcc, function (d) {
        return d.data;
      })
    )
    .y0(
      sszvis.compose(yPositionMultiples, function (d) {
        return d.key;
      })
    )
    .y1(function (d) {
      return yPositionMultiples(d.key) - yScaleMultiples(d.data[d.key]);
    })
    .fill(
      sszvis.compose(cScale, function (d) {
        return d.key;
      })
    );

  var topValue;
  if (state.isMultiples) {
    var first = sszvis.first(state.highlightData.reverse());
    topValue = yPositionMultiples(first.key) - yScaleMultiples(first.data[first.key]);
  } else {
    topValue = yScale(state.totalHighlightValue);
  }

  var rangeRuler = sszvis
    .annotationRangeRuler()
    .top(topValue)
    .bottom(bounds.innerHeight)
    .x(xScale(state.highlightDate))
    .y0(function (d) {
      if (state.isMultiples) {
        return yPositionMultiples(d.key);
      } else {
        return yScale(d[0]);
      }
    })
    .y1(function (d) {
      if (state.isMultiples) {
        return yPositionMultiples(d.key) - yScaleMultiples(d.data[d.key]);
      } else {
        return yScale(d[1]);
      }
    })
    .label(function (d) {
      return d.data[d.key];
    })
    .total(state.totalHighlightValue)
    .flip(function (d) {
      return xScale(state.highlightDate) >= 0.5 * bounds.innerWidth;
    });

  var tooltipText = sszvis
    .modularTextHTML()
    .bold(
      sszvis.compose(sszvis.formatNumber, function (d) {
        return d.data[d.key];
      })
    )
    .plain(function (d) {
      return d.key;
    });

  var rangeTooltip = sszvis
    .tooltip()
    .header(tooltipText)
    .orientation(function (d) {
      return xScale(state.highlightDate) >= 0.5 * bounds.innerWidth ? "right" : "left";
    })
    .renderInto(htmlLayer)
    .visible(true);

  var rangeFlag = sszvis
    .annotationRangeFlag()
    .x(xScale(state.highlightDate))
    .y0(function (d) {
      if (state.isMultiples) {
        return yPositionMultiples(d.key);
      } else {
        return yScale(d[0]);
      }
    })
    .y1(function (d) {
      if (state.isMultiples) {
        return yPositionMultiples(d.key) - yScaleMultiples(d.data[d.key]);
      } else {
        return yScale(d[1]);
      }
    });

  var xAxisTicks = xScale.ticks(5).concat(state.highlightDate);

  var xAxis = sszvis.axisX
    .time()
    .scale(xScale)
    .orient("bottom")
    .tickValues(xAxisTicks)
    .tickFormat(props.xLabelFormat)
    .highlightTick(function (d) {
      return sszvis.stringEqual(d, state.highlightDate);
    });

  var yAxis = sszvis.axisY().scale(yScale).contour(true).orient("right");

  var options = ["Summiert", "Separiert"];
  var buttonGroup = sszvis
    .buttonGroup()
    .values(options)
    .current(options[Number(state.isMultiples)])
    .change(actions.toggleMultiples)
    .width(props.controlWidth);

  // Rendering

  chartLayer.selectGroup("areachart").call(state.isMultiples ? stackedAreaMultiples : stackedArea);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer
    .selectGroup("yAxis")
    .call(yAxis)
    .transition(sszvis.defaultTransition())
    .style("opacity", Number(!state.isMultiples));

  chartLayer.selectGroup("yAxis").selectAll("text");

  chartLayer
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding)
    )
    .call(colorLegend);

  htmlLayer
    .selectDiv("controls")
    .style("left", (bounds.innerWidth - buttonGroup.width()) / 2 + "px")
    .style("top", 20 - bounds.padding.top + "px")
    .call(buttonGroup);

  chartLayer.selectGroup("highlight").datum(state.highlightData).call(rangeRuler);

  chartLayer.selectGroup("highlight").selectAll("text");

  var flagGroup = chartLayer
    .selectGroup("flag")
    .datum(
      state.highlightData.filter(function (v) {
        if (state.isMultiples) {
          var scaledMouseY = yScale(state.mouseYValue),
            y0 = yPositionMultiples(v.key),
            dy = yScaleMultiples(v.data[v.key]);
          return y0 > scaledMouseY && y0 - dy < scaledMouseY;
        } else {
          return v[0] < state.mouseYValue && v[1] > state.mouseYValue;
        }
      })
    )
    .call(rangeFlag);

  flagGroup.selectAll("[data-tooltip-anchor]").call(rangeTooltip);

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

// Helper functions
// -----------------------------------------------
function findClosest(data, datum) {
  var i = d3.bisectLeft(data, datum, 1);
  var d0 = data[i - 1];
  var d1 = data[i] || d0;
  return datum - d0 > d1 - datum ? d1 : d0;
}
