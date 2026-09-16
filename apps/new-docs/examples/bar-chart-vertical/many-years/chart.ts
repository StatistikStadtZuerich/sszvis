/**
 * Vertical bar chart example showing a single series over many years.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-vertical
 * @features tooltip
 * @date     2026-09-14
 */

// Magic Numbers

// NOTE: The chart shows a single series, so every bar uses the same palette
// colour; this is the ordinal scale's only key.
const SERIES_KEY = "Hotelübernachtungen";
/** Extra space in pixels between the y axis labels and the chart area. */
const Y_LABEL_GUTTER = 10;

// Types

type Datum = {
  year: string;
  value: number;
};

type State = {
  data: Datum[];
  categories: string[];
  selection: Datum[];
};

type Actions = {
  changeYear: (state: State, e: Event, year: string | null, yValue: number | null) => void;
  resetYear: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("barPadding", { palm: 0.2, _: 0.1 })
  .prop("leftPadding", { _: null })
  .prop("yLabelFormat", { _: () => sszvis.formatNumber });

// Accessors

const xAcc = (d: Datum) => d.year;
const yAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        year: d["Jahr"] ?? "",
        value: sszvis.parseNumber(d["Hotelübernachtungen"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, xAcc);
        state.selection = [];
      }),

  actions: {
    // NOTE: The move behavior inverts the pointer position through the band
    // scale, so it hands back a year from the scale's domain, or null outside
    // of it.
    changeYear(state, _e, year) {
      state.selection = state.data.filter((d) => xAcc(d) === year);
    },

    resetYear(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const yMax = d3.max(state.data, yAcc) ?? 0;
    const bounds = sszvis.bounds(
      {
        top: 3,
        bottom: 25,
        left:
          props.leftPadding == null
            ? sszvis.measureAxisLabel(props.yLabelFormat(yMax)) + Y_LABEL_GUTTER
            : props.leftPadding,
      },
      config.id,
    );

    const chartDimensions = sszvis.dimensionsVerticalBarChart(
      bounds.innerWidth,
      state.categories.length,
    );

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .domain(state.categories)
      .padding(chartDimensions.padRatio)
      .paddingOuter(props.barPadding)
      .range([0, chartDimensions.totalWidth]);

    const heightScale = d3.scaleLinear().domain([0, yMax]).range([0, bounds.innerHeight]);

    const yPosScale = heightScale.copy().range([...heightScale.range()].reverse());

    const cScale = sszvis.scaleQual12();
    const barFill = cScale(SERIES_KEY);
    const barFillHighlight = cScale.darker()(SERIES_KEY);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Hotelübernachtungen in der Stadt Zürich",
        description: "Anzahl Hotelübernachtungen pro Jahr seit 1919.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      // NOTE: The band scale's domain is built from the data, so every datum has
      // a position; the fallback only satisfies its `number | undefined` return.
      .x((d) => xScale(xAcc(d)) ?? 0)
      // NOTE: Rounding the y-position and the height prevents the bars from
      // jumping around as the chart is resized.
      .y((d) => Math.round(yPosScale(yAcc(d))))
      .width(xScale.bandwidth())
      .height((d) => Math.round(heightScale(yAcc(d))))
      .fill((d) => (isSelected(state)(d) ? barFillHighlight : barFill));

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(5);

    const yAxis = sszvis.axisY().scale(yPosScale).orient("right");

    const tooltipTitle = sszvis
      .modularTextHTML()
      .bold((d: Datum) => sszvis.formatNumber(yAcc(d)))
      .plain("Hotelübernachtungen");

    const tooltip = sszvis
      .tooltip<Datum>()
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .renderInto(tooltipLayer)
      .header(tooltipTitle)
      .body((d) => `Im Jahr ${xAcc(d)}`)
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
      .selectGroup("bars")
      .attr("transform", sszvis.translateString(bounds.padding.left, 0))
      .call(barGen);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    bars
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    // Interaction

    const interactionLayer = sszvis
      .move<string, number>()
      .xScale(xScale)
      .yScale(yPosScale)
      .on("move", actions.changeYear)
      .on("end", actions.resetYear);

    bars.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

const isSelected = (state: State) => (d: Datum) => sszvis.contains(state.selection, d);
