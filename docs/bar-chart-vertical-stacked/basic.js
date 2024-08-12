/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

var queryProps = sszvis
  .responsiveProps()
  .prop("columnCount", {
    _: null,
  })
  .prop("bottomPadding", {
    _: null,
  })
  .prop("barPadding", {
    palm: 0.7,
    _: 0.34,
  })
  .prop("leftPadding", {
    _: null,
  })
  .prop("xLabel", {
    _: "",
  })
  .prop("xLabelFormat", {
    _: function () {
      return sszvis.formatText;
    },
  })
  .prop("xSlant", {
    palm: "vertical",
    _: "horizontal",
  })
  .prop("yLabel", {
    _: "Beschäftigte",
  })
  .prop("yLabelFormat", {
    _: function () {
      return sszvis.formatNumber;
    },
  })
  .prop("ticks", {
    _: 5,
  });

function parseRow(d) {
  return {
    xValue: d["Jahr"],
    category: d["Berufsfeld"],
    yValue: sszvis.parseNumber(d["Anzahl"]),
  };
}

var xAcc = sszvis.prop("xValue");
var yAcc = sszvis.prop("yValue");
var cAcc = sszvis.prop("category");
var dataAcc = sszvis.prop("data");

// Application state
// -----------------------------------------------
var state = {
  data: [],
  years: [],
  categories: [],
  stackedData: [],
  maxStacked: 0,
  selection: [],
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState: function (data) {
    state.data = data;
    state.years = sszvis.set(state.data, xAcc);
    state.categories = sszvis.set(state.data, cAcc);

    state.stackedData = sszvis.stackedBarVerticalData(xAcc, cAcc, yAcc)(data);
    state.maxStacked = state.stackedData.maxValue;

    render(state);
  },

  showTooltip: function (datum) {
    state.selection = [datum];
    render(state);
  },

  hideTooltip: function () {
    state.selection = [];
    render(state);
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
      axisLabels: state.years.map(props.xLabelFormat),
      legendLabels: state.categories,
      slant: props.xSlant,
    },
    config.id
  );

  var cScale = legendLayout.scale;
  var colorLegend = legendLayout.legend;

  var bounds = sszvis.bounds(
    {
      top: 30,
      bottom: props.bottomPadding == null ? legendLayout.bottomPadding : props.bottomPadding,
      left:
        props.leftPadding == null
          ? sszvis.measureAxisLabel(props.yLabelFormat(state.maxStacked))
          : props.leftPadding,
    },
    config.id
  );

  var chartDimensions = sszvis.dimensionsVerticalBarChart(
    Math.min(800, bounds.innerWidth),
    state.categories.length
  );

  // Scales

  var xScale = d3
    .scaleBand()
    .domain(state.years)
    .padding(chartDimensions.padRatio)
    .paddingOuter(props.barPadding)
    .range([0, chartDimensions.totalWidth]);

  var yScale = d3.scaleLinear().domain([0, state.maxStacked]).range([bounds.innerHeight, 0]);

  // Layers

  var chartLayer = sszvis
    .createSvgLayer(config.id, bounds, {
      title: config.title,
      description: config.description,
    })
    .datum(state.stackedData);

  var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

  // Components

  var stackedBars = sszvis
    .stackedBarVertical()
    .xScale(xScale)
    .width(xScale.bandwidth())
    .yScale(yScale)
    .fill((d) => {
      var color = cScale(cAcc(dataAcc(d)));
      return isSelected(d) ? sszvis.slightlyDarker(color) : color;
    });

  var xAxis = sszvis.axisX
    .ordinal()
    .scale(xScale)
    .orient("bottom")
    .slant(props.xSlant)
    .tickFormat(props.xLabelFormat)
    .title(props.xLabel);

  var yAxis = sszvis
    .axisY()
    .scale(yScale)
    .orient("right")
    .title(props.yLabel)
    .tickFormat(props.yLabelFormat)
    .dyTitle(-20);

  var tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(cAcc, dataAcc));

  var tooltipText = sszvis
    .modularTextHTML()
    .plain(sszvis.compose(sszvis.formatNumber, yAcc, dataAcc));

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .header(tooltipHeader)
    .body(tooltipText)
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
    .selectGroup("barchart")
    .attr("transform", sszvis.translateString(bounds.padding.left, 0))
    .call(stackedBars);

  bars.selectAll("[data-tooltip-anchor]").call(tooltip);

  bars
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer.selectGroup("yAxis").attr("transform", sszvis.translateString(0, 0)).call(yAxis);

  chartLayer
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding)
    )
    .call(colorLegend);

  // Interaction
  var interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-bar")
    .on("start", actions.showTooltip)
    .on("pan", actions.showTooltip)
    .on("end", actions.hideTooltip);

  bars.call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
function isSelected(d) {
  return sszvis.contains(state.selection, d);
}
