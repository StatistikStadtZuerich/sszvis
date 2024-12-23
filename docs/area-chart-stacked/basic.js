/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("xAxisLabel", {
    _: "",
  })
  .prop("xTicks", {
    _: null,
  })
  .prop("xLabelFormat", {
    _: () => sszvis.formatYear,
  })
  .prop("yAxisLabel", {
    _: "",
  })
  .prop("yTicks", {
    _: null,
  });

function parseRow(d) {
  return {
    category: d["Nationalität"],
    xValue: sszvis.parseYear(d["Jahr"]),
    yValue: sszvis.parseNumber(d["Anzahl"]),
  };
}

const xAcc = sszvis.prop("xValue");
const yAcc = sszvis.prop("yValue");
const cAcc = sszvis.prop("category");

// Application state
// -----------------------------------------------
const state = {
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
const actions = {
  prepareState(data) {
    state.data = data;
    state.timeExtent = d3.extent(state.data, xAcc);
    state.categories = sszvis.set(state.data, cAcc);

    const stackLayout = d3.stack().keys([...state.categories].reverse());
    state.stackedData = stackLayout(
      sszvis
        .cascade()
        .arrayBy(xAcc)
        .objectBy(cAcc)
        .apply(state.data)
        .map((d) => {
          const r = { xValue: xAcc(d[Object.keys(d)[0]][0]) };
          for (const k of state.categories) {
            r[k] = yAcc(d[k][0]);
          }
          return r;
        })
    );

    const dateValues = sszvis.cascade().objectBy(sszvis.compose(String, xAcc)).apply(state.data);

    state.maxValue = d3.max(state.data, yAcc);

    state.maxStacked = d3.max(Object.values(dateValues), (s) => d3.sum(s, yAcc));

    state.dates = sszvis.set(state.data, xAcc);

    actions.resetDate();
  },

  toggleMultiples(g) {
    state.isMultiples = g === "Separiert";
    render(state);
  },

  changeDate(e, xValue, yValue) {
    const closest = findClosest(state.dates, xValue);
    state.highlightDate = closest;
    state.highlightData = state.stackedData.map((stack) => {
      const datum = stack.find((d) => xAcc(d.data).toString() === closest.toString());
      const r = { data: datum.data, index: stack.index, key: stack.key };
      r[0] = datum[0];
      r[1] = datum[1];
      return r;
    });
    state.totalHighlightValue =
      state.highlightData.reduce(
        (m, v) => state.categories.reduce((m, category) => v.data[category] + m, m),
        0
      ) / state.categories.length;
    state.mouseYValue = yValue;

    render(state);
  },

  resetDate() {
    const mostRecent = d3.max(state.data, xAcc);
    actions.changeDate(mostRecent, 0);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  const props = queryProps(sszvis.measureDimensions(config.id));

  const legendLayout = sszvis.colorLegendLayout(
    {
      axisLabels: state.timeExtent.map(props.xLabelFormat),
      legendLabels: state.categories,
    },
    config.id
  );

  const cScale = legendLayout.scale;
  const colorLegend = legendLayout.legend;

  const bounds = sszvis.bounds(
    {
      top: 20,
      bottom: legendLayout.bottomPadding,
    },
    config.id
  );

  // Scales

  const xScale = d3.scaleTime().domain(state.timeExtent).range([0, bounds.innerWidth]);

  const yScale = d3.scaleLinear().domain([0, state.maxStacked]).range([bounds.innerHeight, 10]);

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.stackedData);

  const htmlLayer = sszvis.createHtmlLayer(config.id, bounds);

  // Components

  const stackedArea = sszvis
    .stackedArea()
    .key(sszvis.prop("key"))
    .x(sszvis.compose(xScale, xAcc, (d) => d.data))
    .y0(sszvis.compose(yScale, (d) => d[0]))
    .y1(sszvis.compose(yScale, (d) => d[1]))
    .fill(sszvis.compose(cScale, (d) => d.key));

  const topValue = yScale(state.totalHighlightValue);

  const rangeRuler = sszvis
    .annotationRangeRuler()
    .top(topValue)
    .bottom(bounds.innerHeight)
    .x(xScale(state.highlightDate))
    .y0((d) => yScale(d[0]))
    .y1((d) => yScale(d[1]))
    .label((d) => d.data[d.key])
    .total(state.totalHighlightValue)
    .flip(() => xScale(state.highlightDate) >= 0.5 * bounds.innerWidth);

  const tooltipText = sszvis
    .modularTextHTML()
    .bold(sszvis.compose(sszvis.formatNumber, (d) => d.data[d.key]))
    .plain((d) => d.key);

  const rangeTooltip = sszvis
    .tooltip()
    .header(tooltipText)
    .orientation(() => (xScale(state.highlightDate) >= 0.5 * bounds.innerWidth ? "right" : "left"))
    .renderInto(htmlLayer)
    .visible(true);

  const rangeFlag = sszvis
    .annotationRangeFlag()
    .x(xScale(state.highlightDate))
    .y0((d) => yScale(d[0]))
    .y1((d) => yScale(d[1]));

  const xAxisTicks = [...xScale.ticks(props.xTicks), state.highlightDate];

  const xAxis = sszvis.axisX
    .time()
    .scale(xScale)
    .orient("bottom")
    .tickValues(xAxisTicks)
    .tickFormat(props.xLabelFormat)
    .title(props.xAxisLabel)
    .highlightTick((d) => sszvis.stringEqual(d, state.highlightDate))
    .alignOuterLabels(true);

  const yAxisTicks = yScale.ticks(props.yTicks);

  const yAxis = sszvis
    .axisY()
    .scale(yScale)
    .contour(true)
    .orient("right")
    .title(props.yAxisLabel)
    .tickValues(yAxisTicks);

  // Rendering

  chartLayer.selectGroup("areachart").call(stackedArea);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer
    .selectGroup("yAxis")
    .call(yAxis)
    .transition(sszvis.defaultTransition())
    .style("opacity", Number(!state.isMultiples));

  chartLayer
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding)
    )
    .call(colorLegend);

  chartLayer.selectGroup("highlight").datum(state.highlightData).call(rangeRuler);

  const flagGroup = chartLayer
    .selectGroup("flag")
    .datum(state.highlightData.filter((v) => v[0] < state.mouseYValue && v[1] > state.mouseYValue))
    .call(rangeFlag);

  flagGroup.selectAll("[data-tooltip-anchor]").call(rangeTooltip);

  sszvis.viewport.on("resize", actions.resize);

  // Interaction
  const interactionLayer = sszvis
    .move()
    .xScale(xScale)
    .yScale(yScale)
    .on("move", actions.changeDate)
    .on("end", actions.resetDate);

  chartLayer.selectGroup("interaction").call(interactionLayer);
}

// Helper functions
// -----------------------------------------------
function findClosest(data, datum) {
  const i = d3.bisectLeft(data, datum, 1);
  const d0 = data[i - 1];
  const d1 = data[i] || d0;
  return datum - d0 > d1 - datum ? d1 : d0;
}
