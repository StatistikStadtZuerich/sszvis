/**
 * Heat table of the population of each Zurich Kreis by age group.
 *
 * @category heat-table
 */

// Magic Numbers

/** Gap in pixels between two squares of the table. */
const SQUARE_PADDING = 2;
const TABLE_PADDING = { top: 60, right: 0, bottom: 40, left: 66 };
const MAX_LEGEND_WIDTH = 260;
/** Vertical gap in pixels between the bottom of the table and the legend. */
const LEGEND_OFFSET = 16;
/** Gap in pixels between the table and the axis labels around it. */
const AXIS_OFFSET = 10;

// Types

type Datum = {
  xPosition: string;
  yPosition: string;
  value: number;
};

type State = {
  data: Datum[];
  xList: string[];
  yList: string[];
  valueDomain: [number, number];
  selection: Datum[];
};

type Actions = {
  showTooltip: (state: State, e: Event, datum: Datum) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  // The slant values are a closed set in the library, so the prop is typed as one.
  .prop<"xAxisSlant", "vertical" | "diagonal">("xAxisSlant", {
    palm: "vertical",
    _: "diagonal",
  })
  .prop("xAxisLabel", { _: "Kreis" })
  .prop("yAxisLabel", { _: "Altersgruppe" })
  .prop("valueLabel", { _: "Einwohner" })
  // Which axis the tooltip takes its title from, and what is appended to it.
  .prop("tSourceAxis", { _: "x" })
  .prop("tTitleAdd", { _: "" });

// Accessors

const xAcc = (d: Datum) => d.xPosition;
const yAcc = (d: Datum) => d.yPosition;
const vAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        xPosition: d["KName"] ?? "",
        yPosition: d["Altersgruppe"] ?? "",
        value: sszvis.parseNumber(d["Anzahl"] ?? ""),
      }))
      .then((data) => {
        const [minValue = 0, maxValue = 0] = d3.extent(data, vAcc);

        state.data = data;
        state.yList = sszvis.set(data, yAcc).sort(compareLeadingNumber);
        state.xList = sszvis.set(data, xAcc).sort(compareKreis);
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
      state.xList.length,
      state.yList.length,
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

    const props = queryProps(sszvis.measureDimensions(config.id));

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .padding(tableDimensions.padRatio)
      .paddingOuter(0)
      .rangeRound([0, tableDimensions.width])
      .domain(state.xList);

    const yScale = d3
      .scaleBand<string>()
      .padding(tableDimensions.padRatio)
      .paddingOuter(0)
      .rangeRound([0, tableDimensions.height])
      .domain(state.yList);

    const colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

    const cValue = (d: Datum) => {
      const value = vAcc(d);
      if (Number.isNaN(value)) {
        return "url(#ht-missing-value)";
      }
      // A zero reads as an absence rather than as the low end of the scale.
      return String(value === 0 ? sszvis.scaleLightGry()(value) : colorScale(value));
    };

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Einwohnerinnen und Einwohner nach Kreis und Altersgruppe",
        description: "Anzahl Einwohner je Stadtkreis und Altersgruppe.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // The pattern that stands in for a missing value has to exist before it is referenced.
    sszvis
      .ensureDefsElement(chartLayer, "pattern", "ht-missing-value")
      .call(sszvis.heatTableMissingValuePattern);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      .x((d) => xScale(xAcc(d)) ?? 0)
      .y((d) => yScale(yAcc(d)) ?? 0)
      .width(tableDimensions.side)
      .height(tableDimensions.side)
      .fill(cValue)
      .stroke((d) =>
        !Number.isNaN(vAcc(d)) && sszvis.contains(state.selection, d)
          ? String(sszvis.slightlyDarker(cValue(d)))
          : "none",
      );

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("top")
      .slant(props.xAxisSlant)
      .tickSize(0)
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

    const legendWidth = Math.min(bounds.innerWidth / 2, MAX_LEGEND_WIDTH);

    const legend = sszvis
      .legendColorLinear()
      .scale(colorScale)
      .width(legendWidth)
      .labelFormat(sszvis.formatNumber);

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .header((d) =>
        props.tSourceAxis === "y"
          ? `${yAcc(d)} ${props.tTitleAdd}`
          : `${xAcc(d)} ${props.tTitleAdd}`,
      )
      .body((d) => {
        const value = vAcc(d);
        const formatted = Number.isNaN(value) ? "–" : sszvis.formatNumber(value);
        return props.tSourceAxis === "y"
          ? [
              [props.xAxisLabel, xAcc(d)],
              [props.valueLabel, formatted],
            ]
          : [
              [props.yAxisLabel, yAcc(d)],
              [props.valueLabel, formatted],
            ];
      })
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
          tableDimensions.centeredOffset + (tableDimensions.width - legendWidth) / 2,
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

// Helper functions

/** Sorts age-group labels such as "5-9" by the number they start with. */
const compareLeadingNumber = (a: string, b: string) =>
  d3.ascending(Number.parseInt(a, 10), Number.parseInt(b, 10));

/** Sorts labels such as "Kreis 11" by their number rather than alphabetically. */
const compareKreis = (a: string, b: string) => d3.ascending(parseKreis(a), parseKreis(b));

const parseKreis = (label: string) => Number.parseInt(label.replace("Kreis ", ""), 10);
