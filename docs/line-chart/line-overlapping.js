/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("rulerLabel", {
    _: () =>
      sszvis
        .modularTextSVG()
        .bold(
          sszvis.compose(
            (d) => sszvis.formatPercent(yAcc(d) / 100),
            (d) => d,
          ),
        )
        .plain(cAcc),
  })
  .prop("xLabel", {
    _: "",
  })
  .prop("yLabel", {
    _: "Response rate",
  })
  .prop("ticks", {
    _: 5,
  });

function parseRow(d) {
  // Filter for Stadtkreis data only (not Quartier)
  if (d["Raum"] !== "Stadtkreis") return null;

  return {
    xValue: sszvis.parseNumber(d["Jahr"]),
    yValue: sszvis.parseNumber(d["Wert"]),
    category: d["Kreis"],
    kreisNum: sszvis.parseNumber(d["KreisNum"]),
  };
}

const xAcc = sszvis.prop("xValue");
const yAcc = sszvis.prop("yValue");
const cAcc = sszvis.prop("category");
const kreisNumAcc = sszvis.prop("kreisNum");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  lineData: [],
  categories: [],
  xValues: [],
  maxY: 0,
  selection: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    // Filter out null values (non-Stadtkreis data)
    const filteredData = data.filter((d) => d !== null);

    state.data = filteredData;

    // Group data by category and sort by Kreis number
    const grouped = sszvis
      .cascade()
      .arrayBy(cAcc, d3.ascending)
      .apply(filteredData);

    // Sort groups by Kreis number and then sort each group's values by year
    state.lineData = grouped
      .map((g) => ({
        values: g.sort((a, b) => xAcc(a) - xAcc(b)),
        kreisNum: kreisNumAcc(g[0]),
      }))
      .sort((a, b) => a.kreisNum - b.kreisNum)
      .map((g) => g.values);

    // Get sorted categories
    state.categories = state.lineData.map((g) => cAcc(g[0]));

    // Get x-axis domain (all years)
    state.xValues = d3.extent(filteredData, xAcc);

    // Y-axis domain (0-100 for percentages)
    state.maxY = 100;

    render(state);
  },

  showTooltip(_e, inputDate) {
    // Find the closest date to the mouse position
    const closestDate = xAcc(closestDatum(state.data, xAcc, inputDate));

    // Find all data points at that date
    const closestData = state.lineData.map((linePoints) =>
      sszvis.find(
        (d) => xAcc(d).toString() === closestDate.toString(),
        linePoints,
      ),
    );

    state.selection = closestData.filter(
      sszvis.compose(sszvis.not(isNaN), yAcc),
    );
    render(state);
  },

  hideTooltip() {
    // Find the most recent date and show that
    const mostRecentDate = d3.max(state.data, xAcc);
    const closestData = state.lineData.map((linePoints) =>
      sszvis.find(
        (d) => xAcc(d).toString() === mostRecentDate.toString(),
        linePoints,
      ),
    );
    state.selection = closestData.filter(
      sszvis.compose(sszvis.not(isNaN), yAcc),
    );
    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow)
  .then(actions.prepareState)
  .catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  const props = queryProps(sszvis.measureDimensions(config.id));

  const cScale = sszvis.scaleQual12().domain(state.categories);

  const bounds = sszvis.bounds(
    {
      top:
        typeof props.yLabel === "string" && props.yLabel.length > 0 ? 30 : 10,
      bottom: 100, // Space for legend
    },
    config.id,
  );

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain(state.xValues)
    .range([0, bounds.innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([0, state.maxY])
    .range([bounds.innerHeight, 0]);

  // Layers
  const chartLayer = sszvis
    .createSvgLayer(config.id, bounds)
    .datum(state.lineData);

  // Components
  const line = sszvis
    .line()
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    // Access the first data point of the line to decide on the stroke color
    .stroke(sszvis.compose(cScale, cAcc, sszvis.first));

  // Ruler annotation for hover
  const highlightLayer = sszvis
    .annotationRuler()
    .top(0)
    .bottom(bounds.innerHeight)
    .x(sszvis.compose(xScale, xAcc))
    .y(sszvis.compose(yScale, yAcc))
    .label(props.rulerLabel)
    .flip((d) => xScale(xAcc(d)) >= bounds.innerWidth / 2)
    .color(sszvis.compose(cScale, cAcc));

  // Axes
  const xAxis = sszvis
    .axisX()
    .scale(xScale)
    .orient("bottom")
    .tickFormat(d3.format("d"))
    .ticks(props.ticks)
    .highlightTick((d) =>
      state.selection.length > 0
        ? String(d) === String(xAcc(state.selection[0]))
        : false,
    )
    .alignOuterLabels(true);

  const yAxis = sszvis
    .axisY()
    .scale(yScale)
    .orient("right")
    .ticks(5)
    .tickFormat((d) => d + "%")
    .contour(true)
    .title(props.yLabel)
    .dyTitle(-20);

  // Legend
  const colorLegend = sszvis
    .legendColorOrdinal()
    .scale(cScale)
    .columnWidth(bounds.innerWidth / 6)
    .columns(6)
    .orientation("horizontal");

  // Rendering
  chartLayer.selectGroup("line").call(line);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis);

  chartLayer.selectGroup("yAxis").call(yAxis);

  chartLayer
    .selectGroup("colorLegend")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight + 40))
    .call(colorLegend);

  chartLayer
    .selectGroup("highlight")
    .datum(state.selection)
    .call(highlightLayer);

  // Interaction
  const interactionLayer = sszvis
    .move()
    .xScale(xScale)
    .yScale(yScale)
    .on("move", actions.showTooltip)
    .on("end", actions.hideTooltip);

  chartLayer.selectGroup("interaction").call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
function closestDatum(data, accessor, datum) {
  const i = d3.bisector(accessor).left(data, datum, 1);
  const d0 = data[i - 1];
  const d1 = data[i] || d0;
  return datum - accessor(d0) > accessor(d1) - datum ? d1 : d0;
}
