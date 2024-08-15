/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

function parseRow(d) {
  return {
    xPosition: d["KName"],
    yPosition: d["Altersgruppe"],
    value: sszvis.parseNumber(d["Anzahl"]),
  };
}

const queryProps = sszvis
  .responsiveProps()
  .prop("xAxisSlant", {
    palm: "vertical",
    _: "diagonal",
  })
  .prop("xAxisLabel", {
    _: "Kreis",
  })
  .prop("yAxisLabel", {
    _: "Altersgruppe",
  })
  .prop("valueLabel", {
    _: "Einwohner",
  })
  .prop("tSourceAxis", {
    _: "x",
  })
  .prop("tTitleAdd", {
    _: "",
  });

const xAcc = sszvis.prop("xPosition");
const yAcc = sszvis.prop("yPosition");
const vAcc = sszvis.prop("value");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  yList: [],
  xList: [],
  valueDomain: [0, 0],
  selection: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.yList = sszvis.set(state.data, yAcc).sort(sortInt);
    state.xList = sszvis.set(state.data, xAcc).sort(sortKreisInt);
    state.valueDomain = d3.extent(state.data, vAcc);

    render(state);
  },

  showTooltip(datum) {
    state.selection = [datum];
    render(state);
  },

  hideTooltip() {
    state.selection = [];
    render(state);
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
  const containerWidth = sszvis.measureDimensions(config.id).width;
  const squarePadding = 2;
  const tablePadding = {
    top: 60,
    right: 0,
    bottom: 40,
    left: 66,
  };
  // heatTableDimensions calculates a set of useful properties for configuring the heat table.
  // give it the targeted width (final width will not necessarily match this), the padding between squares, and the number of squares
  // in each dimension (x, then y)
  const tableDimensions = sszvis.dimensionsHeatTable(
    containerWidth,
    squarePadding,
    state.xList.length,
    state.yList.length,
    tablePadding
  );

  // construct the bounds as usual, but add the left and right padding to the width, and the top and bottom padding to the height
  // This is because, when bounds are being constructed, the padding is subtracted from width and height to provide innerWidth and innerHeight, but we want these values to represent the table's dimensions
  const bounds = sszvis.bounds(
    {
      height: tablePadding.top + tableDimensions.height + tablePadding.bottom,
      left: tablePadding.left,
      right: tablePadding.right,
      top: tablePadding.top,
      bottom: tablePadding.bottom,
    },
    config.id
  );

  const props = queryProps(sszvis.measureDimensions(config.id));

  // Scales

  const xScale = d3
    .scaleBand()
    .padding(tableDimensions.padRatio)
    .paddingOuter(0)
    .rangeRound([0, tableDimensions.width])
    .domain(state.xList);

  const yScale = d3
    .scaleBand()
    .padding(tableDimensions.padRatio)
    .paddingOuter(0)
    .rangeRound([0, tableDimensions.height])
    .domain(state.yList);

  const colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

  const xValue = sszvis.compose(xScale, xAcc);
  const yValue = sszvis.compose(yScale, yAcc);
  const cValue = sszvis.compose(
    (v) =>
      isNaN(v) ? "url(#ht-missing-value)" : v === 0 ? sszvis.scaleLightGry()(v) : colorScale(v),
    vAcc
  );

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

  // Make sure that the missing value pattern is available
  sszvis
    .ensureDefsElement(chartLayer, "pattern", "ht-missing-value")
    .call(sszvis.heatTableMissingValuePattern);

  // Components

  const barGen = sszvis
    .bar()
    .x(xValue)
    .y(yValue)
    .width(tableDimensions.side)
    .height(tableDimensions.side)
    .fill(cValue)
    .stroke((d) =>
      !isNaN(vAcc(d)) && sszvis.contains(state.selection, d)
        ? sszvis.slightlyDarker(cValue(d))
        : "none"
    );

  const xAxis = sszvis.axisX
    .ordinal()
    .scale(xScale)
    .orient("top")
    .slant(props.xAxisSlant)
    .tickSize(0, 0)
    .tickPadding(0)
    .title(props.xAxisLabel)
    .titleAnchor("middle")
    .titleCenter(true)
    .dyTitle(-40)
    .highlightTick((tickValue) => state.selection.some((d) => xAcc(d) === tickValue));

  const yAxis = sszvis.axisY
    .ordinal()
    .scale(yScale)
    .orient("left")
    .title(props.yAxisLabel)
    .titleVertical(true)
    .titleAnchor("middle")
    .titleCenter(true)
    .dxTitle(-40)
    .highlightTick((tickValue) => state.selection.some((d) => yAcc(d) === tickValue));

  const legendWidth = Math.min(bounds.innerWidth / 2, 260);

  const legend = sszvis
    .legendColorLinear()
    .scale(colorScale)
    .width(legendWidth)
    .labelFormat(sszvis.formatNumber);

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header((d) =>
      props.tSourceAxis === "y" ? yAcc(d) + " " + props.tTitleAdd : xAcc(d) + " " + props.tTitleAdd
    )
    .body((d) => {
      const v = vAcc(d);
      return props.tSourceAxis === "y"
        ? [
            [props.xAxisLabel, xAcc(d)],
            [props.valueLabel, isNaN(v) ? "–" : sszvis.formatNumber(v)],
          ]
        : [
            [props.yAxisLabel, yAcc(d)],
            [props.valueLabel, isNaN(v) ? "–" : sszvis.formatNumber(v)],
          ];
    })
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .visible(isSelected);

  // Rendering

  const bars = chartLayer
    .selectGroup("bars")
    .attr("transform", sszvis.translateString(tableDimensions.centeredOffset, 0))
    .call(barGen);

  bars.selectAll("[data-tooltip-anchor]").call(tooltip);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(tableDimensions.centeredOffset, -10))
    .call(xAxis);

  chartLayer
    .selectGroup("yAxis")
    .attr("transform", sszvis.translateString(tableDimensions.centeredOffset - 10, 0))
    .call(yAxis);

  chartLayer
    .selectGroup("legend")
    .attr(
      "transform",
      sszvis.translateString(
        tableDimensions.centeredOffset + (tableDimensions.width - legendWidth) / 2,
        bounds.innerHeight + 16
      )
    )
    .call(legend);

  // Interaction

  const interactionLayer = sszvis
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

function parseKreisInt(k) {
  return Number.parseInt(k.replace("Kreis ", ""), 10);
}

function sortInt(a, b) {
  return d3.ascending(Number.parseInt(a, 10), Number.parseInt(b, 10));
}

function sortKreisInt(a, b) {
  return d3.ascending(parseKreisInt(a), parseKreisInt(b));
}
