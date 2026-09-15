/**
 * Basic vertical bar chart example using sszvis.
 *
 * @category bar-chart-vertical
 */

// Magic Numbers

const MAX_WIDTH = 800;
// NOTE: One series, so one colour: the categories are already named on the x axis.
const SERIES_KEY = "Beschäftigte";

// Types

type Datum = {
  category: string;
  yValue: number;
};

type State = {
  data: Datum[];
  categories: string[];
  selection: Datum[];
};

type Actions = {
  showTooltip: (state: State, e: Event, category: string | null, yValue: number | null) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

/** Typed here so the slant reads as the axis' own union rather than as `string`. */
const SLANT: { palm: import("sszvis").SlantDirection; _: import("sszvis").SlantDirection } = {
  palm: "vertical",
  _: "horizontal",
};

const queryProps = sszvis
  .responsiveProps()
  .prop("barPadding", { palm: 0.4, _: 0.2 })
  .prop("bottomPadding", { palm: 140, _: 60 })
  .prop("leftPadding", { _: null })
  .prop("slant", SLANT)
  .prop("yLabelFormat", { _: () => sszvis.formatNumber });

// Accessors

const xAcc = (d: Datum) => d.category;
const yAcc = (d: Datum) => d.yValue;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Sektor"] ?? "",
        yValue: sszvis.parseNumber(d["Anzahl"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = data.map(xAcc);
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, category) {
      state.selection = state.data.filter((d) => xAcc(d) === category);
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const yMax = d3.max(state.data, yAcc) ?? 0;
    const bounds = sszvis.bounds(
      {
        top: 3,
        bottom: props.bottomPadding,
        left:
          props.leftPadding == null
            ? sszvis.measureAxisLabel(props.yLabelFormat(yMax))
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
        title: "Beschäftigte nach Sektor",
        description: "Anzahl Beschäftigte je Wirtschaftssektor.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      .x((d) => xScale(xAcc(d)) ?? 0)
      // NOTE: A bar with no value is parked on the baseline rather than being
      // positioned from a NaN, which would write an invalid attribute.
      .y((d) => {
        const yPos = yPosScale(yAcc(d));
        return Number.isNaN(yPos) ? (yPosScale.range()[0] ?? 0) : yPos;
      })
      // NOTE: Because we use sszvis.move in this example, the bars have to be
      // exactly as wide as the scale's bandwidth. This results in slightly
      // narrower bars than the default.
      .width(xScale.bandwidth())
      .height((d) => heightScale(yAcc(d)))
      .centerTooltip(true)
      .fill((d) => (isSelected(state)(d) ? barFillHighlight : barFill));

    const xAxis = sszvis.axisX.ordinal().scale(xScale).orient("bottom").slant(props.slant);

    if (props.slant === "horizontal") {
      xAxis.textWrap(xScale.step());
    }

    const yAxis = sszvis.axisY().scale(yPosScale).orient("right");

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d: Datum) => {
        const yValue = yAcc(d);
        return Number.isNaN(yValue) ? "keine" : sszvis.formatNumber(yValue);
      })
      .plain("Beschäftigte");

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
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

    // NOTE: The move behavior provides tooltips in the absence of a bar, i.e.
    // when we have missing data.
    const interactionLayer = sszvis
      .move<string, number>()
      .xScale(xScale)
      .yScale(yPosScale)
      .on("move", actions.showTooltip)
      .on("end", actions.hideTooltip);

    bars.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

const isSelected = (state: State) => (d: Datum) => sszvis.contains(state.selection, d);
