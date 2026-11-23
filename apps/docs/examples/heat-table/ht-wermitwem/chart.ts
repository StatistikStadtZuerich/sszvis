/**
 * Heat table of married couples by the age group of each partner.
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
const BIN_EDGES = [5, 40, 200, 600];
/** Gap in pixels between two squares of the table. */
const SQUARE_PADDING = 2;
const TABLE_PADDING = { top: 60, right: 0, bottom: 60, left: 70 };
const MAX_LEGEND_WIDTH = 260;
/** Vertical gap in pixels between the bottom of the table and the legend. */
const LEGEND_OFFSET = 16;
/** Gap in pixels between the table and the axis labels around it. */
const AXIS_OFFSET = 10;

// Types

type Datum = {
  manAge: string;
  womAge: string;
  value: number;
};

type State = {
  data: Datum[];
  manAgeList: string[];
  womAgeList: string[];
  valueDomain: [number, number];
  selection: Datum[];
};

type Actions = {
  showTooltip: (state: State, e: Event, datum: Datum) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("legendWidth", {
  _: (width) => Math.min(width * 0.9, MAX_LEGEND_WIDTH),
});

// Accessors

const xAcc = (d: Datum) => d.manAge;
const yAcc = (d: Datum) => d.womAge;
const vAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        manAge: d["Altersgruppe Männer"] ?? "",
        womAge: d["Altersgruppe Frauen"] ?? "",
        value: sszvis.parseNumber(d["Anzahl"]),
      }))
      .then((data) => {
        const [minValue = 0, maxValue = 0] = d3.extent(data, vAcc);

        state.data = data;
        state.manAgeList = sszvis.set(data, xAcc);
        state.womAgeList = sszvis.set(data, yAcc);
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
      state.manAgeList.length,
      state.womAgeList.length,
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
      .domain(state.manAgeList);

    const yScale = d3
      .scaleBand<string>()
      .padding(tableDimensions.padRatio)
      .paddingOuter(0)
      .rangeRound([0, tableDimensions.height])
      .domain(state.womAgeList);

    // A continuous interpolator, sampled to produce one colour per bin: the range must
    // hold one more value than the threshold scale's domain.
    const interpolateColor = sszvis.scaleSeqBlu().domain(state.valueDomain);
    const binColors = [...BIN_EDGES, state.valueDomain[1]].map((v) => String(interpolateColor(v)));

    const colorScale = d3.scaleThreshold<number, string>().domain(BIN_EDGES).range(binColors);

    // A zero reads as an absence rather than as the low end of the scale.
    const cValue = (d: Datum) =>
      vAcc(d) === 0 ? String(sszvis.scaleLightGry()(0)) : colorScale(vAcc(d));

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Verheiratete Paare nach Alter der Partner",
        description: "Anzahl Paare je Kombination von Altersgruppe des Mannes und der Frau.",
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
      .title("Altersgruppe Männer")
      .titleAnchor("middle")
      .titleCenter(true)
      .slant("vertical")
      .dyTitle(-36)
      .hideLabelThreshold(0)
      .highlightTick((tickValue) => state.selection.some((d) => xAcc(d) === tickValue));

    const yAxis = sszvis.axisY
      .ordinal()
      .scale(yScale)
      .orient("left")
      .title("Altersgruppe Frauen")
      .titleVertical(true)
      .titleAnchor("middle")
      .titleCenter(true)
      .dxTitle(-45)
      .highlightTick((tickValue) => state.selection.some((d) => yAcc(d) === tickValue));

    const legend = sszvis
      .legendColorBinned()
      .scale(colorScale)
      .displayValues(BIN_EDGES)
      .endpoints(state.valueDomain)
      .width(props.legendWidth)
      .labelFormat(sszvis.formatNumber);

    const tooltipHeaderText = sszvis.modularTextHTML().bold("Paare");

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .header(tooltipHeaderText)
      .body((d) => [
        ["Alter des Mannes:", xAcc(d)],
        ["Alter der Frau:", yAcc(d)],
        ["Anzahl: ", String(vAcc(d))],
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

    // NOTE: On very narrow screens the legend is centred on the screen rather than on
    // the table, which is then narrower than the legend itself.
    const legendX =
      tableDimensions.width < MAX_LEGEND_WIDTH
        ? (bounds.width - props.legendWidth) / 2 - bounds.padding.left
        : tableDimensions.centeredOffset + (tableDimensions.width - props.legendWidth) / 2;

    chartLayer
      .selectGroup("legend")
      .attr("transform", sszvis.translateString(legendX, bounds.innerHeight + LEGEND_OFFSET))
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
