/**
 * Heat table whose values are binned onto a diverging colour scale.
 *
 * @sszvis   3.5.1
 * @chart    heat-table
 * @features tooltip, legend
 * @date     2026-09-14
 */

// Magic Numbers

/**
 * The internal edges of the bins the colour scale uses.
 *
 * NOTE: d3.scaleThreshold takes only the internal edges, so no fixed upper or lower
 * bound may be given: anything at or below the first edge lands in the first bin, and
 * anything at or above the last edge lands in the last one.
 */
const BIN_EDGES = d3.range(100, 1000, 100);
/** Gap in pixels between two squares of the table. */
const SQUARE_PADDING = 2;
const TABLE_PADDING = { top: 40, right: 0, bottom: 60, left: 40 };
const MAX_LEGEND_WIDTH = 260;
/** Vertical gap in pixels between the bottom of the table and the legend. */
const LEGEND_OFFSET = 16;
/** Gap in pixels between the table and the axis labels around it. */
const AXIS_OFFSET = 10;

// Types

type Datum = {
  g1: string;
  g2: string;
  value: number;
};

type State = {
  data: Datum[];
  g1List: string[];
  g2List: string[];
  valueDomain: [number, number];
  selection: Datum[];
};

type Actions = {
  showTooltip: (state: State, e: Event, datum: Datum) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("legendWidth", {
  _: (width) => Math.min(width * 0.8, MAX_LEGEND_WIDTH),
});

// Accessors

const xAcc = (d: Datum) => d.g1;
const yAcc = (d: Datum) => d.g2;
const vAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        g1: d["Group1"] ?? "",
        g2: d["Group2"] ?? "",
        value: sszvis.parseNumber(d["Value"]),
      }))
      .then((data) => {
        const [minValue = 0, maxValue = 0] = d3.extent(data, vAcc);

        state.data = data;
        state.g1List = sszvis.set(data, xAcc);
        state.g2List = sszvis.set(data, yAcc);
        state.valueDomain = [minValue, maxValue];
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, datum) {
      state.selection = [datum];
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const containerWidth = sszvis.measureDimensions(config.id).width ?? 0;
    // NOTE: dimensionsHeatTable derives the square size and the table's own extent
    // from a targeted width; the width it returns will not usually match that.
    const tableDimensions = sszvis.dimensionsHeatTable(
      containerWidth,
      SQUARE_PADDING,
      state.g1List.length,
      state.g2List.length,
      TABLE_PADDING,
    );

    // NOTE: The padding is added back into the height, because bounds subtracts it
    // again to arrive at innerWidth and innerHeight - and those are what has to
    // match the table's own dimensions.
    const bounds = sszvis.bounds(
      {
        height: TABLE_PADDING.top + tableDimensions.height + TABLE_PADDING.bottom,
        left: TABLE_PADDING.left,
        right: TABLE_PADDING.right,
        top: TABLE_PADDING.top,
        bottom: TABLE_PADDING.bottom,
      },
      config.id,
    );
    const props = queryProps(bounds);

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .padding(tableDimensions.padRatio)
      .paddingOuter(0)
      .rangeRound([0, tableDimensions.width])
      .domain(state.g1List);

    const yScale = d3
      .scaleBand<string>()
      .padding(tableDimensions.padRatio)
      .paddingOuter(0)
      .rangeRound([0, tableDimensions.height])
      .domain(state.g2List);

    // A continuous interpolator, sampled at equal steps along the data domain to give
    // the threshold scale one colour per bin.
    const interpolateColor = sszvis.scaleDivVal().domain(state.valueDomain);
    const binColors = d3.range(0, 10_001, 110).map((v) => String(interpolateColor(v)));

    const colorScale = d3.scaleThreshold<number, string>().domain(BIN_EDGES).range(binColors);

    const cValue = (d: Datum) => colorScale(vAcc(d));

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Werte nach Gruppe 1 und Gruppe 2",
        description: "Beispieldaten, farblich in Wertebereiche eingeteilt.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      .x((d) => xScale(xAcc(d)) ?? 0)
      .y((d) => yScale(yAcc(d)) ?? 0)
      .width(tableDimensions.side)
      .height(tableDimensions.side)
      .fill(cValue)
      .stroke((d) =>
        sszvis.contains(state.selection, d) ? String(sszvis.slightlyDarker(cValue(d))) : "none",
      );

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("top")
      .tickSize(0)
      .tickPadding(0)
      .title("Group 1")
      .titleAnchor("middle")
      .titleCenter(true)
      .dyTitle(-20)
      .highlightTick((tickValue) => state.selection.some((d) => xAcc(d) === tickValue));

    const yAxis = sszvis.axisY
      .ordinal()
      .scale(yScale)
      .orient("left")
      .title("Group 2")
      .titleVertical(true)
      .titleAnchor("middle")
      .titleCenter(true)
      .dxTitle(-20)
      .highlightTick((tickValue) => state.selection.some((d) => yAcc(d) === tickValue));

    const legend = sszvis
      .legendColorBinned()
      .scale(colorScale)
      .displayValues(BIN_EDGES)
      .endpoints(state.valueDomain)
      .width(props.legendWidth)
      .labelFormat(sszvis.formatNumber);

    const tooltipHeaderText = sszvis.modularTextHTML().bold("Units");

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .header(tooltipHeaderText)
      .body((d) => [
        ["Group 1", xAcc(d)],
        ["Group 2", yAcc(d)],
        ["Wert", String(vAcc(d))],
      ])
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible((d) => sszvis.contains(state.selection, d));

    // Rendering

    const bars = chartLayer
      .selectGroup("bars")
      .attr("transform", sszvis.translateString(tableDimensions.centeredOffset, 0))
      .call(barGen);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(tableDimensions.centeredOffset, -AXIS_OFFSET))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .attr("transform", sszvis.translateString(tableDimensions.centeredOffset - AXIS_OFFSET, 0))
      .call(yAxis);

    chartLayer
      .selectGroup("legend")
      .attr(
        "transform",
        sszvis.translateString(
          tableDimensions.centeredOffset + (tableDimensions.width - props.legendWidth) / 2,
          bounds.innerHeight + LEGEND_OFFSET,
        ),
      )
      .call(legend);

    // Interaction

    const interactionLayer = sszvis
      .panning<Datum>()
      .elementSelector(".sszvis-bar")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    bars.call(interactionLayer);
  },
});
