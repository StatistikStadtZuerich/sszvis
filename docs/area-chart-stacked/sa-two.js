/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------
const queryProps = sszvis
  .responsiveProps()
  .prop("controlWidth", {
    _: (width) => Math.min(width, 300),
  })
  .prop("xLabelFormat", {
    _: () => sszvis.formatYear,
  });

function parseRow(d) {
  return {
    category: d["Nationalität"],
    year: sszvis.parseYear(d["Jahr"]),
    value: sszvis.parseNumber(d["Anzahl"]),
  };
}
const xAcc = sszvis.prop("year");
const yAcc = sszvis.prop("value");
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
          const r = { year: d[Object.keys(d)[0]][0].year };
          for (const k of state.categories) {
            r[k] = yAcc(d[k][0]);
          }
          return r;
        })
    );

    for (const [i, stack] of state.stackedData.entries()) {
      for (const d of stack) {
        d.key = [...state.categories].reverse()[i];
      }
    }

    const dateValues = sszvis.cascade().objectBy(sszvis.compose(String, xAcc)).apply(state.data);

    state.maxValue = d3.max(state.data, yAcc);

    state.maxStacked = d3.max(Object.values(dateValues), (s) => d3.sum(s, yAcc));

    state.dates = sszvis.set(state.data, xAcc);

    actions.resetDate();
  },

  toggleMultiples(e, g) {
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
      slant: props.xSlant,
    },
    config.id
  );

  const cScale = legendLayout.scale;
  const colorLegend = legendLayout.legend;

  const bounds = sszvis.bounds({ top: 70, bottom: legendLayout.bottomPadding }, config.id);

  const multiplesLayout = sszvis.layoutStackedAreaMultiples(
    bounds.innerHeight,
    state.stackedData.length,
    0.1
  );

  // Scales

  const xScale = d3.scaleTime().domain(state.timeExtent).range([0, bounds.innerWidth]);

  const yScale = d3.scaleLinear().domain([0, state.maxStacked]).range([bounds.innerHeight, 0]);

  const yScaleMultiples = d3
    .scaleLinear()
    .domain([0, state.maxValue])
    .range([0, multiplesLayout.bandHeight]);

  const yPositionMultiples = d3
    .scaleOrdinal()
    .domain(state.categories)
    .range(multiplesLayout.range);

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

  const stackedAreaMultiples = sszvis
    .stackedAreaMultiples()
    .key(sszvis.prop("key"))
    .x(sszvis.compose(xScale, xAcc, (d) => d.data))
    .y0(sszvis.compose(yPositionMultiples, (d) => d.key))
    .y1((d) => yPositionMultiples(d.key) - yScaleMultiples(d.data[d.key]))
    .fill(sszvis.compose(cScale, (d) => d.key));

  let topValue;
  if (state.isMultiples) {
    const first = sszvis.first(state.highlightData.reverse());
    topValue = yPositionMultiples(first.key) - yScaleMultiples(first.data[first.key]);
  } else {
    topValue = yScale(state.totalHighlightValue);
  }

  const rangeRuler = sszvis
    .annotationRangeRuler()
    .top(topValue)
    .bottom(bounds.innerHeight)
    .x(xScale(state.highlightDate))
    .y0((d) => (state.isMultiples ? yPositionMultiples(d.key) : yScale(d[0])))
    .y1((d) =>
      state.isMultiples ? yPositionMultiples(d.key) - yScaleMultiples(d.data[d.key]) : yScale(d[1])
    )
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
    .y0((d) => (state.isMultiples ? yPositionMultiples(d.key) : yScale(d[0])))
    .y1((d) =>
      state.isMultiples ? yPositionMultiples(d.key) - yScaleMultiples(d.data[d.key]) : yScale(d[1])
    );

  const xAxisTicks = [...xScale.ticks(5), state.highlightDate];

  const xAxis = sszvis.axisX
    .time()
    .scale(xScale)
    .orient("bottom")
    .tickValues(xAxisTicks)
    .tickFormat(props.xLabelFormat)
    .highlightTick((d) => sszvis.stringEqual(d, state.highlightDate));

  const yAxis = sszvis.axisY().scale(yScale).contour(true).orient("right");

  const options = ["Summiert", "Separiert"];
  const buttonGroup = sszvis
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

  const flagGroup = chartLayer
    .selectGroup("flag")
    .datum(
      state.highlightData.filter((v) => {
        if (state.isMultiples) {
          const scaledMouseY = yScale(state.mouseYValue),
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

  const interactionLayer = sszvis
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
  const i = d3.bisectLeft(data, datum, 1);
  const d0 = data[i - 1];
  const d1 = data[i] || d0;
  return datum - d0 > d1 - datum ? d1 : d0;
}
