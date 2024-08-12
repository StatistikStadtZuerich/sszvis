/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------
var SLIDER_CONTROL_HEIGHT = 60;
var queryProps = sszvis.responsiveProps().prop("xLabelFormat", {
  _ () {
    return sszvis.formatNumber;
  },
});

function parseRow(d) {
  return {
    year: sszvis.parseNumber(d["jahr"]),
    branch: d["brance"],
    count: sszvis.parseNumber(d["beschaeftige"]),
    percent: sszvis.parseNumber(d["frauenanteil"]),
  };
}

var xAcc = sszvis.prop("count");
var yAcc = sszvis.prop("percent");
var yearAcc = sszvis.prop("year");
var branchAcc = sszvis.prop("branch");

// Application state
// -----------------------------------------------
var state = {
  data: [],
  linesData: [],
  currentData: [],
  currentLinesData: [],
  xExtent: [],
  yExtent: [],
  years: [],
  branches: [],
  activeYear: null,
  selection: [],
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState (data) {
    state.data = data;
    state.xExtent = [0, d3.max(state.data, xAcc)];
    state.yExtent = [0, d3.max(state.data, yAcc)];
    state.tExtent = d3.extent(state.data, yearAcc);
    state.years = sszvis.set(state.data, yearAcc);
    state.branches = sszvis.set(state.data, branchAcc);

    state.linesData = sszvis
      .cascade()
      .arrayBy(branchAcc, d3.ascending)
      .sort((a, b) => d3.ascending(yearAcc(a), yearAcc(b)))
      .apply(state.data);

    actions.setYear(null, d3.max(state.years));
  },

  setYear (inputYear) {
    state.activeYear = closestDatum(state.years, sszvis.identity, inputYear);

    state.currentLinesData = state.linesData.map((line) =>
      line.filter((d) => yearAcc(d) <= state.activeYear)
    );

    state.futureLinesData = state.linesData.map((line) =>
      line.filter((d) => yearAcc(d) >= state.activeYear)
    );

    var splitData = state.data.reduce(
      (memo, datum) => {
        var year = yearAcc(datum);

        // We only render dots for the current year's data
        if (year === state.activeYear) {
          memo.currentData.push(datum);
        }
        // The voronoi interaction layer includes both current and past data
        if (year <= state.activeYear) {
          memo.currentAndPastData.push(datum);
        }

        return memo;
      },
      {
        currentData: [],
        currentAndPastData: [],
      }
    );

    state.currentData = splitData.currentData;

    // For the voronoi component, it is essential that no two input vertices lie at the same point
    state.voronoiPoints = sszvis.derivedSet(
      splitData.currentAndPastData,
      (d) => xAcc(d) + "__" + yAcc(d)
    );

    if (splitData.currentAndPastData.length !== state.voronoiPoints.length) {
      console.warn(
        splitData.currentAndPastData.length -
          state.voronoiPoints.length +
          " data points were filtered out of the voronoi points because the voronoi interaction layer requires that no two input vertices lie at the same point."
      );
    }

    render(state);
  },

  selectPoint (d) {
    state.selection = [d];

    render(state);
  },

  deselectPoint () {
    state.selection = [];

    render(state);
  },

  resize () {
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
      axisLabels: state.xExtent.map(props.xLabelFormat),
      legendLabels: state.branches,
    },
    config.id
  );

  var cScale = legendLayout.scale;
  var colorLegend = legendLayout.legend;

  var bounds = sszvis.bounds(
    {
      top: 10,
      right: 5,
      bottom: SLIDER_CONTROL_HEIGHT + legendLayout.bottomPadding,
      left: 5,
    },
    config.id
  );

  // Scales

  var xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

  var yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

  var tScale = d3.scaleLinear().domain(state.tExtent).range([0, bounds.innerWidth]);

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds);

  var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds);

  // Components

  var lines = sszvis
    .line()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .stroke(sszvis.compose(cScale, branchAcc, sszvis.first))
    .strokeWidth(1.8)
    .transition(false);

  var futureLines = sszvis
    .line()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .strokeWidth(1.8)
    .transition(false);

  var visibleDots = sszvis
    .dot()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .radius(4)
    .fill(sszvis.compose(cScale, branchAcc))
    // use white outlines in scatterplots to assist in identifying distinct circles
    .stroke("#FFFFFF")
    .transition(false);

  var invisibleDots = sszvis
    .dot()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    // These dots are slightly smaller (radius 3) than the visible dots for the current time period (radius 4)
    .radius((d) => (isSelected(d) ? 3 : 0))
    .fill(sszvis.compose(cScale, branchAcc))
    // use white outlines in scatterplots to assist in identifying distinct circles
    .stroke("#FFFFFF")
    .transition(false);

  var mouseOverlay = sszvis
    .voronoi()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .bounds([
      -bounds.padding.left,
      -bounds.padding.top,
      bounds.innerWidth + bounds.padding.right,
      bounds.innerHeight + 20,
    ])
    .on("over", actions.selectPoint)
    .on("out", actions.deselectPoint);

  var slider = sszvis
    .slider()
    .scale(tScale)
    .value(state.activeYear)
    .majorTicks(state.years)
    // No label necessary here (it's redundant)
    .label("")
    .onchange(actions.setYear);

  var xAxis = sszvis
    .axisX()
    .scale(xScale)
    .ticks(4)
    .tickFormat(props.xLabelFormat)
    .orient("bottom")
    .alignOuterLabels(true);

  var yAxis = sszvis
    .axisY()
    .scale(yScale)
    .ticks(6)
    .orient("right")
    .tickFormat((d) =>
      // Have to implement our own hiding for zero, because showZeroY is implemented through tickFormat
      d === 0 ? null : sszvis.formatPercent(d)
    )
    .contour(true);

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .visible(isSelected)
    .header(sszvis.modularTextHTML().bold(branchAcc))
    .body((d) => [
      ["Jahr", sszvis.formatText(yearAcc(d))],
      ["Beschäftige", sszvis.formatNumber(xAcc(d))],
      ["Frauenanteil", sszvis.formatPercent(yAcc(d))],
    ]);

  // Rendering

  // lines and futureLines have different data from the dots layer, rendering lines as arrays of data values
  chartLayer.selectGroup("lines").datum(state.currentLinesData).call(lines);

  chartLayer
    .selectGroup("futureLines")
    .datum(state.futureLinesData)
    .call(futureLines)
    .selectAll(".sszvis-line")
    .classed("sszvis-referenceline", true); // Adding this CSS class gives the future lines the same visual styling as the reference line component

  // we render invisible dots which are for both current and past years.
  // These enable attaching a tooltip to their positions
  chartLayer
    .selectGroup("invisibleDots")
    .datum(state.voronoiPoints)
    .call(invisibleDots)
    .selectAll("[data-tooltip-anchor]")
    .call(tooltip);

  // the visible dots are just the ones for the current 'activeYear'
  chartLayer.selectGroup("visibleDots").datum(state.currentData).call(visibleDots);

  chartLayer.selectGroup("voronoiInteraction").datum(state.voronoiPoints).call(mouseOverlay);

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

function closestDatum(data, accessor, datum) {
  var i = d3.bisector(accessor).left(data, datum, 1);
  var d0 = data[i - 1];
  var d1 = data[i] || d0;
  return datum - accessor(d0) > accessor(d1) - datum ? d1 : d0;
}

function isSelected(d) {
  return state.selection.includes(d);
}
