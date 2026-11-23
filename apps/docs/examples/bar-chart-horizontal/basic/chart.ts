/**
 * Basic horizontal bar chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-horizontal
 * @features tooltip
 * @date     2026-09-14
 */

// Magic Numbers

const MAX_WIDTH = 800;
/** In the x scale's own domain units - employees - not pixels. */
const BAR_TOUCH_THRESHOLD = 1000;
const SERIES_KEY = "Zupendler";

// Types

type Datum = {
  category: string;
  xValue: number;
};

type State = {
  data: Datum[];
  categories: string[];
  selection: Datum[];
};

type Actions = {
  showTooltip: (state: State, e: Event, xValue: number | null, category: string | null) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabel", { _: "Beschäftigte" })
  .prop("ticks", { palm: 4, _: 5 });

// Accessors

const xAcc = (d: Datum) => d.xValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Sektor"] ?? "",
        xValue: sszvis.parseNumber(d["Zupendler"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, cAcc);
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, _xValue, category) {
      state.selection = state.data.filter((d) => cAcc(d) === category);
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  // Render
  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
    const bounds = sszvis.bounds(
      {
        height: 30 + chartDimensions.totalHeight + 40,
        top: 30,
        bottom: 40,
      },
      config.id,
    );
    const chartWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    const widthScale = d3
      .scaleLinear()
      .range([0, chartWidth])
      .domain([0, d3.max(state.data, xAcc) ?? 0]);

    const yScale = d3
      .scaleBand<string>()
      .padding(chartDimensions.padRatio)
      .paddingOuter(chartDimensions.outerRatio)
      .rangeRound([0, chartDimensions.totalHeight])
      .domain(state.categories);

    // NOTE: One series, so one colour: the categories are already named on the y axis
    const barFill = sszvis.scaleQual12()(SERIES_KEY);

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Zupendler nach Sektor",
      description: "Anzahl Zupendlerinnen und Zupendler je Wirtschaftssektor.",
    });
    chartLayer.datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      .x(0)
      .y((d) => yScale(cAcc(d)) ?? 0)
      .width((d) => widthScale(xAcc(d)))
      .height(chartDimensions.barHeight)
      .centerTooltip(true)
      .fill(barFill);

    const xAxis = sszvis
      .axisX()
      .scale(widthScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(props.ticks)
      .title(props.xLabel);

    const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d: Datum) => {
        const value = xAcc(d);
        return Number.isNaN(value) ? "k. A." : sszvis.formatNumber(value);
      })
      .plain(props.xLabel);

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .visible((d) => sszvis.contains(state.selection, d));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    const bars = chartLayer.selectGroup("bars").call(barGen);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.totalHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.axisOffset))
      .call(yAxis);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    // Interaction

    const interactionLayer = sszvis
      .move<number, string>()
      .xScale(widthScale)
      .yScale(yScale)
      .cancelScrolling(isWithinBarContour(state))
      .fireOnPanOnly(true)
      .on("move", actions.showTooltip)
      .on("end", actions.hideTooltip);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/**
 * On touch devices, scrolling is cancelled while the cursor is over a bar, so
 * that a pan gesture reads as a tooltip query. Bars that are very short, or
 * that have no value at all, are still reachable within
 * `BAR_TOUCH_THRESHOLD` of the zero line.
 */
const isWithinBarContour = (state: State) => (xValue: number | null, category: string | null) => {
  if (xValue == null || category == null) {
    return false;
  }
  const barDatum = state.data.find((d) => cAcc(d) === category);
  if (barDatum === undefined) {
    return false;
  }
  return Number.isNaN(xAcc(barDatum))
    ? xValue < BAR_TOUCH_THRESHOLD
    : xValue < Math.max(xAcc(barDatum), BAR_TOUCH_THRESHOLD);
};
