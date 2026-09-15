/**
 * Horizontal bar chart with a button group for switching between years.
 *
 * @category bar-chart-horizontal
 */

// Magic Numbers

const MAX_WIDTH = 800;
const MAX_CONTROL_WIDTH = 300;
/** In the x scale's own domain units - commuters - not pixels. */
const BAR_TOUCH_THRESHOLD = 2000;
// NOTE: One series per year, so one colour; the year is chosen with the button
// group and the categories are already named on the y axis.
const SERIES_KEY = "Zupendler";

// Types

type Datum = {
  category: string;
  value: number;
  year: number;
};

type State = {
  data: Datum[];
  categories: string[];
  years: number[];
  selectedYear: number;
  selectedData: Datum[];
  selection: Datum[];
};

type Actions = {
  selectYear: (state: State, e: Event, year: number) => void;
  showTooltip: (state: State, e: Event, xValue: number | null, category: string | null) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("controlWidth", {
  _: (width: number) => Math.min(width, MAX_CONTROL_WIDTH),
});

// Accessors

const xAcc = (d: Datum) => d.value;
const cAcc = (d: Datum) => d.category;
const jAcc = (d: Datum) => d.year;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Sektor"] ?? "",
        value: sszvis.parseNumber(d["Zupendler"]),
        year: sszvis.parseNumber(d["Jahr"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, cAcc);
        state.years = sszvis.set(data, jAcc);
        state.selectedYear = d3.max(state.years) ?? 0;
        state.selectedData = data.filter((d) => jAcc(d) === state.selectedYear);
        state.selection = [];
      }),

  actions: {
    selectYear(state, _e, year) {
      state.selectedYear = year;
      state.selectedData = state.data.filter((d) => jAcc(d) === year);
    },

    showTooltip(state, _e, _xValue, category) {
      state.selection = state.data.filter((d) => cAcc(d) === category);
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
    const bounds = sszvis.bounds(
      { height: 80 + chartDimensions.totalHeight + 33, top: 80, bottom: 25 },
      config.id,
    );
    const props = queryProps(bounds);
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

    const cScale = sszvis.scaleQual12();
    const barFill = cScale(SERIES_KEY);
    const barFillHighlight = cScale.darker()(SERIES_KEY);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Zupendler nach Sektor und Jahr",
        description: "Anzahl Zupendlerinnen und Zupendler je Wirtschaftssektor und Jahr.",
      })
      .datum(state.selectedData);

    const controlLayer = sszvis.createHtmlLayer(config.id, bounds);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      .x(0)
      .y((d) => yScale(cAcc(d)) ?? 0)
      .width((d) => widthScale(xAcc(d)))
      .height(chartDimensions.barHeight)
      .centerTooltip(true)
      .fill((d) => (isSelected(state)(d) ? barFillHighlight : barFill));

    const xAxis = sszvis.axisX().scale(widthScale).orient("bottom").alignOuterLabels(true);

    const yAxis = sszvis.axisY
      .ordinal()
      .scale(yScale)
      .orient("right")
      .highlightTick((d) => state.selection.some((s) => cAcc(s) === String(d)));

    const buttonGroup = sszvis
      .buttonGroup<number>()
      .values(state.years)
      .width(props.controlWidth)
      .current(state.selectedYear)
      .change(actions.selectYear)
      .ariaLabel("Jahr");

    const tooltipHeader = sszvis.modularTextHTML().bold((d: Datum) => {
      const value = xAcc(d);
      return Number.isNaN(value) ? "k. A." : sszvis.formatNumber(value);
    });

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .visible(isSelected(state));

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

    controlLayer
      .selectDiv("controls")
      .style("left", `${Math.max(0, (bounds.innerWidth - buttonGroup.width()) / 2)}px`)
      .style("top", `${20 - bounds.padding.top}px`)
      .call(buttonGroup);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    // Interaction

    // NOTE: The move behavior provides tooltips in the absence of a bar, i.e.
    // when we have missing data.
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

const isSelected = (state: State) => (d: Datum) => sszvis.contains(state.selection, d);

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
  const barDatum = state.data.find((d) => jAcc(d) === state.selectedYear && cAcc(d) === category);
  if (barDatum === undefined) {
    return false;
  }
  return Number.isNaN(xAcc(barDatum))
    ? xValue < BAR_TOUCH_THRESHOLD
    : xValue < Math.max(xAcc(barDatum), BAR_TOUCH_THRESHOLD);
};
