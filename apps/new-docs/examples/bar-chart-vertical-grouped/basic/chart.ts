/**
 * Grouped vertical bar chart example with two small groups per region.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-vertical-grouped
 * @features tooltip
 * @date     2026-09-14
 */

// Magic Numbers

const MAX_WIDTH = 800;

// Types

type Datum = {
  xValue: string;
  category: string;
  yValue: number;
};

type State = {
  data: Datum[];
  regions: string[];
  categories: string[];
  valueExtent: [number, number];
  groupedData: Datum[][];
  longestGroup: number;
  selection: Datum[][];
};

type Actions = {
  showTooltip: (state: State, e: Event, region: string | null, yValue: number | null) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

/** Typed here so the slant reads as the axis' own union rather than as `string`. */
const TEXT_DIRECTION = { _: "diagonal" } satisfies Record<string, import("sszvis").SlantDirection>;

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabelFormat", { _: () => sszvis.formatText })
  .prop("yAxisLabel", { _: "" })
  .prop("textDirection", TEXT_DIRECTION);

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
        xValue: d["Region"] ?? "",
        category: d["Kategorie"] ?? "",
        yValue: sszvis.parseNumber(d["Wert"]),
      }))
      .then((data) => {
        state.data = data;
        state.regions = sszvis.set(data, xAcc);
        state.categories = sszvis.set(data, cAcc);
        state.valueExtent = zeroBasedAxisDomain(d3.extent(data, yAcc));
        state.groupedData = sszvis.cascade<Datum>().arrayBy(xAcc).apply<Datum[][]>(data);
        state.longestGroup = d3.max(state.groupedData, (group) => group.length) ?? 0;
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, region) {
      state.selection = state.groupedData.filter((group) => group.some((d) => xAcc(d) === region));
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.regions.map((region) => props.xLabelFormat(region)),
        legendLabels: state.categories,
        slant: props.textDirection,
      },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds({ top: 25, bottom: legendLayout.bottomPadding }, config.id);

    const chartWidth = Math.min(MAX_WIDTH, bounds.innerWidth);

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .domain(state.regions)
      .padding(0.26)
      .paddingOuter(0.8)
      .rangeRound([0, chartWidth]);

    const yScale = d3.scaleLinear().domain(state.valueExtent).range([bounds.innerHeight, 0]);

    // NOTE: The values can be negative, so a bar starts at the higher of its
    // value and zero, and is as tall as the distance between the two.
    const yPosScale = (v: number) => (Number.isNaN(v) ? yScale(0) : yScale(Math.max(v, 0)));
    const hScale = (v: number) => Math.abs(yScale(v) - yScale(0));

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Import und Export nach Region",
        description: "Veränderung von Import und Export je Region, in Prozent.",
      })
      .datum(state.groupedData);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barLayout = sszvis
      .groupedBarsVertical<Datum>()
      .groupScale((d) => xScale(xAcc(d)))
      .groupWidth(xScale.bandwidth())
      .groupSize(state.longestGroup)
      .y((d) => yPosScale(yAcc(d)))
      .height((d) => hScale(yAcc(d)))
      .fill((d) => cScale(cAcc(d)))
      .defined((d) => !Number.isNaN(yAcc(d)));

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .slant(props.textDirection)
      .tickFormat(props.xLabelFormat)
      .highlightTick((d) =>
        state.selection.some((group) => group[0] !== undefined && xAcc(group[0]) === d),
      );

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .showZeroY(isTwoSidedDomain(state.valueExtent))
      .orient("right")
      .title(props.yAxisLabel);

    const tooltipHeader = sszvis
      .modularTextHTML()
      .plain((group: Datum[]) => (group[0] === undefined ? "" : xAcc(group[0])));

    const tooltip = sszvis
      .tooltip<Datum[]>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      // NOTE: One row per member of the group.
      .body((group) =>
        group.map((d) => {
          const value = yAcc(d);
          return [cAcc(d), Number.isNaN(value) ? "–" : String(value)];
        }),
      )
      .visible((group) => sszvis.contains(state.selection, group));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    const bars = chartLayer.selectGroup("bars").call(barLayout);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding),
      )
      .call(colorLegend);

    // Interaction

    const interactionLayer = sszvis
      .move<string, number>()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.showTooltip)
      .on("end", actions.hideTooltip);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/** A domain that straddles zero needs the zero line drawn on the y axis. */
const isTwoSidedDomain = (extent: [number, number]) => d3.min(extent) !== 0;

/**
 * Extends a data extent so that it reaches zero, keeping the order of its two
 * bounds - a reversed extent stays reversed.
 */
const zeroBasedAxisDomain = (
  extent: [number, number] | [undefined, undefined],
): [number, number] => {
  let [min, max] = extent;
  if (min === undefined || max === undefined) {
    return [0, 0];
  }
  if (min < max) {
    if (min > 0) min = 0;
    if (max < 0) max = 0;
    return [min, max];
  }
  const [flippedMin, flippedMax] = zeroBasedAxisDomain([max, min]);
  return [flippedMax, flippedMin];
};
