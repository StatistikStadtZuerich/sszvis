/**
 * Stacked horizontal bar chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-horizontal-stacked
 * @features tooltip
 * @date     2026-09-14
 */

// Magic Numbers

const MAX_WIDTH = 800;
const PADDING_TOP = 20;

// Types

type Datum = {
  category: string;
  yValue: string;
  xValue: number;
};

/** One layer of the stack, as `stackedBarHorizontalLayout` hands it over. */
type Series = import("sszvis").StackedBarSeries<Datum>;

/** One slice of one bar: the stacked bounds plus the datum they were built from. */
type Slice = import("sszvis").StackedBarSlice<Datum>;

type State = {
  data: Datum[];
  yValues: string[];
  categories: string[];
  stackedData: Series[];
  maxStacked: number;
  selection: Slice[];
};

type Actions = {
  showTooltip: (state: State, e: Event, slice: Slice) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bottomPadding", { _: null })
  .prop("xLabel", { _: "Prozent" })
  .prop("xLabelFormat", { _: () => sszvis.formatText })
  .prop("ticks", { _: 4 });

// Accessors

const xAcc = (d: Datum) => d.xValue;
const yAcc = (d: Datum) => d.yValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Branche"] ?? "",
        yValue: d["Gebiet"] ?? "",
        xValue: sszvis.parseNumber(d["BIP"]),
      }))
      .then((data) => {
        const layout = sszvis.stackedBarHorizontalLayout(yAcc, cAcc, xAcc)(data);
        state.data = data;
        state.yValues = sszvis.set(data, yAcc);
        state.stackedData = layout.series;
        state.categories = layout.keys;
        state.maxStacked = layout.maxValue;
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, slice) {
      state.selection = [slice];
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      // NOTE: The labels are horizontal, so the legend reserves a fixed
      // padding for the axis and never measures `axisLabels`.
      { legendLabels: state.categories },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    // NOTE: The height and the bottom padding both depend on how many rows the
    // legend needed, so the legend has to be laid out before the bounds.
    const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.yValues.length);
    const bottomPadding =
      props.bottomPadding == null ? legendLayout.bottomPadding : props.bottomPadding;
    const bounds = sszvis.bounds(
      {
        height: PADDING_TOP + chartDimensions.totalHeight + bottomPadding,
        top: PADDING_TOP,
        bottom: bottomPadding,
      },
      config.id,
    );
    const chartWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    const xScale = d3.scaleLinear().domain([0, state.maxStacked]).range([0, chartWidth]);

    const yScale = d3
      .scaleBand<string>()
      .domain(state.yValues)
      .padding(chartDimensions.padRatio)
      .paddingOuter(chartDimensions.outerRatio)
      .range([0, chartDimensions.totalHeight]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Bruttoinlandprodukt nach Branche",
        description: "Anteil der Branchen am Bruttoinlandprodukt je Gebiet.",
      })
      .datum(state.stackedData);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const horizontalBars = sszvis
      .stackedBarHorizontal<Datum>()
      .xScale(xScale)
      .height(chartDimensions.barHeight)
      .yScale(yScale)
      .fill((slice) => (slice.data === undefined ? undefined : cScale(cAcc(slice.data))));

    const xAxis = sszvis
      .axisX()
      .scale(xScale)
      .orient("bottom")
      .tickFormat(props.xLabelFormat)
      .title(props.xLabel)
      .alignOuterLabels(true)
      .ticks(props.ticks);

    const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((slice: Slice) => (slice.data === undefined ? "" : cAcc(slice.data)));

    const tooltipText = sszvis
      .modularTextHTML()
      .plain((slice: Slice) =>
        slice.data === undefined ? "" : sszvis.formatPercent(xAcc(slice.data)),
      );

    const tooltip = sszvis
      .tooltip<Slice>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .body(tooltipText)
      .visible((slice) => sszvis.contains(state.selection, slice));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    const bars = chartLayer.selectGroup("barchart").call(horizontalBars);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.totalHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.axisOffset))
      .call(yAxis);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(0, chartDimensions.totalHeight + legendLayout.axisLabelPadding),
      )
      .call(colorLegend);

    // Interaction

    const interactionLayer = sszvis
      .panning<Slice>()
      .elementSelector(".sszvis-bar")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    bars.call(interactionLayer);
  },
});
