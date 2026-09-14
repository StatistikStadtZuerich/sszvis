/**
 * Horizontal grouped bar chart example using sszvis.
 *
 * @category bar-chart-horizontal-grouped
 */

// Magic Numbers

const MAX_WIDTH = 800;
/** Vertical space in pixels allocated to each region's group of bars. */
const GROUP_HEIGHT = 80;
/** Distance in pixels between the chart area and the colour legend below it. */
const LEGEND_GUTTER = 40;
/** Lifts the right-aligned region labels clear of the group they belong to. */
const Y_LABEL_OFFSET = 10;

// Types

type Datum = {
  region: string;
  category: string;
  value: number;
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
  showTooltip: (state: State, e: Event, xValue: number | null, region: string | null) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("xLabel", { _: "Anzahl" }).prop("ticks", { _: 5 });

// Accessors

const regionAcc = (d: Datum) => d.region;
const categoryAcc = (d: Datum) => d.category;
const valueAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        region: d["Region"] ?? "",
        category: d["Kategorie"] ?? "",
        value: sszvis.parseNumber(d["Wert"] ?? ""),
      }))
      .then((data) => {
        state.data = data;
        state.regions = sszvis.set(data, regionAcc);
        state.categories = sszvis.set(data, categoryAcc);
        state.valueExtent = [0, d3.max(data, valueAcc) ?? 0];
        state.groupedData = sszvis.cascade<Datum>().arrayBy(regionAcc).apply<Datum[][]>(data);
        state.longestGroup = d3.max(state.groupedData, (group) => group.length) ?? 0;
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, _xValue, region) {
      state.selection = state.groupedData.filter((group) =>
        group.some((d) => regionAcc(d) === region),
      );
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const totalHeight = state.regions.length * GROUP_HEIGHT;
    const bounds = sszvis.bounds({ height: 30 + totalHeight + 60, top: 30, bottom: 60 }, config.id);
    const chartWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    const xScale = d3.scaleLinear().range([0, chartWidth]).domain(state.valueExtent).nice();

    const yScale = d3
      .scaleBand<string>()
      .domain(state.regions)
      .range([0, totalHeight])
      .paddingInner(0.3)
      .paddingOuter(0.1);

    const cScale = sszvis.scaleQual6().domain(state.categories);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Einwohner und Arbeitsplätze nach Quartier",
        description: "Einwohnerinnen, Einwohner und Arbeitsplätze je Quartier.",
      })
      .datum(state.groupedData);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barLayout = sszvis
      .groupedBarsHorizontal<Datum>()
      .groupScale((d) => yScale(regionAcc(d)))
      .groupHeight(yScale.bandwidth())
      .groupSize(state.longestGroup)
      // NOTE: required - the horizontal config reads props.x directly, so leaving it
      // unset makes the renderer call undefined and the bars never draw.
      .x(0)
      .width((d) => xScale(valueAcc(d)))
      .fill((d) => cScale(categoryAcc(d)))
      .defined((d) => !Number.isNaN(valueAcc(d)));

    const xAxis = sszvis
      .axisX()
      .scale(xScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(props.ticks)
      .title(props.xLabel);

    const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(cScale)
      .horizontalFloat(true)
      .orientation("horizontal");

    const tooltipHeader = sszvis
      .modularTextHTML()
      .plain((group: Datum[]) => (group[0] === undefined ? "" : regionAcc(group[0])));

    const tooltip = sszvis
      .tooltip<Datum[]>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .body((group) =>
        group.map((d) => {
          const value = valueAcc(d);
          return [categoryAcc(d), Number.isNaN(value) ? "k. A." : sszvis.formatNumber(value)];
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
      .attr("transform", sszvis.translateString(0, totalHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .attr("transform", sszvis.translateString(0, -yScale.bandwidth() / 2 - Y_LABEL_OFFSET))
      .call(yAxis);

    const bars = chartLayer.selectGroup("bars").call(barLayout);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(0, totalHeight + LEGEND_GUTTER))
      .call(colorLegend);

    // Interaction

    const interactionLayer = sszvis
      .move<number, string>()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.showTooltip)
      .on("end", actions.hideTooltip);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});
