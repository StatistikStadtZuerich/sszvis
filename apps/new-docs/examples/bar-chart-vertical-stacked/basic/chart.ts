/**
 * Stacked vertical bar chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-vertical-stacked
 * @features tooltip, legend
 * @date     2026-09-14
 */

// Magic Numbers

const MAX_WIDTH = 800;
/** Lifts the y axis title clear of the topmost tick label. */
const Y_TITLE_OFFSET = -20;

// Types

type Datum = {
  xValue: string;
  category: string;
  yValue: number;
};

/** One layer of the stack, as `stackedBarVerticalLayout` hands it over. */
type Series = import("sszvis").StackedBarSeries<Datum>;

/** One slice of one bar: the stacked bounds plus the datum they were built from. */
type Slice = import("sszvis").StackedBarSlice<Datum>;

type State = {
  data: Datum[];
  years: string[];
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

/** Typed here so the slant reads as the axis' own union rather than as `string`. */
const X_SLANT = { palm: "vertical", _: "horizontal" } satisfies Record<
  string,
  import("sszvis").SlantDirection
>;

const queryProps = sszvis
  .responsiveProps()
  .prop("bottomPadding", { _: null })
  .prop("barPadding", { palm: 0.7, _: 0.34 })
  .prop("leftPadding", { _: null })
  .prop("xLabel", { _: "" })
  .prop("xLabelFormat", { _: () => sszvis.formatText })
  .prop("xSlant", X_SLANT)
  .prop("yLabel", { _: "Beschäftigte" })
  .prop("yLabelFormat", { _: () => sszvis.formatNumber });

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
        xValue: d["Jahr"] ?? "",
        category: d["Berufsfeld"] ?? "",
        yValue: sszvis.parseNumber(d["Anzahl"]),
      }))
      .then((data) => {
        const layout = sszvis.stackedBarVerticalLayout(xAcc, cAcc, yAcc)(data);
        state.data = data;
        state.years = sszvis.set(data, xAcc);
        state.categories = layout.keys;
        state.stackedData = layout.series;
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

    // NOTE: The legend decides how much room the chart has to leave below it,
    // so it is laid out before the bounds it feeds into.
    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.years.map((year) => props.xLabelFormat(year)),
        legendLabels: state.categories,
        slant: props.xSlant,
      },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds(
      {
        top: 30,
        bottom: props.bottomPadding == null ? legendLayout.bottomPadding : props.bottomPadding,
        left:
          props.leftPadding == null
            ? sszvis.measureAxisLabel(props.yLabelFormat(state.maxStacked))
            : props.leftPadding,
      },
      config.id,
    );

    const chartDimensions = sszvis.dimensionsVerticalBarChart(
      Math.min(MAX_WIDTH, bounds.innerWidth),
      state.categories.length,
    );

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .domain(state.years)
      .padding(chartDimensions.padRatio)
      .paddingOuter(props.barPadding)
      .range([0, chartDimensions.totalWidth]);

    const yScale = d3.scaleLinear().domain([0, state.maxStacked]).range([bounds.innerHeight, 0]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Beschäftigte nach Berufsfeld und Jahr",
        description:
          "Die Anzahl der Beschäftigten nahm seit 1980 um 40% zu und liegt heute bei ca. 180000 Beschäftigten.",
      })
      .datum(state.stackedData);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const stackedBars = sszvis
      .stackedBarVertical<Datum>()
      .xScale(xScale)
      .width(xScale.bandwidth())
      .yScale(yScale)
      .fill((slice) => {
        if (slice.data === undefined) {
          return undefined;
        }
        const color = cScale(cAcc(slice.data));
        return isSelected(state)(slice) ? sszvis.slightlyDarker(color) : color;
      });

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .slant(props.xSlant)
      .tickFormat(props.xLabelFormat)
      .title(props.xLabel);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .title(props.yLabel)
      .tickFormat((d) => props.yLabelFormat(Number(d)))
      .dyTitle(Y_TITLE_OFFSET);

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((slice: Slice) => (slice.data === undefined ? "" : cAcc(slice.data)));

    const tooltipText = sszvis
      .modularTextHTML()
      .plain((slice: Slice) =>
        slice.data === undefined ? "" : sszvis.formatNumber(yAcc(slice.data)),
      );

    const tooltip = sszvis
      .tooltip<Slice>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .body(tooltipText)
      .visible(isSelected(state));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(
        bounds.innerWidth / 2 - chartDimensions.totalWidth / 2,
        bounds.padding.top,
      ),
    );

    const bars = chartLayer
      .selectGroup("barchart")
      .attr("transform", sszvis.translateString(bounds.padding.left, 0))
      .call(stackedBars);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    bars
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding),
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

// Helper functions

const isSelected = (state: State) => (d: Slice) => sszvis.contains(state.selection, d);
