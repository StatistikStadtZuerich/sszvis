module.exports = function (d3, sszvis, config) {

  /* Configuration
  ----------------------------------------------- */

  var queryProps = sszvis
    .responsiveProps()
    .prop("barPadding", {
      palm: 0.2,
      _: 0.1,
    })
    .prop("leftPadding", {
      _: null,
    })
    .prop("yLabelFormat", {
      _: function () {
        return sszvis.formatNumber;
      },
    });

  function parseRow(d) {
    return {
      year: sszvis.parseNumber(d["Jahr"]),
      value: sszvis.parseNumber(d["Hotelübernachtungen"]),
    };
  }

  var xAcc = sszvis.prop("year");
  var yAcc = sszvis.prop("value");

  /* Application state
  ----------------------------------------------- */
  var state = {
    data: [],
    categories: [],
    yearRange: [],
    selection: [],
  };

  /* State transitions
  ----------------------------------------------- */
  var actions = {
    prepareState: function (data) {
      state.data = data;
      state.categories = sszvis.set(state.data, xAcc);
      state.yearRange = d3.extent(state.data, xAcc);
      render(state);
    },

    changeDate: function (selectedDate) {
      var selectedYear = Math.round(selectedDate);
      state.selection = state.data.filter(function (v) {
        return xAcc(v) === selectedYear;
      });
      render(state);
    },

    resetDate: function () {
      state.selection = [];
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
    var yMax = d3.max(state.data, yAcc);
    var bounds = sszvis.bounds(
      {
        top: 3,
        bottom: 25,
        left:
          props.leftPadding != null
            ? props.leftPadding
            : sszvis.measureAxisLabel(props.yLabelFormat(yMax)) + 10,
      },
      config.id
    );

    var chartDimensions = sszvis.dimensionsVerticalBarChart(
      bounds.innerWidth,
      state.categories.length
    );

    // Scales

    var xScale = d3
      .scaleBand()
      .domain(state.categories)
      .padding(chartDimensions.padRatio)
      .paddingOuter(props.barPadding)
      .range([0, chartDimensions.totalWidth]);

    var heightScale = d3.scaleLinear().domain([0, yMax]).range([0, bounds.innerHeight]);

    var yPosScale = heightScale.copy().range(heightScale.range().slice().reverse());

    var xValue = sszvis.compose(xScale, xAcc);
    // rounding the y-values and the height prevents the bars from jumping around
    var yValue = sszvis.compose(Math.round, yPosScale, yAcc);
    var hValue = sszvis.compose(Math.round, heightScale, yAcc);

    var cScale = sszvis.scaleQual12();
    var cScaleDark = cScale.darker();

    // Layers

    var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

    var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    var barGen = sszvis
      .bar()
      .x(xValue)
      .y(yValue)
      .width(xScale.bandwidth())
      .height(hValue)
      .fill(function (d) {
        return isSelected(d) ? cScaleDark(d) : cScale(d);
      });

    var xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(5);

    var yAxis = sszvis.axisY().scale(yPosScale).orient("right");

    var tooltipTitle = sszvis.modularTextHTML().bold(yAcc).plain("Hotelübernachtungen");

    var tooltip = sszvis
      .tooltip()
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .renderInto(tooltipLayer)
      .header(tooltipTitle)
      .body(function (d) {
        return "Im Jahr " + xAcc(d);
      })
      .visible(isSelected);

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(
        bounds.innerWidth / 2 - chartDimensions.totalWidth / 2,
        bounds.padding.top
      )
    );

    var bars = chartLayer
      .selectGroup("bars")
      .attr("transform", sszvis.translateString(bounds.padding.left, 0))
      .call(barGen);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    bars
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    // Interaction

    var interactionLayer = sszvis
      .move()
      .xScale(xScale)
      .yScale(yPosScale)
      .on("move", actions.changeDate)
      .on("end", actions.resetDate);

    bars.selectGroup("interaction").call(interactionLayer);

    sszvis.viewport.on("resize", actions.resize);
  }

  /* Helper functions
  ----------------------------------------------- */
  function isSelected(d) {
    return sszvis.contains(state.selection, d);
  }
}